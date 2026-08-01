# Rule R10 — Fator R decide o anexo do Simples (serviços)

**Categoria:** Regra fiscal / Integridade de cálculo
**Origem:** vault `wiki-markup.md` §Fator R; implementado no protótipo em
`src/composables/useMarkup.ts` e migrado para o backend

## Regra

Para empresa de **segmento SERVICOS** no **SIMPLES_NACIONAL**, o anexo tributário
não é o que está cadastrado — é **derivado** do Fator R:

```
fatorR = folha_pagamento_mensal / faturamento_medio_mensal × 100

fatorR >= 28  →  ANEXO_III   (mais barato, 6% na 1ª faixa)
fatorR <  28  →  ANEXO_V     (mais caro, 15,5% na 1ª faixa)
```

Fora desse recorte (indústria, confeitaria, ou regime ≠ Simples), vale o
`anexo_simples` **cadastrado** na empresa, e a resposta traz `fatorR` e
`anexoAplicado` **nulos**.

O limite `28` é constante nomeada (`FATOR_R_LIMITE`) — nunca literal repetido
pelo código.

## Por quê

É a decisão de maior impacto financeiro do domínio: o mesmo serviço sai **~40%
mais caro** ao cliente no Anexo V. Deixar isso implícito no cadastro faz a
empresa pagar até 9,5 p.p. a mais de imposto sem necessidade — está listado nos
"erros comuns" do vault.

Derivar no servidor (e não confiar no campo cadastrado) mantém o número
auditável e impede que dois clientes da API cheguem a anexos diferentes para a
mesma empresa. Ver [[R01-calculo-no-backend]] e [[catalogo-calculos-validacoes]]
(C8, C9, V3, V5).

## Guardas

- `faturamento_medio_mensal <= 0` ⇒ `fatorR = 0` (cai no Anexo V) — nunca dividir
  por zero. Ver [[R11-guardas-de-calculo]].
- `folha_pagamento_mensal` ausente ⇒ tratar como `0`.
- A apuração real é **mês a mês**; o sistema usa a média mensal cadastrada.
  Progressão histórica (RBT12) está fora de escopo.
