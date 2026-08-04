<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { Empresa } from '@/types'
import { useEmpresaStore } from '@/stores/empresa'
import { useDespesasStore } from '@/stores/despesas'
import { useCurrency } from '@/composables/useCurrency'
import { segmentoConfig } from '@/config/segmentos'
import FatorRNote from '@/components/ui/FatorRNote.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import StatCard from '@/components/ui/StatCard.vue'
import IndisponivelBackend from '@/components/ui/IndisponivelBackend.vue'

const store = useEmpresaStore()
const despesasStore = useDespesasStore()
const { formatCurrency, formatPercent } = useCurrency()

/**
 * Fator R não tem campo no contrato (nem persistido, nem simulado) — só existe
 * dentro de `ResultadoPrecificacao`, por produto. Pendência registrada em
 * `integracao-backend-precificacao/spec.md`. Sem fórmula local no lugar
 * (Artigo III v2.5.0): o formulário para de prever o anexo em tempo real.
 */
const MOTIVO_FATOR_R = 'Fator R por empresa ainda não é um campo do contrato — pendência registrada para o backend.'
const seg = computed(() => segmentoConfig(store.empresa?.segmento))

onMounted(() => Promise.all([store.fetchEmpresa(), despesasStore.fetchDespesas()]))

const form = ref<{
  razaoSocial: string
  cnpj: string
  segmento: Empresa['segmento']
  regimeTributario: Empresa['regimeTributario']
  anexoCadastrado: NonNullable<Empresa['anexoCadastrado']>
  faturamentoMedioMensal: number
  folhaPagamentoMensal: number
}>({ razaoSocial: '', cnpj: '', segmento: 'CONFEITARIA', regimeTributario: 'SIMPLES_NACIONAL', anexoCadastrado: 'ANEXO_II', faturamentoMedioMensal: 0, folhaPagamentoMensal: 0 })
const salvando = ref(false)
const salvo = ref(false)

const ehServico = computed(() => form.value.segmento === 'SERVICOS')

watch(() => store.empresa, (emp) => {
  if (emp) {
    form.value = {
      razaoSocial: emp.razaoSocial,
      cnpj: emp.cnpj ?? '',
      segmento: emp.segmento,
      regimeTributario: emp.regimeTributario,
      anexoCadastrado: emp.anexoCadastrado ?? 'ANEXO_II',
      faturamentoMedioMensal: emp.faturamentoMedioMensal,
      folhaPagamentoMensal: emp.folhaPagamentoMensal ?? 0,
    }
  }
}, { immediate: true })

async function salvar() {
  salvando.value = true
  await store.salvarEmpresa(form.value)
  salvando.value = false
  salvo.value = true
  setTimeout(() => { salvo.value = false }, 2500)
}

const regimes = [
  { value: 'MEI', label: 'MEI' },
  { value: 'SIMPLES_NACIONAL', label: 'Simples Nacional' },
  { value: 'LUCRO_PRESUMIDO', label: 'Lucro Presumido' },
  { value: 'LUCRO_REAL', label: 'Lucro Real' },
]
const anexos = ['ANEXO_I','ANEXO_II','ANEXO_III','ANEXO_IV','ANEXO_V']
const segmentos = [
  { value: 'CONFEITARIA', label: '🧁 Confeitaria' },
  { value: 'INDUSTRIA', label: '🏭 Indústria' },
  { value: 'SERVICOS', label: '🛠️ Serviços' },
]
</script>

