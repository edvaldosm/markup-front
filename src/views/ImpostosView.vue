<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useImpostosStore } from '@/stores/impostos'
import { useCurrency } from '@/composables/useMarkup'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import type { Imposto } from '@/types'

const store = useImpostosStore()
const { formatPercent } = useCurrency()

onMounted(() => store.fetchImpostos())

const showModal = ref(false)
const editando = ref<Partial<Imposto>>({})

function novo() {
  editando.value = { nome: '', chave: '', aliquotaPercentual: 0, descricao: '', ativo: true }
  showModal.value = true
}

function editar(i: Imposto) {
  editando.value = { ...i }
  showModal.value = true
}

async function salvar() {
  await store.salvar(editando.value as Imposto)
  showModal.value = false
}
</script>

<template>
  <div class="impostos">
    <div class="info-banner">
      <span class="info-banner__icon">ℹ</span>
      <div>
        <strong>Confeitaria e bolos → Anexo II (Indústria)</strong>
        <p>ISS = zero para venda de mercadoria própria. Alíquota DAS = 4,5% para faturamento anual até R$ 180.000,00.</p>
      </div>
    </div>

    <div class="toolbar">
      <h2 class="section-title">Impostos Cadastrados</h2>
      <BaseButton @click="novo">+ Novo Imposto</BaseButton>
    </div>

    <div class="cards-grid">
      <div v-for="imp in store.impostos" :key="imp.id" class="imposto-card" :class="{ 'imposto-card--inativo': !imp.ativo }">
        <div class="imposto-card__header">
          <div>
            <h3 class="imposto-card__nome">{{ imp.nome }}</h3>
            <code class="imposto-card__chave">{{ imp.chave }}</code>
          </div>
          <div class="imposto-card__aliquota">{{ formatPercent(imp.aliquotaPercentual) }}</div>
        </div>
        <p class="imposto-card__desc">{{ imp.descricao }}</p>
        <div class="imposto-card__footer">
          <BaseBadge :color="imp.ativo ? 'green' : 'gray'">{{ imp.ativo ? 'Ativo' : 'Inativo' }}</BaseBadge>
          <BaseButton size="sm" variant="ghost" @click="editar(imp)">Editar</BaseButton>
        </div>
      </div>
    </div>

    <!-- Tabela Simples Nacional -->
    <BaseCard title="Tabela Simples Nacional — Anexo II (Confeitaria / Indústria)" subtitle="Alíquotas por faixa de faturamento anual">
      <table class="table">
        <thead>
          <tr>
            <th>Faixa de Faturamento (12 meses)</th>
            <th>Alíquota DAS</th>
            <th>ISS</th>
            <th>Impostos inclusos</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Até R$ 180.000,00</td>
            <td><BaseBadge color="green">4,5%</BaseBadge></td>
            <td><BaseBadge color="gray">Zero</BaseBadge></td>
            <td class="td-muted">PIS, COFINS, IRPJ, CSLL, IPI, ICMS (DAS unificado)</td>
          </tr>
          <tr>
            <td>R$ 180.001 a R$ 360.000</td>
            <td><BaseBadge color="blue">7,8%</BaseBadge></td>
            <td><BaseBadge color="gray">Zero</BaseBadge></td>
            <td class="td-muted">DAS unificado</td>
          </tr>
          <tr>
            <td>R$ 360.001 a R$ 720.000</td>
            <td><BaseBadge color="orange">10%</BaseBadge></td>
            <td><BaseBadge color="gray">Zero</BaseBadge></td>
            <td class="td-muted">DAS unificado</td>
          </tr>
          <tr>
            <td>R$ 720.001 a R$ 1.800.000</td>
            <td><BaseBadge color="orange">11,2%</BaseBadge></td>
            <td><BaseBadge color="gray">Zero</BaseBadge></td>
            <td class="td-muted">DAS unificado</td>
          </tr>
        </tbody>
      </table>
      <p class="table-note">Limite MEI 2026: R$ 81.000/ano (R$ 6.750/mês)</p>
    </BaseCard>

    <BaseModal v-if="showModal" :title="editando.id ? 'Editar Imposto' : 'Novo Imposto'" @close="showModal = false">
      <form class="form-grid" @submit.prevent="salvar">
        <div class="field" style="grid-column: 1/-1">
          <label class="field__label">Nome</label>
          <input v-model="editando.nome" class="input" required />
        </div>
        <div class="field">
          <label class="field__label">Chave (identificador único)</label>
          <input v-model="editando.chave" class="input" required placeholder="SIMPLES_NACIONAL_..." />
        </div>
        <div class="field">
          <label class="field__label">Alíquota (%)</label>
          <input v-model.number="editando.aliquotaPercentual" type="number" step="0.01" class="input" required />
        </div>
        <div class="field" style="grid-column: 1/-1">
          <label class="field__label">Descrição</label>
          <textarea v-model="editando.descricao" class="input" rows="3" />
        </div>
        <div class="field">
          <label class="toggle-field">
            <input v-model="editando.ativo" type="checkbox" class="toggle-input" />
            <span>Imposto ativo</span>
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
.impostos { display: flex; flex-direction: column; gap: var(--space-5); }

