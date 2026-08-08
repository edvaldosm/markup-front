<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useEmpresaStore } from '@/stores/empresa'
import { useDespesasStore } from '@/stores/despesas'
import { useCurrency } from '@/composables/useCurrency'
import { usePaginacao } from '@/composables/usePaginacao'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import StatCard from '@/components/ui/StatCard.vue'
import InfiniteScrollSentinel from '@/components/ui/InfiniteScrollSentinel.vue'
import CurrencyInput from '@/components/ui/CurrencyInput.vue'
import type { DespesaFixa, DespesaFixaEntrada } from '@/types'

const store = useDespesasStore()
const empresaStore = useEmpresaStore()
const { formatCurrency, formatPercent } = useCurrency()

onMounted(() => Promise.all([store.fetchDespesas(), empresaStore.fetchEmpresa()]))

const showModal = ref(false)
const editando = ref<Partial<DespesaFixa>>({})

/**
 * Rateio (C2) calculado pelo servidor. Alternar uma despesa recarrega a empresa,
 * entao este numero se atualiza sozinho — sem o front refazer a conta (B1).
 */
const percentualDF = computed(() => empresaStore.empresa?.percentualDespesasFixas ?? 0)

const categoriaLabel: Record<string, string> = {
  ALUGUEL: 'Aluguel', ENERGIA: 'Energia', GAS: 'Gás',
  INTERNET: 'Internet', PROLABORE: 'Pró-labore',
  CONTADOR: 'Contador', OUTRO: 'Outro'
}

// Infinite scroll — pageSize configurável (padrão 10)
const todasDespesas = computed(() => store.despesas)
const {
  itensVisiveis,
  temMais,
  carregandoMais,
  totalItens,
  sentinelaEl,
  carregarMais,
} = usePaginacao(todasDespesas, { pageSize: 10 })

function nova() {
  editando.value = { descricao: '', valorMensal: 0, categoria: 'OUTRO', ativa: true }
  showModal.value = true
}

function editar(d: DespesaFixa) {
  editando.value = { ...d }
  showModal.value = true
}

async function salvar() {
  const salva = await store.salvar(editando.value as DespesaFixaEntrada)
  if (salva) showModal.value = false
}

/**
 * Inativar substitui excluir. Despesa fixa entrou no rateio que formou precos ja
 * praticados: apaga-la destruiria a explicacao daqueles precos. Inativa sai do
 * calculo e o historico fica.
 */
async function alternar(d: DespesaFixa) {
  const acao = d.ativa ? 'Inativar' : 'Reativar'
  if (confirm(`${acao} "${d.descricao}"? Despesa inativa nao entra no rateio.`)) {
    await store.alternarAtiva(d.id, !d.ativa)
  }
}

const categorias = ['ALUGUEL','ENERGIA','GAS','INTERNET','PROLABORE','CONTADOR','OUTRO']
</script>

