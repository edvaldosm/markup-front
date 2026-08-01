# Plano técnico — Faixa de negociação e PDF da ficha

- **Slug:** faixa-negociacao-e-pdf  •  **Baseado em:** spec.md  •  **Data:** 2026-08-01
- **Depende de:** cálculo de precificação existente (C1–C7)

## Abordagem

Duas entregas independentes na mesma tela:

1. **Faixa de negociação** — uma função pura derivada do `ResultadoPrecificacao`
   que já existe. Nada de recalcular preço: a faixa é uma *leitura* do PV e dos
   percentuais ML e D. Isso mantém uma fonte só para o número (B1) e faz a faixa
   acompanhar automaticamente qualquer mudança futura no cálculo.
2. **PDF por impressão do navegador** — `window.print()` + camada `@media print`.
   Sem dependência nova, e o layout impresso é o mesmo CSS da tela, então não
   existe "segunda versão" da ficha para envelhecer em paralelo.

## Camadas afetadas

- **Frontend**
  - `src/types/index.ts` — `DegrauDesconto`, `FaixaNegociacao` (espelho do futuro
    tipo do schema).
  - `src/composables/useMarkup.ts` — `calcularFaixaNegociacao(resultado, passos)`.
  - `src/components/ui/FaixaNegociacaoCard.vue` — extremos, degraus e as duas notas.
  - `src/views/ProdutoDetalheView.vue` — card, parâmetro "Desconto (mín. → máx.)",
    cabeçalho de impressão e botão **Gerar PDF**.
  - `src/assets/main.css` — camada `@media print` + utilitários `.no-print` /
    `.print-only`.
- **Backend:** nada agora. C10–C12 entram no catálogo e viajam junto do
  `ResultadoPrecificacao` quando o backend existir.

## Mudanças de modelo / contrato

- **Tipos do front:** `FaixaNegociacao` e `DegrauDesconto` — **derivados**, não
  persistidos; nenhum campo novo em `Produto`.
- **Schema (futuro):** `ResultadoPrecificacao.faixaNegociacao: FaixaNegociacao!`
  — calculada no service junto do breakdown, nunca no controller.

## Decisões de design (requisito → decisão)

| Requisito | Decisão |
|-----------|---------|
| REQ-01 | mínimo é `0` **constante**, não campo novo — o domínio não tem desconto mínimo |
| REQ-02/03 | faixa derivada de `PV`, `ML` e `D`; não refaz o divisor |
| REQ-03 | `lucro(d) = PV × (ML + D − d)/100` — a reserva não usada vira lucro |
| REQ-04 | 5 degraus (4 intervalos) igualmente espaçados entre 0 e D |
| REQ-05 | nota fixa no card citando o piso em reais |
| REQ-06/07 | `window.print()` + `@media print`; `.no-print` no que é interação, `.print-only` no cabeçalho da folha |
| REQ-08 | C10 (preço praticado), C11 (piso), C12 (lucro no desconto), V9 (desconto fora de `[0, D]`) |

### Por que impressão do navegador e não uma lib de PDF

`jspdf`/`pdfmake` obrigariam a **redesenhar** a ficha em coordenadas ou em HTML
paralelo — um segundo layout para manter em dia, com risco de divergir do que o
usuário viu na tela. A impressão nativa reaproveita o markup existente, gera PDF
real (Salvar como PDF) e custa uma camada de CSS. O preço é depender do diálogo
do navegador — aceitável num protótipo, e substituível por geração no servidor
quando houver proposta comercial formal (já anotado como fora de escopo).

## Rules aplicáveis

B1/R01 e B11/R11 (cálculo e guardas; catálogo único), F5 (Intl), F3 (tokens),
F6 (inventário de migração do cálculo local).

## Riscos e alternativas

- **Faixa divergir do breakdown** → o teste amarra `lucroNoPiso` ao
  `breakdown.lucroLiquido` e `lucroNoTeto` a `lucro + reserva`; se o cálculo
  mudar, o teste acusa.
- **Leitura conservadora de impostos/DF** → registrada como decisão pendente na
  spec e no catálogo, com a diferença quantificada.
- **Impressão cortar cartões** → `break-inside: avoid` nos cartões e nas linhas
  de tabela; coluna direita encolhe no papel para caber em uma folha.

---
**Próximo passo:** `/tasks`
