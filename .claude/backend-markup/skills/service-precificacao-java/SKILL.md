---
name: service-precificacao-java
description: Implementar a precificação em Java/Spring (PrecificacaoService + controller GraphQL) com a fórmula Markup e o breakdown. Use ao criar a query precificarProduto/precificarTodos.
metadata:
  domain: backend-markup
  kind: skill
  origin: IniciandoBackEndMarkup.md §5.4 (portado para Java/Spring)
---

# Precificação (Java / Spring)

A fórmula vive **no service** ([[R04-separacao-camadas]]); o controller GraphQL
apenas orquestra e aplica RBAC. Cálculo nunca no front ([[R01-calculo-no-backend]]).

## Service (`service/PrecificacaoService.java`)

```java
@Service
public class PrecificacaoService {
    private final ProdutoRepository produtoRepo;
    private final EmpresaRepository empresaRepo;
    private final DespesaFixaRepository despesaRepo;

    public ResultadoPrecificacao precificar(String produtoId, String empresaId) {
        var produto = produtoRepo.findByIdAndEmpresaId(produtoId, empresaId) // R02/R09
            .orElseThrow(() -> new NotFoundException("produto"));
        var empresa = empresaRepo.getReferenceById(empresaId);

        double cp = produto.getMateriais().stream()
            .mapToDouble(pm -> pm.getQuantidadeUtilizada() * pm.getMaterial().getCustoUnitario())
            .sum();

        double pctImpostos = produto.getImpostos().stream()
            .mapToDouble(ProdutoImposto::getAliquotaPercentual).sum();

        double totalDF = despesaRepo.somarAtivasPorEmpresa(empresaId); // COALESCE(SUM,0)
        double pctDF = empresa.getFaturamentoMedioMensal() > 0
            ? (totalDF / empresa.getFaturamentoMedioMensal()) * 100 : 0;

        double soma = pctImpostos + pctDF + produto.getMargemLucro() + produto.getDescontoMaximo();
        double divisor = 1.0 - soma / 100.0;
        if (divisor <= 0) // R03 / V1
            throw new PrecificacaoInviavelException(
                "soma de percentuais (%.1f%%) inviabiliza o preço".formatted(soma));

        double pv = cp / divisor;

        // Fator R e anexo só existem para serviços no Simples — R10 / V5
        Double fatorR = null;
        AnexoSimples anexo = null;
        if (ehServicoNoSimples(empresa)) {
            fatorR = calcularFatorR(empresa);
            anexo = fatorR >= FATOR_R_LIMITE ? AnexoSimples.ANEXO_III : AnexoSimples.ANEXO_V;
        }

        return new ResultadoPrecificacao(cp, pctImpostos, pctDF,
            produto.getMargemLucro(), produto.getDescontoMaximo(), soma, divisor, pv,
            fatorR, anexo,
            new Breakdown(cp, pv * pctImpostos / 100, pv * pctDF / 100,
                          pv * produto.getDescontoMaximo() / 100, pv * produto.getMargemLucro() / 100));
    }

    /** Limite legal do Fator R (%) — constante nomeada, nunca literal solto (R10) */
    public static final double FATOR_R_LIMITE = 28.0;

    private boolean ehServicoNoSimples(Empresa e) {
        return e.getSegmento() == Segmento.SERVICOS
            && e.getRegimeTributario() == RegimeTributario.SIMPLES_NACIONAL;
    }

    /** C8 — folha / faturamento × 100; guarda de divisão por zero (V3) */
    private double calcularFatorR(Empresa e) {
        if (e.getFaturamentoMedioMensal() <= 0) return 0;
        double folha = e.getFolhaPagamentoMensal() != null ? e.getFolhaPagamentoMensal() : 0;
        return (folha / e.getFaturamentoMedioMensal()) * 100;
    }
}
```

## Controller GraphQL fino (`graphql/PrecificacaoController.java`)

```java
@Controller
public class PrecificacaoController {
    private final PrecificacaoService service;
    private final UsuarioContext contexto; // extrai usuário/empresas do SecurityContext

    @QueryMapping
    @PreAuthorize("hasAuthority('RELATORIO_READ')") // R05
    public ResultadoPrecificacao precificarProduto(@Argument String produtoId) {
        String empresaId = contexto.empresaAtivaAutorizada(); // R02/R09
        return service.precificar(produtoId, empresaId);
    }
}
```

`ResultadoPrecificacao`/`Breakdown` são `record`s (DTOs).

## Guardas obrigatórias

O trecho acima já aplica V1 (divisor), V2 (`pctDF = 0` se faturamento ≤ 0),
V3 e V5 (Fator R). Faltam ainda, antes de dar o service por pronto:

- **V6** — material órfão é **erro**, não custo ignorado ([[R11-guardas-de-calculo]]);
- **V8** — rejeitar `margemLucro`/`descontoMaximo`/alíquota negativos na entrada;
- **V7** — `empresaId` validado contra o conjunto autorizado **antes** do cálculo
  (feito no controller via `UsuarioContext`).

## Referências

Catálogo completo dos cálculos e guardas: [[catalogo-calculos-validacoes]].
Fórmula: [[formula-markup-divisor]] · Divisor: [[R03-divisor-markup-positivo]] ·
Fator R: [[R10-fator-r-anexo-simples]] · Guardas: [[R11-guardas-de-calculo]].
