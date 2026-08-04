<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useEmpresaStore } from '@/stores/empresa'
import { useDespesasStore } from '@/stores/despesas'
import { useMateriaisStore } from '@/stores/materiais'
import { usePrecificacaoStore } from '@/stores/precificacao'
import { useCurrency } from '@/composables/useCurrency'
import { segmentoConfig } from '@/config/segmentos'
import StatCard from '@/components/ui/StatCard.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import IndisponivelBackend from '@/components/ui/IndisponivelBackend.vue'

const router = useRouter()
const empresaStore = useEmpresaStore()
const despesasStore = useDespesasStore()
const materiaisStore = useMateriaisStore()
const precificacaoStore = usePrecificacaoStore()
const { formatCurrency, formatPercent } = useCurrency()

const seg = computed(() => segmentoConfig(empresaStore.empresa?.segmento))
const ehServico = computed(() => empresaStore.empresa?.segmento === 'SERVICOS')

/**
 * Fator R da empresa não tem campo no contrato hoje — só existe por produto,
 * dentro de `ResultadoPrecificacao`. Pendência registrada em
 * `integracao-backend-precificacao/spec.md`. Enquanto isso, sem fórmula local:
 * a tela mostra indisponível em vez de inventar a conta (Artigo III v2.5.0).
 */
const MOTIVO_FATOR_R = 'Fator R por empresa ainda não é um campo do contrato — pendência registrada para o backend.'
const MOTIVO_TOTAL_DESPESAS = 'Total consolidado de despesas ainda não é um agregado do contrato — pendência registrada para o backend.'

onMounted(async () => {
  await Promise.all([
    empresaStore.fetchEmpresa(),
    despesasStore.fetchDespesas(),
    materiaisStore.fetchMateriais(),
    precificacaoStore.buscarTodos(),
  ])
})

const percentualDF = computed(() => empresaStore.empresa?.percentualDespesasFixas ?? 0)

const alertas = computed(() => {
  const items: { tipo: 'warning' | 'danger' | 'info'; msg: string }[] = []
  if (percentualDF.value > 25) {
    items.push({ tipo: 'warning', msg: `Despesas Fixas elevadas: ${formatPercent(percentualDF.value)} do faturamento` })
  }
  const semMargem = precificacaoStore.todos.filter(r => r.produto.margemLucro < 20)
  if (semMargem.length > 0) {
    items.push({ tipo: 'warning', msg: `${semMargem.length} ${seg.value.rotulos.produto.toLowerCase()}(s) com margem abaixo de 20%` })
  }
  return items
})
</script>

<template>
  <div class="dashboard">
    <!-- Hero do segmento -->
    <div class="seg-hero" :style="{ background: `linear-gradient(120deg, ${seg.gradiente[0]}, ${seg.gradiente[1]})` }">
      <div class="seg-hero__icon">{{ seg.icone }}</div>
      <div class="seg-hero__text">
        <span class="seg-hero__company">{{ empresaStore.empresa?.razaoSocial }}</span>
        <span class="seg-hero__meta">
          {{ seg.nome }} · CNPJ {{ empresaStore.empresa?.cnpj }} ·
          {{ empresaStore.empresa?.regimeTributario === 'SIMPLES_NACIONAL' ? 'Simples Nacional' : empresaStore.empresa?.regimeTributario }}
          <template v-if="empresaStore.empresa?.anexoCadastrado"> · {{ empresaStore.empresa.anexoCadastrado.replace('_', ' ') }}</template>
        </span>
      </div>
    </div>

    <!-- Alertas -->
    <Transition name="slide-up">
      <div v-if="alertas.length" class="alertas">
        <div v-for="(a, i) in alertas" :key="i" class="alerta" :class="`alerta--${a.tipo}`">
          <span>⚠</span> {{ a.msg }}
        </div>
      </div>
    </Transition>

    <!-- Stat Cards -->
    <div class="stats-grid">
      <StatCard
        label="Faturamento Médio"
        :value="formatCurrency(empresaStore.empresa?.faturamentoMedioMensal ?? 0)"
        sub="por mês"
        icon="💰"
        color="green"
      />
      <StatCard
        label="Despesas Fixas"
        icon="📋"
        :color="percentualDF > 25 ? 'orange' : 'blue'"
      >
        <template #value>{{ formatCurrency(despesasStore.totalMensal) }}</template>
        <template #sub>{{ formatPercent(percentualDF) }} do faturamento</template>
      </StatCard>
      <StatCard
        :label="`${seg.rotulos.produtos} Ativos`"
        :value="precificacaoStore.todos.filter(r => r.produto.ativo).length.toString()"
        :sub="`de ${precificacaoStore.todos.length} cadastrados`"
        icon="🏷️"
        color="purple"
      />
      <StatCard
        v-if="!ehServico"
        :label="seg.rotulos.materiais"
        :value="materiaisStore.materiais.length.toString()"
        :sub="seg.chave === 'CONFEITARIA' ? 'insumos e embalagens' : 'matérias-primas e insumos'"
        icon="🧪"
        color="orange"
      />
      <StatCard v-else label="Fator R" icon="🧮" color="orange">
        <template #value><IndisponivelBackend :motivo="MOTIVO_FATOR_R" /></template>
      </StatCard>
    </div>

    <!-- Produtos e preços -->
    <div class="content-grid">
      <BaseCard title="Resumo de Precificação" subtitle="Preços calculados pelo backend">
        <template #actions>
          <button class="link-btn" @click="router.push('/precificacao')">Ver calculadora →</button>
        </template>

        <div v-if="precificacaoStore.loading" class="loading-rows">
          <div class="loading-row" v-for="i in 3" :key="i" />
        </div>
        <p v-else-if="precificacaoStore.erro" class="erro-precificacao">{{ precificacaoStore.erro }}</p>

        <table v-else class="data-table">
          <thead>
            <tr>
              <th>{{ seg.rotulos.produto }}</th>
              <th>Custo Base</th>
              <th>ML</th>
              <th>DF%</th>
              <th>Preço de Venda</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in precificacaoStore.todos"
              :key="item.produto.id"
              class="data-table__row"
              @click="router.push(`/produtos/${item.produto.id}`)"
            >
              <td class="data-table__name">{{ item.produto.nome }}</td>
              <td>{{ formatCurrency(item.custoBase) }}</td>
              <td>{{ formatPercent(item.produto.margemLucro) }}</td>
              <td>{{ formatPercent(item.percentualDespesasFixas) }}</td>
              <td class="data-table__price">{{ formatCurrency(item.precoVenda) }}</td>
              <td>
                <BaseBadge :color="item.produto.ativo ? 'green' : 'gray'">
                  {{ item.produto.ativo ? 'Ativo' : 'Inativo' }}
                </BaseBadge>
              </td>
            </tr>
          </tbody>
        </table>
      </BaseCard>

      <!-- Despesas breakdown -->
      <BaseCard title="Despesas Fixas" subtitle="Top despesas do mês">
        <template #actions>
          <button class="link-btn" @click="router.push('/despesas')">Gerenciar →</button>
        </template>

        <div class="despesas-list">
          <div
            v-for="d in despesasStore.despesas.filter(x => x.ativa).slice(0, 5)"
            :key="d.id"
            class="despesa-item"
          >
            <div class="despesa-item__info">
              <span class="despesa-item__desc">{{ d.descricao }}</span>
              <BaseBadge color="gray">{{ d.categoria }}</BaseBadge>
            </div>
            <span class="despesa-item__valor">{{ formatCurrency(d.valorMensal) }}</span>
          </div>
          <div class="despesa-total">
            <span>Total mensal</span>
            <strong>{{ formatCurrency(despesasStore.totalMensal) }}</strong>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<style scoped>
