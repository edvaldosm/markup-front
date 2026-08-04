<script setup lang="ts">
/**
 * Faixa de negociação: do preço de tabela (desconto 0%) ao piso (desconto
 * máximo). Serve ao vendedor — quanto ele pode conceder sem furar a margem.
 * Cálculo (C10–C12) do backend, dentro de `ResultadoPrecificacao.faixaNegociacao`
 * (`precificarProduto`/`precificarTodos`) — este componente só exibe.
 */
import { computed } from 'vue'
import { useCurrency } from '@/composables/useCurrency'
import BaseCard from '@/components/ui/BaseCard.vue'
import type { FaixaNegociacao } from '@/types'

const props = defineProps<{ faixa: FaixaNegociacao }>()

const { formatCurrency, formatPercent } = useCurrency()

const semReserva = computed(() => props.faixa.descontoMaximo <= 0)

/** Largura da barra de cada degrau — só ilustra a queda do preço na faixa */
const larguraDegrau = (preco: number) => {
  const { precoTabela, precoMinimo } = props.faixa
  if (precoTabela <= 0) return 0
  const piso = 60  // a barra nunca zera: o piso ainda é um preço cheio
  if (precoTabela === precoMinimo) return 100
  return piso + ((preco - precoMinimo) / (precoTabela - precoMinimo)) * (100 - piso)
}
</script>

<template>
  <BaseCard
    title="Faixa de Negociação"
    :subtitle="semReserva
      ? 'Este produto não tem reserva de desconto — só há o preço de tabela'
      : `Desconto de ${formatPercent(faixa.descontoMinimo)} a ${formatPercent(faixa.descontoMaximo)} — a reserva já está embutida no preço`"
  >
    <!-- Extremos da faixa -->
    <div class="extremos">
      <div class="extremo extremo--teto">
        <span class="extremo__tag">Desconto mínimo · {{ formatPercent(faixa.descontoMinimo) }}</span>
        <span class="extremo__rotulo">Preço de tabela</span>
        <span class="extremo__preco">{{ formatCurrency(faixa.precoTabela) }}</span>
        <span class="extremo__lucro">Lucro {{ formatCurrency(faixa.lucroNoTeto) }}</span>
      </div>

      <div class="entre">
        <span class="entre__seta">→</span>
        <span class="entre__valor">−{{ formatCurrency(faixa.economiaMaxima) }}</span>
        <span class="entre__nota">margem de negociação</span>
      </div>

      <div class="extremo extremo--piso">
        <span class="extremo__tag">Desconto máximo · {{ formatPercent(faixa.descontoMaximo) }}</span>
        <span class="extremo__rotulo">Preço mínimo</span>
        <span class="extremo__preco">{{ formatCurrency(faixa.precoMinimo) }}</span>
        <span class="extremo__lucro">Lucro {{ formatCurrency(faixa.lucroNoPiso) }}</span>
      </div>
    </div>

    <!-- Degraus -->
    <table v-if="!semReserva" class="degraus">
      <thead>
        <tr>
          <th>Desconto</th>
          <th>Preço praticado</th>
          <th class="th-num">Lucro</th>
          <th class="th-num">Margem efetiva</th>
          <th class="th-barra"></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="d in faixa.degraus"
          :key="d.desconto"
          :class="{
            'degrau--teto': d.desconto === faixa.descontoMinimo,
            'degrau--piso': d.desconto === faixa.descontoMaximo,
          }"
        >
          <td class="td-desc">{{ formatPercent(d.desconto) }}</td>
          <td class="td-preco">{{ formatCurrency(d.preco) }}</td>
          <td class="td-num">{{ formatCurrency(d.lucro) }}</td>
          <td class="td-num">{{ formatPercent(d.margemEfetiva) }}</td>
          <td class="td-barra">
            <span class="barra" :style="{ width: `${larguraDegrau(d.preco)}%` }" />
          </td>
        </tr>
      </tbody>
    </table>

    <p class="nota">
      <strong>Como ler:</strong> o desconto máximo já está reservado dentro do preço
      (é uma das parcelas do divisor). Vender no piso entrega exatamente a margem de
      lucro planejada; vender sem desconto entrega a margem <em>mais</em> a reserva.
      <template v-if="!semReserva">
        Abaixo de <strong>{{ formatCurrency(faixa.precoMinimo) }}</strong> o desconto
        passa a sair do lucro.
      </template>
    </p>
    <p class="nota nota--fina">
      Impostos e despesas fixas estão valorados sobre o preço de tabela — leitura
      conservadora: na venda com desconto o imposto incide sobre a receita menor,
      então o lucro real tende a ser um pouco maior que o exibido.
    </p>
  </BaseCard>
</template>

<style scoped>
.extremos {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: var(--space-4);
}

.extremo {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-4);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius);
  background: var(--color-surface);
}
.extremo--teto { border-left: 3px solid var(--color-primary-500); }
.extremo--piso { border-left: 3px solid var(--color-warning); background: var(--color-bg-subtle); }

.extremo__tag {
  font-size: .65rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
  color: var(--color-text-light);
}
.extremo__rotulo { font-size: .8125rem; font-weight: 600; color: var(--color-text-muted); }
.extremo__preco {
  font-size: 1.375rem; font-weight: 800; color: var(--color-text);
  font-variant-numeric: tabular-nums; line-height: 1.2;
}
.extremo__lucro { font-size: .75rem; color: var(--color-text-muted); font-variant-numeric: tabular-nums; }

.entre { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 0 var(--space-2); }
.entre__seta { font-size: 1.125rem; color: var(--color-text-light); }
.entre__valor { font-size: .875rem; font-weight: 700; color: var(--color-warning); white-space: nowrap; }
.entre__nota { font-size: .6875rem; color: var(--color-text-light); white-space: nowrap; }

.degraus { width: 100%; border-collapse: collapse; font-size: .875rem; margin-top: var(--space-5); }
.degraus th {
  text-align: left; padding: var(--space-2) var(--space-3);
  font-size: .7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .06em;
  color: var(--color-text-muted); border-bottom: 1px solid var(--color-border-light);
}
.degraus td { padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--color-border-light); }
.th-num, .td-num { text-align: right; font-variant-numeric: tabular-nums; }
.th-barra { width: 26%; }
.td-desc { font-weight: 700; color: var(--color-text); font-variant-numeric: tabular-nums; }
.td-preco { font-weight: 600; color: var(--color-text); font-variant-numeric: tabular-nums; }

.degrau--teto td { background: var(--color-primary-50); }
.degrau--piso td { background: var(--color-bg-subtle); font-weight: 700; }

.td-barra { padding-right: var(--space-3); }
.barra {
  display: block; height: 8px; border-radius: 99px;
  background: linear-gradient(90deg, var(--color-primary-300), var(--color-primary-600));
  min-width: 8px;
}
.degrau--piso .barra { background: linear-gradient(90deg, #fcd34d, var(--color-warning)); }

.nota {
  font-size: .75rem; color: var(--color-text-muted); line-height: 1.6;
  margin-top: var(--space-4);
  padding-top: var(--space-3);
  border-top: 1px dashed var(--color-border-light);
}
.nota--fina { border-top: none; padding-top: 0; margin-top: var(--space-2); color: var(--color-text-light); }
.nota strong { color: var(--color-text); }

@media (max-width: 700px) {
  .extremos { grid-template-columns: 1fr; }
  .entre { flex-direction: row; gap: var(--space-2); }
  .entre__seta { transform: rotate(90deg); }
  .th-barra, .td-barra { display: none; }
}
</style>