.info-banner {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  background: var(--color-primary-50);
  border: 1px solid var(--color-primary-200);
  border-radius: var(--radius-lg);
  font-size: .875rem;
}
.info-banner__icon { font-size: 1.25rem; flex-shrink: 0; }
.info-banner strong { display: block; color: var(--color-primary-800); font-weight: 600; margin-bottom: 2px; }
.info-banner p { color: var(--color-primary-700); }

.toolbar { display: flex; align-items: center; justify-content: space-between; }
.section-title { font-size: 1rem; font-weight: 600; color: var(--color-text); }

.cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-4); }

.imposto-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  transition: box-shadow .2s;
}
.imposto-card:hover { box-shadow: var(--shadow-sm); }
.imposto-card--inativo { opacity: .6; }

.imposto-card__header { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-3); }
.imposto-card__nome { font-size: .9375rem; font-weight: 600; color: var(--color-text); }
.imposto-card__chave {
  display: block;
  font-size: .7rem;
  background: var(--color-bg-subtle);
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  margin-top: 4px;
}
.imposto-card__aliquota {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-primary-600);
  white-space: nowrap;
}
.imposto-card__desc { font-size: .8125rem; color: var(--color-text-muted); flex: 1; }
.imposto-card__footer { display: flex; align-items: center; justify-content: space-between; }

.table { width: 100%; border-collapse: collapse; font-size: .875rem; }
.table th { text-align: left; padding: var(--space-2) var(--space-3); font-size: .75rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: var(--color-text-muted); border-bottom: 1px solid var(--color-border-light); }
.table td { padding: var(--space-3); border-bottom: 1px solid var(--color-border-light); }
.td-muted { color: var(--color-text-muted); font-size: .8125rem; }
.table-note { font-size: .75rem; color: var(--color-text-light); margin-top: var(--space-3); }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
.field { display: flex; flex-direction: column; gap: var(--space-1); }
.field__label { font-size: .8125rem; font-weight: 500; color: var(--color-text-muted); }
.input { padding: var(--space-2) var(--space-3); border: 1.5px solid var(--color-border); border-radius: var(--radius); font-size: .9rem; color: var(--color-text); outline: none; background: var(--color-surface); font-family: inherit; resize: vertical; }
.input:focus { border-color: var(--color-primary-400); box-shadow: 0 0 0 3px rgba(85,181,89,.15); }
.toggle-field { display: flex; align-items: center; gap: var(--space-2); cursor: pointer; font-size: .875rem; }
.toggle-input { width: 16px; height: 16px; accent-color: var(--color-primary-500); }
</style>
