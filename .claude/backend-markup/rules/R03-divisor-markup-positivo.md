# Rule R03 — Divisor Markup deve ser positivo

**Categoria:** Integridade de cálculo
**Origem:** IniciandoBackEndMarkup.md §5.4 (portado para Java/Spring)

## Regra

No cálculo do Preço de Venda:

```
divisorMarkup = 1 - (Impostos + DF + ML + D) / 100
```

Se `divisorMarkup <= 0`, o service **deve lançar exceção** — nunca retornar
preço negativo, zero ou infinito.

```java
if (divisor <= 0) {
    throw new PrecificacaoInviavelException(
        "soma de percentuais (%.1f%%) inviabiliza o preço — reduza margens ou impostos"
            .formatted(soma));
}
```

A exceção vira erro GraphQL na resposta; o front exibe a mensagem.

## Por quê

Quando a soma dos percentuais atinge ou ultrapassa 100%, a fórmula
`PV = CP / divisor` diverge (divisão por zero ou negativo). Retornar erro
explícito protege o usuário de um preço sem sentido. Ver
[[formula-markup-divisor]] e [[service-precificacao-java]].
