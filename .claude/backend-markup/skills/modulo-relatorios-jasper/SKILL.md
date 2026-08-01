---
name: modulo-relatorios-jasper
description: Módulo exclusivo de relatórios do backend Markup — JasperReports (JRXML → PDF/XLSX), catálogo de relatórios, datasource por DTO, download autenticado e isolamento multi-empresa. Use ao criar ou alterar qualquer relatório/documento do sistema.
metadata:
  domain: backend-markup
  kind: skill
  origin: Requisito do usuário (2026-08-01) — relatórios via JasperReports em módulo próprio
  spec: .claude/specs/modulo-relatorios-jasper/
---

# Módulo de Relatórios (JasperReports)

Todo documento que o usuário leva para fora da tela — PDF, planilha, impressão —
nasce **aqui**, em `com.markup.reports`, e em nenhum outro lugar
([[R12-relatorios-no-backend]]).

## Layout do módulo

```text
backend/src/main/
├── java/com/markup/reports/          ← MÓDULO EXCLUSIVO DE RELATÓRIOS
│   ├── ReportsController.java        ← REST: download autenticado do binário
│   ├── ReportService.java            ← orquestra: autoriza → busca → preenche
│   ├── JasperEngine.java             ← compila/cacheia .jasper e exporta
│   ├── ReportCatalog.java            ← enum: template + permissão + escopo
│   ├── ReportRequest.java            ← record de entrada (tipo + parâmetros)
│   ├── datasource/                   ← records de linha, um por relatório
│   │   ├── FichaTecnicaRow.java
│   │   ├── PrecificacaoRow.java
│   │   └── GestaoEmpresaRow.java
│   └── exception/ReportException.java
└── resources/reports/
    ├── ficha-tecnica-produto.jrxml
    ├── lista-precificacao.jrxml
    ├── despesas-fixas.jrxml
    ├── gestao-empresas-usuarios.jrxml
    └── shared/
        ├── markup-styles.jrtx        ← estilos comuns (fontes, cores, cabeçalho)
        └── sub-faixa-negociacao.jrxml
```

**Dependência num sentido só:** `reports` importa `service/` (leitura); nenhum
pacote de domínio importa `reports`. Se um service precisar chamar relatório,
o desenho está errado — quem chama é o controller do módulo.

## Dependências (pom.xml)

```xml
<dependency>
  <groupId>net.sf.jasperreports</groupId>
  <artifactId>jasperreports</artifactId>
  <version>7.0.1</version>
</dependency>
<dependency>                          <!-- fontes p/ PDF sem depender do SO -->
  <groupId>net.sf.jasperreports</groupId>
  <artifactId>jasperreports-fonts</artifactId>
  <version>7.0.1</version>
</dependency>
<dependency>                          <!-- exportação XLSX (opcional) -->
  <groupId>net.sf.jasperreports</groupId>
  <artifactId>jasperreports-poi</artifactId>
  <version>7.0.1</version>
</dependency>
```

## Catálogo de relatórios

Um enum é a única porta de entrada: sem entrada no catálogo, não existe
relatório. Ele amarra template, permissão e escopo no mesmo lugar.

```java
public enum ReportCatalog {

    FICHA_TECNICA_PRODUTO("ficha-tecnica-produto", "PRODUTO_READ",  Escopo.EMPRESA),
    LISTA_PRECIFICACAO   ("lista-precificacao",    "RELATORIO_READ", Escopo.EMPRESA),
    DESPESAS_FIXAS       ("despesas-fixas",        "DESPESA_READ",  Escopo.EMPRESA),
    /** Módulo de Gestão do Site — base inteira; exige escopo global (R09/FR10) */
    GESTAO_EMPRESAS_USUARIOS("gestao-empresas-usuarios", "USUARIO_READ", Escopo.GLOBAL);

    public enum Escopo { EMPRESA, GLOBAL }

    private final String template;      // resources/reports/<template>.jrxml
    private final String permissao;     // chave RBAC — R05
    private final Escopo escopo;        // EMPRESA (R02/R09) ou GLOBAL (só ADMIN)
    …
}
```

