---
name: resolver-precificacao-go
description: Implementar o resolver PrecificarProduto em Go (gqlgen + GORM) com a fórmula Markup e o breakdown do preço. Use ao criar a query precificarProduto/precificarTodos no backend.
metadata:
  domain: backend-markup
  kind: skill
  origin: IniciandoBackEndMarkup.md §5.4
---

# Resolver de Precificação (Go)

Nenhum desses cálculos deve existir no frontend ([[R01-calculo-no-backend]]).
A lógica vive no `precificacao_service.go`; o resolver apenas orquestra
([[R04-separacao-camadas]]).

## Implementação de referência

```go
func (r *queryResolver) PrecificarProduto(ctx context.Context, produtoID string) (*model.ResultadoPrecificacao, error) {
    var produto Produto
    r.DB.Preload("Materiais.Material").Preload("Impostos").First(&produto, "id = ?", produtoID)

    var empresa Empresa
    r.DB.First(&empresa, "id = ?", produto.EmpresaID)

    // CP: soma dos insumos
    var cp float64
    for _, pm := range produto.Materiais {
        cp += pm.QuantidadeUtilizada * pm.Material.CustoUnitario
    }

    // % Impostos
    var pctImpostos float64
    for _, pi := range produto.Impostos {
        pctImpostos += pi.AliquotaPercentual
    }

    // % DF: rateio dinâmico
    var totalDF float64
    r.DB.Model(&DespesaFixa{}).Where("empresa_id = ? AND ativa = true", empresa.ID).
        Select("COALESCE(SUM(valor_mensal), 0)").Scan(&totalDF)

    var pctDF float64
    if empresa.FaturamentoMedioMensal > 0 {
        pctDF = (totalDF / empresa.FaturamentoMedioMensal) * 100
    }

    pctML := produto.MargemLucro
    pctD  := produto.DescontoMaximo

    soma          := pctImpostos + pctDF + pctML + pctD
    divisorMarkup := 1.0 - (soma / 100.0)

    if divisorMarkup <= 0 {
        return nil, fmt.Errorf("soma de percentuais (%.1f%%) inviabiliza o preço — reduza margens ou impostos", soma)
    }

    pv := cp / divisorMarkup

    return &model.ResultadoPrecificacao{
        CustoBase:               cp,
        PercentualImpostos:      pctImpostos,
        PercentualDespesasFixas: pctDF,
        PercentualMargemLucro:   pctML,
        PercentualDesconto:      pctD,
        SomaTotalPercentuais:    soma,
        DivisorMarkup:           divisorMarkup,
        PrecoVenda:              pv,
        Breakdown: &model.BreakdownPrecificacao{
            CustoRecuperado:    cp,
            ValorImpostos:      pv * (pctImpostos / 100),
            ValorDespesasFixas: pv * (pctDF / 100),
            ValorDesconto:      pv * (pctD / 100),
            LucroLiquido:       pv * (pctML / 100),
        },
    }, nil
}
```

## Campos resolvidos relacionados

- `Produto.custoBase` → `SUM(qtd × custo_unitario)` (GORM: `Association("Materiais")`)
- `Produto.percentualImpostos` → `SUM(aliquota_percentual)`
- `Empresa.percentualDespesasFixas` → rateio dinâmico das despesas ativas

Ver [[formula-markup-divisor]] e [[R03-divisor-markup-positivo]].
