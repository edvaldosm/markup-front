# Spec — Módulo de relatórios (JasperReports) e exposição das novas regras no backend

> Governado por [../../constitution.md](../../constitution.md) v2.4.0.

- **Slug:** modulo-relatorios-jasper
- **Status:** aprovada
- **Data:** 2026-08-01

## Problema / Objetivo

Duas coisas nasceram no protótipo Vue e **não podem ficar lá**:

1. As regras novas — **Gestão do Site** (visão da base inteira, vínculos
   usuário↔empresa) e **faixa de negociação** (C10–C12) — hoje rodam sobre dados
   mock, no navegador. Enquanto o servidor não as conhecer, elas são sugestão de
   tela: um cliente com o dev tools aberto contorna qualquer uma.
2. O **PDF da ficha técnica**, gerado hoje pela impressão do navegador. Documento
   que vai anexado a proposta comercial precisa ser igual para todo mundo,
   versionado e autorizado — não pode depender do navegador de cada usuário.

O objetivo é fechar as duas: expor as regras novas no contrato do backend e criar
um **módulo exclusivo de relatórios** com JasperReports.

## Histórias de usuário

- Como gestor do site, consulto a base inteira por queries do servidor, que
  **negam** o acesso a quem não tem escopo global — não por uma tela escondida.
- Como vendedor, recebo a faixa de negociação **calculada no servidor**, junto do
  preço, sem risco de a tela e o servidor discordarem.
- Como proprietário, baixo a ficha técnica em PDF gerado pelo servidor, com
  cabeçalho da empresa, para anexar a uma proposta.
- Como time, mexo num relatório alterando um `.jrxml`, sem tocar em `service/`.

## Requisitos

### Exposição das regras novas

- **REQ-01 (MUST):** `ResultadoPrecificacao` passa a trazer `faixaNegociacao`
  (C10–C12): preço de tabela, piso, economia máxima, lucro nos extremos e degraus.
- **REQ-02 (MUST):** queries de escopo global — `todasEmpresas`, `empresaAdmin`,
  `todosUsuarios`, `metricasDaBase` — exigem a authority **`ESCOPO_GLOBAL`**.
- **REQ-03 (MUST):** mutations de vínculo — `vincularUsuario`,
  `desvincularUsuario`, `definirPerfilNoVinculo`, `definirUsuarioAtivo` — idem.
- **REQ-04 (MUST):** `desvincularUsuario` **recusa** o dono da própria empresa,
  com erro explícito (B9) — a mesma guarda que o front já aplica.
- **REQ-05 (MUST):** escopo global é **escopo, não permissão**: PROPRIETARIO, que
  tem todas as `PermissaoChave`, é negado nas operações acima.

### Módulo de relatórios

- **REQ-06 (MUST):** módulo **exclusivo** `com.markup.reports`, com JasperReports.
  Nenhum pacote de domínio importa `reports`; `reports` importa `service/`.
- **REQ-07 (MUST):** catálogo fechado (`ReportCatalog`) amarrando, por relatório:
  template `.jrxml`, permissão RBAC e escopo (EMPRESA ou GLOBAL). Sem entrada no
  catálogo, o relatório não existe.
- **REQ-08 (MUST):** o relatório **não calcula** — consome `PrecificacaoService`
  (C1–C12). Fórmula de negócio dentro do `.jrxml` é proibida.
- **REQ-09 (MUST):** datasource por **DTO** (`JRBeanCollectionDataSource`);
  `<queryString>` com SQL dentro do template é proibido — escaparia do filtro
  multi-empresa.
- **REQ-10 (MUST):** autorização antes de buscar dado: permissão do catálogo
  (`@PreAuthorize`) + filtro de empresa/escopo (R02/R09).
- **REQ-11 (MUST):** download por `POST /api/relatorios/{tipo}` →
  `application/pdf`, com o mesmo JWT e `Content-Disposition`.
- **REQ-12 (SHOULD):** relatórios do primeiro lote: `FICHA_TECNICA_PRODUTO`
  (com a faixa de negociação), `LISTA_PRECIFICACAO`, `DESPESAS_FIXAS` e
  `GESTAO_EMPRESAS_USUARIOS` (escopo global).
- **REQ-13 (MUST):** templates compilam uma vez e ficam em cache.

### Frontend

- **REQ-14 (MUST):** o front **pede e baixa** (F11): `src/graphql/relatorios.ts`
  é a única porta de saída de documento. Sem biblioteca de PDF no bundle.
- **REQ-15 (MUST):** em `MOCK_MODE = true`, cai na impressão do navegador —
  stopgap datado, como `useMarkupCalculator`. Com o backend ligado, `POST` e
  download do blob.

## Critérios de aceite

- [ ] Usuário PROPRIETARIO (todas as permissões) recebe negação em
      `todasEmpresas` e nas mutations de vínculo.
- [ ] `desvincularUsuario(dono, empresaDele)` ⇒ erro; com não-dono ⇒ sucesso.
- [ ] `precificarProduto` devolve `faixaNegociacao` com
      `lucroNoPiso == breakdown.lucroLiquido`.
- [ ] Relatório fora do catálogo ⇒ 404/erro de contrato, nunca template dinâmico.
- [ ] Usuário de outra empresa pedindo `FICHA_TECNICA_PRODUTO` ⇒ **negado**
      (nunca PDF vazio ou com dado de outra empresa).
- [ ] Não-ADMIN pedindo `GESTAO_EMPRESAS_USUARIOS` ⇒ negado.
- [ ] PDF começa com `%PDF-`, tem os números idênticos aos do
      `ResultadoPrecificacao` e sai com nome de arquivo no `Content-Disposition`.
- [ ] Front com `MOCK_MODE = false` baixa o arquivo do endpoint; nenhuma lib de
      PDF no `package.json`.

## Fora de escopo

- Agendamento e envio de relatório por e-mail.
- Exportação em XLSX/CSV (a dependência fica prevista; o lote é PDF).
- Relatório com logotipo do cliente — o cadastro de empresa não tem logo.
- Editor de templates para o usuário final.

## Conformidade com a Constituição

- Artigos: **B12** (novo), B1, B2/B9, B5, B11, F11 (novo), F6.
- Emenda necessária: **sim** — B12 e F11, aplicados na v2.4.0.

## Pontos a clarificar

- [ ] Versão do JasperReports: assumida **7.0.1** (a última linha estável). Ajustar
      se o time padronizar outra.
- [ ] Guardar o PDF gerado (histórico/auditoria) ou sempre regerar? (assumido:
      sempre regerar — sem armazenamento por ora.)
- [ ] Base de impostos/DF da venda com desconto (C12) segue pendente — herdada da
      spec [`faixa-negociacao-e-pdf`](../faixa-negociacao-e-pdf/spec.md).

---
**Próximo passo:** `/plan`
