# 06 — Lógica de Cálculo — Precificação (Go)

> Fonte de verdade: `d:\ObsidianDocumentos\Conhecimento\cálculos\financeiras\markup\wiki\wiki-markup.md`

> Todos os cálculos vivem em `internal/service/precificacao_service.go`.
> Os resolvers apenas chamam o service — sem nenhuma lógica de cálculo no `graph/`.

---

## Fórmula central

```
PV = CP / (1 - (Impostos + DF + ML + D) / 100)
```

---

## 6.1 Custo Base do Produto (CP)

```
CP = SUM(pm.quantidade_utilizada × m.custo_unitario)
     para cada PRODUTO_MATERIAL do produto
```

- Campo `custoBase` resolvido em `Produto` (gqlgen field resolver)
- GORM: `db.Preload("Materiais.Material").First(&produto, "id = ?", id)`

---

## 6.2 Percentual de Despesas Fixas (% DF)

```
% DF = SUM(df.valor_mensal) / empresa.faturamento_medio_mensal × 100
       apenas despesas com df.ativa = true
```

- Campo `percentualDespesasFixas` resolvido em `Empresa`
- Calculado dinamicamente — reflete o estado atual das despesas

---

## 6.3 Percentual Total de Impostos do Produto

```
% Impostos = SUM(pi.aliquota_percentual)
             para cada PRODUTO_IMPOSTO do produto
```

- Campo `percentualImpostos` resolvido em `Produto`

---

## 6.3b Fator R e escolha de Anexo (apenas SERVICOS)

Para empresas de `segmento = SERVICOS` no Simples Nacional, o anexo tributário é decidido **dinamicamente** pelo Fator R antes de somar `% Impostos`:

```
Fator R = empresa.folha_pagamento_mensal / empresa.faturamento_medio_mensal × 100

  Fator R ≥ 28% → Anexo III (ex.: 6% na 1ª faixa)
  Fator R <  28% → Anexo V   (ex.: 15,5% na 1ª faixa)
```

```go
const FatorRLimite = 28.0

// FatorR retorna folha/faturamento em %. Zero se faturamento inválido.
func FatorR(e domain.Empresa) float64 {
    if e.FaturamentoMedioMensal <= 0 {
        return 0
    }
    return (e.FolhaPagamentoMensal / e.FaturamentoMedioMensal) * 100
}

// AnexoAplicado resolve o anexo efetivo. Só serviços dependem do Fator R.
func AnexoAplicado(e domain.Empresa) string {
    if e.Segmento == "SERVICOS" && e.RegimeTributario == "SIMPLES_NACIONAL" {
        if FatorR(e) >= FatorRLimite {
            return "ANEXO_III"
        }
        return "ANEXO_V"
    }
    return e.AnexoSimples
}
```

- Confeitaria e indústria: Fator R **não se aplica** → `anexoAplicado = anexo_simples`.
- O ISS já está embutido no DAS (Simples) — não somar ISS separadamente para serviços no Simples.
- `fatorR` e `anexoAplicado` são expostos em `Empresa` e em `ResultadoPrecificacao` (nulos fora de serviços).

---

## 6.4 Implementação completa — `precificacao_service.go`

```go
// internal/service/precificacao_service.go
package service

import (
    "fmt"
    "github.com/seu-usuario/markup-backend/internal/domain"
    "gorm.io/gorm"
)

type PrecificacaoService struct {
    DB *gorm.DB
}

type ResultadoPrecificacao struct {
    CustoBase               float64
    PercentualImpostos      float64
    PercentualDespesasFixas float64
    PercentualMargemLucro   float64
    PercentualDesconto      float64
    SomaTotalPercentuais    float64
    DivisorMarkup           float64
    PrecoVenda              float64
    FatorR                  *float64  // serviços: folha / faturamento × 100
    AnexoAplicado           *string   // serviços: anexo escolhido pelo Fator R
    Breakdown               BreakdownPrecificacao
}

type BreakdownPrecificacao struct {
    CustoRecuperado    float64
    ValorImpostos      float64
    ValorDespesasFixas float64
    ValorDesconto      float64
    LucroLiquido       float64
}

func (s *PrecificacaoService) PrecificarProduto(produtoID, empresaID string) (*ResultadoPrecificacao, error) {
    var produto domain.Produto
    s.DB.Preload("Materiais.Material").Preload("Impostos").
        First(&produto, "id = ? AND empresa_id = ?", produtoID, empresaID)

    var empresa domain.Empresa
    s.DB.First(&empresa, "id = ?", empresaID)

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

    // % DF: rateio dinâmico — sempre reflete o estado atual
    var totalDF float64
    s.DB.Model(&domain.DespesaFixa{}).
        Where("empresa_id = ? AND ativa = true", empresaID).
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
        return nil, fmt.Errorf(
            "soma de percentuais (%.1f%%) inviabiliza o preço — reduza margens ou impostos", soma,
        )
    }

    pv := cp / divisorMarkup

    // Serviços: expõe Fator R e o anexo efetivamente aplicado
    var fatorR *float64
    var anexo *string
    if empresa.Segmento == "SERVICOS" {
        fr := FatorR(empresa)
        an := AnexoAplicado(empresa)
        fatorR, anexo = &fr, &an
    }

    return &ResultadoPrecificacao{
        CustoBase:               cp,
        PercentualImpostos:      pctImpostos,
        PercentualDespesasFixas: pctDF,
        PercentualMargemLucro:   pctML,
        PercentualDesconto:      pctD,
        SomaTotalPercentuais:    soma,
        DivisorMarkup:           divisorMarkup,
        PrecoVenda:              pv,
        FatorR:                  fatorR,
        AnexoAplicado:           anexo,
        Breakdown: BreakdownPrecificacao{
            CustoRecuperado:    cp,
            ValorImpostos:      pv * (pctImpostos / 100),
            ValorDespesasFixas: pv * (pctDF / 100),
            ValorDesconto:      pv * (pctD / 100),
            LucroLiquido:       pv * (pctML / 100),
        },
    }, nil
}
```

---

## 6.5 Thin resolver — `graph/schema.resolvers.go`

```go
func (r *queryResolver) PrecificarProduto(ctx context.Context, produtoID string) (*model.ResultadoPrecificacao, error) {
    ginCtx := ctx.Value("GinContextKey").(*gin.Context)
    claims := jwt.ExtractClaims(ginCtx)

    if !contemPermissao(claims, "RELATORIO_READ") {
        return nil, fmt.Errorf("acesso negado: RELATORIO_READ necessário")
    }

    empresaID := claims["empresa_id"].(string)
    return r.PrecificacaoService.PrecificarProduto(produtoID, empresaID)
}
```

---

## Boas práticas do cálculo

- **Nunca fixe o % DF manualmente** — calcule sempre dinamicamente via rateio para refletir a realidade atual
- **Arredonde o PV para cima** (R$ 26,37 → R$ 26,50) na camada de apresentação (frontend), não no backend
- **Revise o % DF mensalmente** — o faturamento médio muda com sazonalidade
- **Separe CP de DF rigorosamente**: água, luz e gás → DF; ingredientes e embalagens → CP