<template>
  <div class="empresa">
    <div class="empresa-grid">
      <!-- Formulário -->
      <div>
        <BaseCard title="Dados Cadastrais" subtitle="Informações básicas da empresa">
          <form class="form" @submit.prevent="salvar">
            <div class="field">
              <label class="field__label">Razão Social</label>
              <input v-model="form.razaoSocial" class="input" required />
            </div>
            <div class="form-row">
              <div class="field">
                <label class="field__label">CNPJ</label>
                <input v-model="form.cnpj" class="input" placeholder="00.000.000/0000-00" />
              </div>
              <div class="field">
                <label class="field__label">Segmento de Negócio</label>
                <select v-model="form.segmento" class="input">
                  <option v-for="s in segmentos" :key="s.value" :value="s.value">{{ s.label }}</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="field">
                <label class="field__label">Regime Tributário</label>
                <select v-model="form.regimeTributario" class="input">
                  <option v-for="r in regimes" :key="r.value" :value="r.value">{{ r.label }}</option>
                </select>
              </div>
              <div class="field" v-if="form.regimeTributario === 'SIMPLES_NACIONAL'">
                <label class="field__label">Anexo Simples</label>
                <select v-model="form.anexoCadastrado" class="input">
                  <option v-for="a in anexos" :key="a" :value="a">{{ a.replace('_', ' ') }}</option>
                </select>
              </div>
            </div>
            <div class="field">
              <label class="field__label">Faturamento Médio Mensal (R$)</label>
              <input v-model.number="form.faturamentoMedioMensal" type="number" step="100" class="input" required />
              <p class="field__hint">Base de cálculo para rateio das Despesas Fixas. Revisar mensalmente.</p>
            </div>
            <div class="field" v-if="ehServico">
              <label class="field__label">Folha de Pagamento Mensal (R$)</label>
              <input v-model.number="form.folhaPagamentoMensal" type="number" step="100" class="input" />
              <p class="field__hint">
                Salários + pró-labore + encargos. Numerador do <strong>Fator R</strong>.
                Atual: <IndisponivelBackend :motivo="MOTIVO_FATOR_R" />
              </p>
            </div>

            <div class="form-actions">
              <Transition name="fade">
                <span v-if="salvo" class="salvo-msg">✓ Dados salvos com sucesso</span>
              </Transition>
              <BaseButton type="submit" :loading="salvando">Salvar Alterações</BaseButton>
            </div>
          </form>
        </BaseCard>

        <!-- Nota do Fator R — só aparece para Serviços -->
        <Transition name="fade">
          <FatorRNote v-if="ehServico" class="empresa__nota" />
        </Transition>
      </div>

      <!-- Info lateral -->
      <div class="empresa__sidebar">
        <BaseCard title="Indicadores" subtitle="Calculados com os dados atuais">
          <div class="indicators">
            <div class="indicator">
              <span class="indicator__label">Faturamento Médio</span>
              <span class="indicator__value">{{ formatCurrency(store.empresa?.faturamentoMedioMensal ?? 0) }}</span>
              <span class="indicator__sub">por mês</span>
            </div>
            <div class="indicator">
              <span class="indicator__label">% Despesas Fixas</span>
              <span class="indicator__value" :class="{ 'text-warning': (store.empresa?.percentualDespesasFixas ?? 0) > 20 }">
                {{ formatPercent((store.empresa?.percentualDespesasFixas ?? 0)) }}
              </span>
              <span class="indicator__sub">sobre o faturamento</span>
            </div>
            <div class="indicator">
              <span class="indicator__label">Segmento</span>
              <span class="indicator__value" style="font-size:1rem">{{ seg.icone }} {{ seg.nome }}</span>
              <span class="indicator__sub">{{ seg.descricao }}</span>
            </div>
            <div class="indicator">
              <span class="indicator__label">Regime</span>
              <BaseBadge color="green">{{ store.empresa?.regimeTributario ?? '—' }}</BaseBadge>
              <span v-if="store.empresa?.anexoCadastrado" class="indicator__sub">{{ store.empresa.anexoCadastrado.replace('_',' ') }}</span>
            </div>
            <div class="indicator" v-if="ehServico">
              <span class="indicator__label">Fator R</span>
              <IndisponivelBackend :motivo="MOTIVO_FATOR_R" />
            </div>
          </div>
        </BaseCard>

        <div class="info-box">
          <h4>⚠ Revise o Faturamento Médio mensalmente</h4>
          <p>O percentual de Despesas Fixas é calculado automaticamente como:<br>
          <code>% DF = Total Despesas / Faturamento Médio × 100</code><br>
          Se o faturamento mudar, a precificação de todos os produtos é afetada.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.empresa { }
.empresa-grid { display: grid; grid-template-columns: 1fr 300px; gap: var(--space-6); align-items: start; }
@media (max-width: 900px) { .empresa-grid { grid-template-columns: 1fr; } }

.form { display: flex; flex-direction: column; gap: var(--space-4); }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
.field { display: flex; flex-direction: column; gap: var(--space-1); }
.field__label { font-size: .8125rem; font-weight: 500; color: var(--color-text-muted); }
.field__hint { font-size: .75rem; color: var(--color-text-light); }
.input {
  padding: var(--space-2) var(--space-3);
  border: 1.5px solid var(--color-border); border-radius: var(--radius);
  font-size: .9rem; color: var(--color-text);
  outline: none; background: var(--color-surface); font-family: inherit;
}
.input:focus { border-color: var(--color-primary-400); box-shadow: 0 0 0 3px rgba(85,181,89,.15); }
.form-actions { display: flex; align-items: center; justify-content: flex-end; gap: var(--space-4); padding-top: var(--space-2); }
.salvo-msg { font-size: .875rem; color: var(--color-primary-600); font-weight: 500; }

.empresa__nota { margin-top: var(--space-4); }

.empresa__sidebar { display: flex; flex-direction: column; gap: var(--space-4); }
.indicators { display: flex; flex-direction: column; gap: var(--space-4); }
.indicator { display: flex; flex-direction: column; gap: 2px; padding-bottom: var(--space-3); border-bottom: 1px solid var(--color-border-light); }
.indicator:last-child { border-bottom: none; padding-bottom: 0; }
.indicator__label { font-size: .7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: var(--color-text-muted); }
.indicator__value { font-size: 1.25rem; font-weight: 700; color: var(--color-text); }
.indicator__sub { font-size: .75rem; color: var(--color-text-light); }
.text-warning { color: var(--color-warning) !important; }

.info-box {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
}
.info-box h4 { font-size: .875rem; font-weight: 600; color: #92400e; margin-bottom: var(--space-2); }
.info-box p { font-size: .8125rem; color: #78350f; line-height: 1.6; }
.info-box code { background: rgba(0,0,0,.07); padding: 1px 4px; border-radius: 3px; font-size: .75rem; }
</style>
