/**
 * Formatação `Intl` pt-BR — moeda, percentual, número. É o que sobra do antigo
 * `useMarkup.ts` depois que a fórmula de precificação (C1–C12) e o Fator R
 * migraram para o backend (`integracao-backend-precificacao`): nenhum cálculo
 * de domínio mora aqui, só apresentação (Artigo III v2.5.0 — formatação
 * continua sendo trabalho do front, junto de paginação e ordenação).
 */
export function useCurrency() {
  const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
  const fmtPct = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })

  const formatCurrency = (v: number) => fmt.format(v)
  const formatPercent = (v: number) => `${fmtPct.format(v)}%`
  const formatNumber = (v: number, decimals = 2) =>
    new Intl.NumberFormat('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(v)

  return { formatCurrency, formatPercent, formatNumber }
}
