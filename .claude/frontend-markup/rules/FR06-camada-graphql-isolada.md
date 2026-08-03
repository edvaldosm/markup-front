# Rule FR06 — Camada GraphQL isolada e cálculo migra para o backend

**Categoria:** Integração / Fronteira
**Origem:** `src/graphql/client.ts`, `src/composables/useMarkup.ts`

> ⚠️ **Emenda pendente — esta regra está parcialmente desatualizada desde
> 2026-08-03.** A fatia 1 da integração
> ([integracao-backend-sessao-empresas](../../specs/integracao-backend-sessao-empresas/spec.md))
> decidiu que **não existe flag de runtime**: sessão e empresas falam com o
> backend sempre, e o mock sobrevive apenas como fixture de teste.
> `MOCK_MODE`/`mockQuery` continuam no código só pelas telas das fatias 2–3,
> marcados `@deprecated`. **Reescrever esta regra ao fim da fatia 3**, quando
> `src/mock/` for apagado — antes disso o texto abaixo ainda descreve o que as
> telas não migradas fazem.

## Regra

Todo acesso a dados passa pela camada `src/graphql/` (`client.ts`), controlada
pela flag `MOCK_MODE`:

- **`MOCK_MODE = true` (protótipo):** dados vêm de `src/mock/data.ts` via
  `mockQuery`; o cálculo roda localmente em `useMarkupCalculator`.
- **`MOCK_MODE = false` (produção):** Apollo Client apontando para
  `GQL_ENDPOINT` (`VITE_GQL_ENDPOINT`, default `http://localhost:8080/graphql`).

O cálculo local é **provisório e datado**: existe só para o protótipo navegar
sem backend. Ele **não** é a fonte de verdade — a fonte é
[[R01-calculo-no-backend]] + [[catalogo-calculos-validacoes]].

## Inventário da migração

Ao ligar o backend, isto **sai do front**:

| Função em `useMarkup.ts` | Vira | Backend |
|--------------------------|------|---------|
| `calcularCustoBase` | `ResultadoPrecificacao.custoBase` | C1 |
| `calcularPercentualDF` | `.percentualDespesasFixas` | C2 |
| soma de alíquotas | `.percentualImpostos` | C3 |
| divisor e PV | `.divisorMarkup`, `.precoVenda` | C5, C6 |
| `breakdown` | `.breakdown` | C7 |
| `calcularFatorR` | `.fatorR` | C8 · [[R10-fator-r-anexo-simples]] |
| `resolverAnexo` / `FATOR_R_LIMITE` | `.anexoAplicado` | C9 · [[R10-fator-r-anexo-simples]] |
| `calcularFaixaNegociacao` | `.faixaNegociacao` | C10, C11, C12 (guarda V9) |

| `gerarRelatorioPdf` (mock: `window.print()`) | `POST /api/relatorios/{tipo}` | módulo `reports` · [[R12-relatorios-no-backend]] |

Isto **permanece** no front:

- `useCurrency` — formatação `Intl` pt-BR ([[FR05-formatacao-intl]]); o backend
  devolve número cru e nunca formata (backend [[R07-fora-do-backend]]).
- Ordenação de tabela, paginação e estado de tela.

### Como migrar

1. `MOCK_MODE = false` e Apollo configurado.
2. Telas passam a consumir `precificarProduto` / `precificarTodos`.
3. `useMarkupCalculator` é **removido** — não fica como fallback. Dois caminhos
   de cálculo é como os números divergem.
4. `ResultadoPrecificacao` do front vira espelho do tipo do schema.

## Divergências conhecidas a resolver na migração

O protótipo e o backend **não** são equivalentes hoje — ao migrar, vale a regra
do backend:

- **Material órfão:** o front ignora em silêncio (`if (!mat) return acc`),
  subestimando o custo. No backend é erro — [[R11-guardas-de-calculo]] (V6).
- **Divisor ≤ 0:** o front devolve `precoVenda = 0`; o backend **lança
  exceção** — [[R03-divisor-markup-positivo]] (V1).

## Por quê

Mantém o protótipo navegável sem backend e deixa a troca numa única flag, sem
espalhar `fetch` pelas telas. Mais importante: registra que o cálculo no front
tem data de validade — sem isso ele vira uma segunda fonte de verdade, e duas
fontes de verdade para preço significam dois preços. Ver [[camada-graphql-mock]].