.dashboard { display: flex; flex-direction: column; gap: var(--space-6); }

.seg-hero {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-6);
  border-radius: 16px;
  color: #fff;
  box-shadow: var(--shadow-md, 0 8px 24px rgba(0,0,0,.12));
}
.seg-hero__icon {
  font-size: 2.25rem; line-height: 1;
  width: 60px; height: 60px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,.18);
  border-radius: 14px;
  flex-shrink: 0;
}
.seg-hero__text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.seg-hero__company { font-size: 1.15rem; font-weight: 700; }
.seg-hero__meta { font-size: .8125rem; opacity: .92; font-weight: 500; }

.alertas { display: flex; flex-direction: column; gap: var(--space-2); }
.alerta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius);
  font-size: .875rem;
  font-weight: 500;
}
.alerta--warning { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; }
.alerta--danger  { background: #fef2f2; border: 1px solid #fca5a5; color: #b91c1c; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-4);
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: var(--space-6);
}
@media (max-width: 1100px) { .content-grid { grid-template-columns: 1fr; } }

.erro-precificacao { color: var(--color-danger); font-size: .875rem; padding: var(--space-4) 0; }

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: .875rem;
}
.data-table th {
  text-align: left;
  padding: var(--space-2) var(--space-3);
  font-size: .75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .05em;
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-border-light);
}
.data-table__row {
  cursor: pointer;
  transition: background .12s;
}
.data-table__row:hover td { background: var(--color-bg-subtle); }
.data-table td {
  padding: var(--space-3);
  border-bottom: 1px solid var(--color-border-light);
  color: var(--color-text);
}
.data-table__name { font-weight: 500; }
.data-table__price { font-weight: 700; color: var(--color-primary-600); }

.link-btn {
  background: none;
  border: none;
  font-size: .8125rem;
  font-weight: 500;
  color: var(--color-primary-600);
  cursor: pointer;
  transition: color .15s;
}
.link-btn:hover { color: var(--color-primary-800); }

.despesas-list { display: flex; flex-direction: column; gap: var(--space-3); }
.despesa-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-border-light);
}
.despesa-item__info { display: flex; flex-direction: column; gap: var(--space-1); }
.despesa-item__desc { font-size: .875rem; font-weight: 500; color: var(--color-text); }
.despesa-item__valor { font-size: .9rem; font-weight: 600; color: var(--color-text); white-space: nowrap; }
.despesa-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--space-2);
  font-size: .875rem;
  font-weight: 600;
  color: var(--color-primary-700);
}

.loading-rows { display: flex; flex-direction: column; gap: var(--space-3); }
.loading-row {
  height: 40px;
  background: linear-gradient(90deg, var(--color-bg-subtle) 25%, var(--color-border-light) 50%, var(--color-bg-subtle) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: var(--radius-sm);
}
@keyframes shimmer { to { background-position: -200% 0; } }
</style>