<template>
  <div class="despesas">
    <div class="stats-row">
      <StatCard label="Total Mensal" sub="despesas ativas" icon="📋" color="blue">
        <template #value>{{ formatCurrency(store.totalMensal) }}</template>
      </StatCard>
      <StatCard
        label="% do Faturamento"
        :value="formatPercent(percentualDF)"
        :sub="percentualDF > 20 ? 'Atenção: acima de 20%' : 'Dentro do esperado'"
        icon="📊"
        :color="percentualDF > 20 ? 'orange' : 'green'"
      />
      <StatCard
        label="Itens Ativos"
        :value="store.despesas.filter(d => d.ativa).length.toString()"
        :sub="`de ${store.despesas.length} no total`"
        icon="✓"
        color="purple"
      />
    </div>

    <div class="toolbar">
      <h2 class="section-title">Despesas Cadastradas</h2>
      <BaseButton @click="nova">+ Nova Despesa</BaseButton>
    </div>

    <BaseCard>
      <table class="table">
        <thead>
          <tr>
            <th>Descrição</th>
            <th>Categoria</th>
            <th>Valor Mensal</th>
            <th>% do Faturamento</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="d in itensVisiveis" :key="d.id" class="table__row" :class="{ 'table__row--inativa': !d.ativa }">
            <td class="table__name">{{ d.descricao }}</td>
            <td><BaseBadge color="blue">{{ categoriaLabel[d.categoria] }}</BaseBadge></td>
            <td class="table__valor">{{ formatCurrency(d.valorMensal) }}</td>
            <td class="table__muted">
              {{ empresaStore.empresa ? formatPercent(d.valorMensal / empresaStore.empresa.faturamentoMedioMensal * 100) : '—' }}
            </td>
            <td>
              <BaseBadge :color="d.ativa ? 'green' : 'gray'">{{ d.ativa ? 'Ativa' : 'Inativa' }}</BaseBadge>
            </td>
            <td class="table__actions">
              <BaseButton size="sm" variant="ghost" @click="editar(d)">Editar</BaseButton>
              <BaseButton size="sm" :variant="d.ativa ? 'danger' : 'secondary'" @click="alternar(d)">
                {{ d.ativa ? 'Inativar' : 'Reativar' }}
              </BaseButton>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Sentinela de scroll infinito -->
      <div ref="sentinelaEl" class="sentinela-wrapper">
        <InfiniteScrollSentinel
          :carregando-mais="carregandoMais"
          :tem-mais="temMais"
          :total-itens="totalItens"
          @carregar-mais="carregarMais"
        />
      </div>
    </BaseCard>

    <BaseModal v-if="showModal" :title="editando.id ? 'Editar Despesa' : 'Nova Despesa Fixa'" @close="showModal = false">
      <form class="form-grid" @submit.prevent="salvar">
        <div class="field" style="grid-column: 1/-1">
          <label class="field__label">Descrição</label>
          <input v-model="editando.descricao" class="input" required placeholder="Ex: Aluguel do espaço" />
        </div>
        <div class="field">
          <label class="field__label">Categoria</label>
          <select v-model="editando.categoria" class="input">
            <option v-for="c in categorias" :key="c" :value="c">{{ categoriaLabel[c] }}</option>
          </select>
        </div>
        <CurrencyInput v-model="editando.valorMensal" label="Valor Mensal (R$)" />
        <div class="field" style="grid-column: 1/-1">
          <label class="toggle-field">
            <input v-model="editando.ativa" type="checkbox" class="toggle-input" />
            <span>Despesa ativa</span>
          </label>
        </div>
      </form>
      <template #footer>
        <BaseButton variant="ghost" @click="showModal = false">Cancelar</BaseButton>
        <BaseButton :loading="store.loading" @click="salvar">Salvar</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.despesas { display: flex; flex-direction: column; gap: var(--space-5); }
.stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-4); }
.toolbar { display: flex; align-items: center; justify-content: space-between; }
.section-title { font-size: 1rem; font-weight: 600; color: var(--color-text); }

.table { width: 100%; border-collapse: collapse; font-size: .875rem; }
.table th {
  text-align: left; padding: var(--space-2) var(--space-3);
  font-size: .75rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em;
  color: var(--color-text-muted); border-bottom: 1px solid var(--color-border-light);
}
.table td { padding: var(--space-3); border-bottom: 1px solid var(--color-border-light); }
.table__row:hover td { background: var(--color-bg-subtle); }
.table__row--inativa td { opacity: .5; }
.table__name { font-weight: 500; color: var(--color-text); }
.table__valor { font-weight: 600; color: var(--color-text); }
.table__muted { color: var(--color-text-muted); font-size: .8125rem; }
.table__actions { display: flex; gap: var(--space-2); }

.sentinela-wrapper { border-top: 1px dashed var(--color-border-light); }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
.field { display: flex; flex-direction: column; gap: var(--space-1); }
.field__label { font-size: .8125rem; font-weight: 500; color: var(--color-text-muted); }
.input {
  padding: var(--space-2) var(--space-3);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius); font-size: .9rem; color: var(--color-text);
  outline: none; background: var(--color-surface); font-family: inherit;
}
.input:focus { border-color: var(--color-primary-400); box-shadow: 0 0 0 3px rgba(85,181,89,.15); }
.toggle-field { display: flex; align-items: center; gap: var(--space-2); cursor: pointer; font-size: .875rem; }
.toggle-input { width: 16px; height: 16px; accent-color: var(--color-primary-500); }
</style>
