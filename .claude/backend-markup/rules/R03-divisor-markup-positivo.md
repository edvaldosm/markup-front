# Rule R03 — Divisor Markup deve ser positivo

**Categoria:** Integridade de cálculo
**Origem:** IniciandoBackEndMarkup.md §5.4

## Regra

No cálculo do Preço de Venda:

```
divisorMarkup = 1 - (Impostos + DF + ML + D) / 100
```

Se `divisorMarkup <= 0`, o resolver **deve retornar `error`** — nunca retornar
preço negativo, zero ou infinito.

Mensagem de erro esperada:

```go
if divisorMarkup <= 0 {
    return nil, fmt.Errorf("soma de percentuais (%.1f%%) inviabiliza o preço — reduza margens ou impostos", soma)
}
```

## Por quê

Quando a soma dos percentuais atinge ou ultrapassa 100%, a fórmula
`PV = CP / divisor` diverge (divisão por zero ou negativo). Retornar erro
explícito protege o usuário de um preço sem sentido. Ver
[[formula-markup-divisor]] e [[service-precificacao-java]].