| Relatório | Conteúdo | Permissão | Escopo |
|-----------|----------|-----------|--------|
| `FICHA_TECNICA_PRODUTO` | composição, impostos, parâmetros, PV com breakdown e **faixa de negociação** (C10–C12) | `PRODUTO_READ` | empresa |
| `LISTA_PRECIFICACAO` | todos os produtos da empresa com CP, divisor, PV e margem | `RELATORIO_READ` | empresa |
| `DESPESAS_FIXAS` | despesas ativas/inativas e o %DF rateado | `DESPESA_READ` | empresa |
| `GESTAO_EMPRESAS_USUARIOS` | todas as empresas com dono e equipe (Gestão do Site) | `USUARIO_READ` | **global** |

## As cinco regras do módulo

**1. Relatório não calcula.** Os números vêm de `PrecificacaoService` (C1–C12).
No JRXML só existe formatação e soma de banda — nunca `$F{custo} * 1.18`. Fórmula
duplicada no template é uma segunda fonte de verdade que ninguém testa ([[R01-calculo-no-backend]]).

**2. Datasource é DTO, nunca JDBC.** `JRBeanCollectionDataSource` sobre records
do módulo. **Proibido** `<queryString>` com SQL dentro do JRXML: SQL no template
escapa do filtro por empresa e vira vazamento entre clientes ([[R02-isolamento-multiempresa]]).

**3. Autoriza antes de montar.** `@PreAuthorize` da permissão do catálogo **e**
validação da empresa/escopo no service — a mesma porta do resto da API
([[R05-autorizacao-rbac]], [[R09-ownership-multiempresa]]).

**4. Compila uma vez.** `.jrxml` compila para `.jasper` no primeiro uso e fica em
cache concorrente. Compilar por request custa centenas de ms à toa.

**5. Aqui o backend formata.** Exceção explícita e única ao [[R07-fora-do-backend]]:
o PDF é o artefato final, não existe front depois dele para aplicar `Intl`.
Locale `pt-BR` no fill; moeda e percentual no padrão brasileiro.

## Engine

```java
@Component
public class JasperEngine {

    private final Map<String, JasperReport> cache = new ConcurrentHashMap<>();

    /** Compila na primeira chamada e reaproveita (regra 4) */
    private JasperReport compilar(String template) {
        return cache.computeIfAbsent(template, t -> {
            try (InputStream in = new ClassPathResource("reports/" + t + ".jrxml").getInputStream()) {
                return JasperCompileManager.compileReport(in);
            } catch (Exception e) {
                throw new ReportException("Falha ao compilar o template " + t, e);
            }
        });
    }

    public byte[] exportarPdf(String template, Map<String, Object> parametros, Collection<?> linhas) {
        try {
            var params = new HashMap<>(parametros);
            params.put(JRParameter.REPORT_LOCALE, new Locale("pt", "BR"));
            params.put("SUBREPORT_DIR", "reports/shared/");

            JasperPrint print = JasperFillManager.fillReport(
                compilar(template), params, new JRBeanCollectionDataSource(linhas));

            return JasperExportManager.exportReportToPdf(print);
        } catch (JRException e) {
            throw new ReportException("Falha ao gerar o relatório " + template, e);
        }
    }
}
```

## Service

