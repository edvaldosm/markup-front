# Tarefas — Faixa de negociação e PDF da ficha

- **Slug:** faixa-negociacao-e-pdf  •  **Baseado em:** plan.md  •  **Data:** 2026-08-01

## Legenda

`[ ]` pendente · `[~]` em andamento · `[x]` concluída · **dep:** depende de

## Documentação (SDD)

- [x] **T-D1** — `spec.md`, `plan.md`, `tasks.md` da feature
- [x] **T-D2** (REQ-08) — catálogo: **C10** (preço praticado), **C11** (piso),
      **C12** (lucro no desconto) + guarda **V9** + tipos `FaixaNegociacao` /
      `DegrauDesconto` no contrato GraphQL
- [x] **T-D3** — catálogo §4: decisão em aberto sobre a base de impostos/DF na
      venda com desconto, com a diferença quantificada
- [x] **T-D4** — `FR06`: novas linhas no inventário de migração do cálculo local
- [x] **T-D5** — skill `composables-calculo-formatacao` documenta a faixa

## Frontend

- [x] **T-F1** (REQ-01..04) — tipos `DegrauDesconto` e `FaixaNegociacao` ·
      alvo: `src/types/index.ts`
- [x] **T-F2** (REQ-01..04) — `calcularFaixaNegociacao(resultado, passos = 4)` ·
      alvo: `src/composables/useMarkup.ts` · dep: T-F1
- [x] **T-F3** (REQ-01..05) — `FaixaNegociacaoCard.vue`: extremos (tabela × piso),
      degraus com margem efetiva e as duas notas de leitura
- [x] **T-F4** (REQ-01/02) — parâmetro vira "Desconto (mín. → máx.)" com o piso em
      reais · alvo: `ProdutoDetalheView.vue`
- [x] **T-F5** (REQ-06/07) — botão **Gerar PDF** (`window.print()`), cabeçalho
      `.print-only` com empresa/CNPJ/data e `.no-print` nos controles
- [x] **T-F6** (REQ-07) — camada `@media print` em `main.css` (esconde moldura,
      `@page A4`, `break-inside: avoid`, cores impressas)
- [x] **T-F7** — 10 testes em `src/composables/faixa-negociacao.spec.ts`

## Verificação

- [x] `npx vue-tsc --noEmit` limpo · `npm run build` OK
- [x] `npm test` — **103 testes** (93 antes, +10 da faixa)
- [x] Invariantes amarrados no teste: `lucroNoPiso == breakdown.lucroLiquido`,
      `lucroNoTeto == lucroLiquido + valorDesconto`, margem efetiva monotônica,
      `1 − preço == teto − lucro` em cada degrau
- [x] Guardas: `D = 0` ⇒ faixa de um ponto; `D < 0` ⇒ faixa zerada; `PV = 0` ⇒
      sem preço/lucro/margem negativos
- [x] Navegado no app real (MVP de Startup, CodeLab): tabela R$ 55.914,78 → piso
      R$ 51.441,59, margem de negociação R$ 4.473,18, degraus 0/2/4/6/8% com
      margem efetiva de 46,0% a 41,3%
- [x] PDF: botão dispara `window.print()`; cabeçalho da folha presente e oculto
      na tela; `.no-print` nos 4 controles; prévia do layout de impressão sem
      sidebar/header/botões
- [ ] Conferir a paginação real do PDF em A4 no diálogo do navegador (depende de
      interação humana com o diálogo de impressão)
- [ ] Backend: `faixaNegociacao` no `ResultadoPrecificacao` — depende de
      `backend-java-spring`

---
**Próximo passo:** decidir a base de impostos/DF da venda com desconto (§4 do
catálogo) antes de implementar C12 no backend.
