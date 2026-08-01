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
| Soma dos percentuais | dentro do service de precificação |
| Divisor Markup | dentro do service de precificação |
| Preço de Venda | query `precificarProduto` |
| Breakdown do PV | tipo `ResultadoPrecificacao` na resposta |
| **Fator R** | `ResultadoPrecificacao.fatorR` — [[R10-fator-r-anexo-simples]] |
| **Anexo aplicado** | `ResultadoPrecificacao.anexoAplicado` — [[R10-fator-r-anexo-simples]] |

Catálogo completo com fórmulas e guardas: [[catalogo-calculos-validacoes]].

## O que **não** é cálculo (fica no front)

Formatação de moeda/percentual (`Intl` pt-BR), ordenação de tabela, paginação de
tela e estado de UI — ver [[R07-fora-do-backend]].

## Migração do protótipo

O protótipo Vue calcula em `src/composables/useMarkup.ts` enquanto não há
backend. **Ao ligar o backend, esse composable deixa de calcular** e as telas
passam a consumir `precificarProduto`. Plano e inventário no front:
`FR06-camada-graphql-isolada`.

## Por quê

Garante uma única fonte de verdade dos números, evita divergência entre
clientes e mantém a regra fiscal auditável no servidor. Dois clientes da API
nunca podem chegar a preços diferentes para o mesmo produto.
