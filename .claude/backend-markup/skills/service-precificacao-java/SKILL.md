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
        if (divisor <= 0) // R03
            throw new PrecificacaoInviavelException(
                "soma de percentuais (%.1f%%) inviabiliza o preço".formatted(soma));

        double pv = cp / divisor;
        return new ResultadoPrecificacao(cp, pctImpostos, pctDF,
            produto.getMargemLucro(), produto.getDescontoMaximo(), soma, divisor, pv,
            new Breakdown(cp, pv * pctImpostos / 100, pv * pctDF / 100,
                          pv * produto.getDescontoMaximo() / 100, pv * produto.getMargemLucro() / 100));
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

`ResultadoPrecificacao`/`Breakdown` são `record`s (DTOs). Ver [[formula-markup-divisor]]
e [[R03-divisor-markup-positivo]].
