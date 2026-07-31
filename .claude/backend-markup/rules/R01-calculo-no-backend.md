# Rule R01 — Cálculo de precificação vive no backend

**Categoria:** Arquitetura / Fronteira de responsabilidade
**Origem:** IniciandoBackEndMarkup.md §1, §11

## Regra

Todo cálculo de precificação é **centralizado no backend** (API GraphQL). O
frontend (Vue 3 + Apollo) **não executa nenhum cálculo** — apenas exibe os
resultados retornados pela API.

## Cálculos que obrigatoriamente ficam no backend

| Cálculo | Onde no backend |
|---------|-----------------|
| Custo Base (CP) | campo resolvido `custoBase` em `Produto` ou `precificarProduto` |
| % Despesas Fixas (DF) | campo resolvido `percentualDespesasFixas` em `Empresa` |
| % Impostos total | campo resolvido `percentualImpostos` em `Produto` |
| Divisor Markup | dentro do resolver de precificação |
| Preço de Venda | query `precificarProduto` |
| Breakdown do PV | tipo `ResultadoPrecificacao` na resposta |

## Por quê

Garante uma única fonte de verdade dos números, evita divergência entre
clientes e mantém a regra fiscal auditável no servidor. Ver também
[[R07-fora-do-backend]].