```java
@Service
@RequiredArgsConstructor
public class ReportService {

    private final JasperEngine engine;
    private final PrecificacaoService precificacaoService;   // C1–C12 — não recalcula aqui
    private final ProdutoRepository produtoRepository;
    private final UsuarioContext contexto;

    public byte[] gerar(ReportCatalog tipo, Map<String, String> parametros) {
        // Escopo GLOBAL só para quem tem visão global (R09/FR10)
        if (tipo.escopo() == Escopo.GLOBAL && !contexto.temEscopoGlobal()) {
            throw new AccessDeniedException("Relatório restrito à Gestão do Site");
        }
        return switch (tipo) {
            case FICHA_TECNICA_PRODUTO -> fichaTecnica(parametros.get("produtoId"));
            case LISTA_PRECIFICACAO    -> listaPrecificacao();
            case DESPESAS_FIXAS        -> despesasFixas();
            case GESTAO_EMPRESAS_USUARIOS -> gestaoDoSite();
        };
    }

    private byte[] fichaTecnica(String produtoId) {
        String empresaId = contexto.empresaAtivaAutorizada();          // R02/R09
        var produto = produtoRepository.findByIdAndEmpresaId(produtoId, empresaId)
            .orElseThrow(() -> new ReportException("Produto não encontrado no escopo do usuário"));

        var resultado = precificacaoService.precificar(produto.getId());  // C1–C7
        var faixa     = resultado.faixaNegociacao();                      // C10–C12

        var linhas = produto.getMateriais().stream()
            .map(FichaTecnicaRow::de)
            .toList();

        var params = Map.<String, Object>of(
            "empresa",     produto.getEmpresa().getRazaoSocial(),
            "cnpj",        produto.getEmpresa().getCnpj(),
            "produto",     produto.getNome(),
            "emitidoEm",   LocalDateTime.now(),
            "resultado",   resultado,
            "faixa",       faixa
        );
        return engine.exportarPdf("ficha-tecnica-produto", params, linhas);
    }
}
```

## Controller — download autenticado

**REST, não GraphQL.** Binário em GraphQL viraria base64 (+33% de tamanho, sem
streaming, sem `Content-Disposition`). O contrato de dados continua em
`/graphql` ([[R06-contrato-first-schema]]); o binário sai por HTTP:

```java
@RestController
@RequestMapping("/api/relatorios")
@RequiredArgsConstructor
public class ReportsController {

    private final ReportService reportService;

    @PostMapping(value = "/{tipo}", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("@reportGuard.podeGerar(#tipo)")   // permissão vinda do catálogo — R05
    public ResponseEntity<byte[]> gerar(
            @PathVariable ReportCatalog tipo,
            @RequestBody(required = false) Map<String, String> parametros) {

        byte[] pdf = reportService.gerar(tipo, parametros == null ? Map.of() : parametros);

        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"" + tipo.nomeArquivo() + ".pdf\"")
            .body(pdf);
    }
}
```

O JWT é o mesmo do GraphQL — o `SecurityConfig` protege `/api/relatorios/**`
com o filtro já existente ([[auth-jwt-spring]]).

## Convenções de JRXML

- Um `.jrxml` por relatório, em `resources/reports/`; nada de template gerado em
  runtime por concatenação de string.
- Estilos comuns em `shared/markup-styles.jrtx` (`<template>`), para os
  relatórios não divergirem visualmente um do outro.
- Campos (`<field>`) espelham **exatamente** os nomes do record do datasource —
  divergência só aparece em runtime, então tem teste (abaixo).
- Máscaras: `#,##0.00` para dinheiro (com `R$` no `<textField pattern>`),
  `#,##0.0'%'` para percentual, `dd/MM/yyyy HH:mm` para data.
- Subrelatório da faixa de negociação (`sub-faixa-negociacao.jrxml`) recebe os
  degraus por `JRBeanCollectionDataSource` — o mesmo bloco em qualquer relatório
  que precise mostrar a faixa.

## Testes obrigatórios

| Teste | Prova |
|-------|-------|
| Todo item do `ReportCatalog` tem `.jrxml` correspondente e **compila** | template quebrado não chega em produção |
| Campos do JRXML ⊆ propriedades do record | erro de nome falha no build, não no cliente |
| PDF gerado começa com `%PDF-` e tem > 1 KB | fill produziu documento de verdade |
| Usuário sem a permissão do catálogo ⇒ `AccessDeniedException` | R05 |
| Usuário de outra empresa ⇒ relatório **negado**, não vazio | R02/R09 — o pior caso é o PDF que vaza |
| Não-ADMIN pedindo relatório `Escopo.GLOBAL` ⇒ negado | R09/FR10 |
| Números do PDF == `ResultadoPrecificacao` do service | regra 1 (nada recalculado no template) |

## Frontend

O front **pede e baixa** — não monta documento ([[FR11-relatorio-vem-do-backend]]).
Cliente em `src/graphql/relatorios.ts`: com `MOCK_MODE = true` cai na impressão
do navegador (stopgap do protótipo); com o backend ligado, `POST` no endpoint
acima e download do blob.
