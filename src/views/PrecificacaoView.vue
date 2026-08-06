<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useEmpresaStore } from '@/stores/empresa'
import { useDespesasStore } from '@/stores/despesas'
import { useMateriaisStore } from '@/stores/materiais'
import { useProdutosStore } from '@/stores/produtos'
import { usePrecificacaoStore } from '@/stores/precificacao'
import { useCurrency } from '@/composables/useCurrency'
import { apolloClient } from '@/graphql/client'
import { SIMULAR_MARKUP } from '@/graphql/operations/precificacao'
import { mensagemDeErro } from '@/graphql/erros'
import BaseCard from '@/components/ui/BaseCard.vue'
import type { Produto, SimulacaoMarkup } from '@/types'

const empresaStore = useEmpresaStore()
const despesasStore = useDespesasStore()
const materiaisStore = useMateriaisStore()
const produtosStore = useProdutosStore()
const precificacaoStore = usePrecificacaoStore()
const { formatCurrency, formatPercent } = useCurrency()

onMounted(async () => {
  await Promise.all([
    empresaStore.fetchEmpresa(),
    despesasStore.fetchDespesas(),
    materiaisStore.fetchMateriais(),
    produtosStore.fetchProdutos(),
  ])
  if (produtosStore.produtos.length) {
    produtoSelecionadoId.value = produtosStore.produtos[0].id
  }
})

const produtoSelecionadoId = ref('')

const produto = computed<Produto | undefined>(() =>
  produtosStore.produtos.find(p => p.id === produtoSelecionadoId.value)
)

/** Preço, breakdown e faixa — inteiramente do backend (C1–C12). */
const resultado = computed(() =>
  produtoSelecionadoId.value ? precificacaoStore.resultadoDe(produtoSelecionadoId.value) : null
)

watch(produtoSelecionadoId, (id) => {
  if (id) precificacaoStore.buscarProduto(id)
}, { immediate: true })

// ── Simulação Manual — sem produto, sem empresa, stateless ─────────────────

const simCustoBase = ref(0)
const simImpostos = ref(0)
const simDespesasFixas = ref(0)
const simMargemLucro = ref(0)
const simDesconto = ref(0)

/** Máscara monetária por dígitos — mesmo padrão usado em `FatorRView`. */
const simCustoBaseTexto = computed<string>({
  get: () => formatCurrency(simCustoBase.value),
  set: (valor: string) => {
    const digitos = valor.replace(/\D/g, '')
    simCustoBase.value = digitos ? Number(digitos) / 100 : 0
  },
})

const simulacao = ref<SimulacaoMarkup | null>(null)
const simulando = ref(false)
const erroSimulacao = ref<string | null>(null)
let debounceSimulacao: ReturnType<typeof setTimeout> | undefined

async function simularMarkup(): Promise<void> {
  if (simCustoBase.value <= 0) { simulacao.value = null; return }
  simulando.value = true
  erroSimulacao.value = null
  try {
    const { data } = await apolloClient.query({
      query: SIMULAR_MARKUP,
      variables: {
        custoBase: simCustoBase.value,
        percentualImpostos: simImpostos.value,
        percentualDespesasFixas: simDespesasFixas.value,
        percentualMargemLucro: simMargemLucro.value,
        percentualDesconto: simDesconto.value,
      },
      fetchPolicy: 'network-only',
    })
    simulacao.value = data.simularMarkup
  } catch (e) {
    erroSimulacao.value = mensagemDeErro(e, 'simularMarkup')
    simulacao.value = null
  } finally {
    simulando.value = false
  }
}

watch([simCustoBase, simImpostos, simDespesasFixas, simMargemLucro, simDesconto], () => {
  clearTimeout(debounceSimulacao)
  debounceSimulacao = setTimeout(simularMarkup, 350)
})
</script>

<template>
  <div class="precificacao">
    <div class="precificacao__grid">
      <!-- Calculadora por produto -->
      <BaseCard title="Calculadora por Produto" subtitle="Selecione um produto cadastrado">
        <div class="selector-row">
          <label class="field__label">Produto</label>
          <select v-model="produtoSelecionadoId" class="select">
            <option value="" disabled>Selecione um produto</option>
            <option v-for="p in produtosStore.produtos" :key="p.id" :value="p.id">{{ p.nome }}</option>
          </select>
        </div>

        <div v-if="resultado && produto" class="resultado-card">
          <div class="resultado-header">
            <h3>{{ produto.nome }}</h3>
            <div class="resultado-pv">
              <span class="resultado-pv__label">Preço de Venda</span>
              <span class="resultado-pv__value">{{ formatCurrency(resultado.precoVenda) }}</span>
            </div>
          </div>

          <!-- Fórmula visual -->
          <div class="formula-block">
            <div class="formula-step">
              <span class="formula-step__label">Custo Base (CP)</span>
              <span class="formula-step__value">{{ formatCurrency(resultado.custoBase) }}</span>
            </div>
            <div class="formula-divider">÷</div>
            <div class="formula-step formula-step--divisor">
              <span class="formula-step__label">Divisor Markup</span>
              <span class="formula-step__value">{{ resultado.divisorMarkup.toFixed(4) }}</span>
              <span class="formula-step__detail">1 − {{ formatPercent(resultado.somaTotalPercentuais) }}</span>
            </div>
            <div class="formula-divider">=</div>
            <div class="formula-step formula-step--result">
              <span class="formula-step__label">PV Final</span>
              <span class="formula-step__value">{{ formatCurrency(resultado.precoVenda) }}</span>
            </div>
          </div>

          <!-- Breakdown -->
          <div class="breakdown">
            <h4 class="breakdown__title">Composição do Preço</h4>
            <div class="breakdown-bar">
              <div class="breakdown-bar__segment breakdown-bar__segment--cp"
                :style="`width: ${(100 - resultado.somaTotalPercentuais).toFixed(1)}%`" />
              <div class="breakdown-bar__segment breakdown-bar__segment--imposto"
                :style="`width: ${resultado.percentualImpostos}%`" />
              <div class="breakdown-bar__segment breakdown-bar__segment--df"
                :style="`width: ${resultado.percentualDespesasFixas.toFixed(1)}%`" />
              <div class="breakdown-bar__segment breakdown-bar__segment--desconto"
                :style="`width: ${resultado.percentualDesconto}%`" />
              <div class="breakdown-bar__segment breakdown-bar__segment--lucro"
                :style="`width: ${resultado.percentualMargemLucro}%`" />
            </div>
            <div class="breakdown-items">
              <div class="breakdown-item">
                <div class="breakdown-item__dot breakdown-item__dot--cp" />
                <span>Custo de Produção</span>
                <strong>{{ formatCurrency(resultado.breakdown.custoRecuperado) }}</strong>
                <span class="breakdown-item__pct">{{ formatPercent(100 - resultado.somaTotalPercentuais) }}</span>
              </div>
              <div class="breakdown-item">
                <div class="breakdown-item__dot breakdown-item__dot--imposto" />
                <span>Impostos ({{ formatPercent(resultado.percentualImpostos) }})</span>
                <strong>{{ formatCurrency(resultado.breakdown.valorImpostos) }}</strong>
                <span class="breakdown-item__pct">{{ formatPercent(resultado.percentualImpostos) }}</span>
              </div>
              <div class="breakdown-item">
                <div class="breakdown-item__dot breakdown-item__dot--df" />
                <span>Despesas Fixas</span>
                <strong>{{ formatCurrency(resultado.breakdown.valorDespesasFixas) }}</strong>
                <span class="breakdown-item__pct">{{ formatPercent(resultado.percentualDespesasFixas) }}</span>
              </div>
              <div class="breakdown-item">
                <div class="breakdown-item__dot breakdown-item__dot--desconto" />
                <span>Desconto Máximo</span>
                <strong>{{ formatCurrency(resultado.breakdown.valorDesconto) }}</strong>
                <span class="breakdown-item__pct">{{ formatPercent(resultado.percentualDesconto) }}</span>
              </div>
              <div class="breakdown-item breakdown-item--lucro">
                <div class="breakdown-item__dot breakdown-item__dot--lucro" />
                <span>Lucro Líquido</span>
                <strong>{{ formatCurrency(resultado.breakdown.lucroLiquido) }}</strong>
                <span class="breakdown-item__pct">{{ formatPercent(resultado.percentualMargemLucro) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <span>◈</span>
          <p>Selecione um produto para calcular o preço de venda</p>
        </div>
      </BaseCard>

      <!-- Simulação Manual: stateless, via simularMarkup -->
      <BaseCard title="Simulação Manual" subtitle="Insira os valores para simular">
        <div class="sim-form">
          <div class="field">
            <label class="field__label">Custo Base — CP (R$)</label>
            <input v-model="simCustoBaseTexto" type="text" inputmode="numeric" class="input" />
          </div>
          <div class="field">
            <label class="field__label">Impostos (%)</label>
            <input v-model.number="simImpostos" type="number" step="0.1" min="0" class="input" />
          </div>
          <div class="field">
            <label class="field__label">Despesas Fixas — DF (%)</label>
            <input v-model.number="simDespesasFixas" type="number" step="0.1" min="0" class="input" />
          </div>
          <div class="field">
            <label class="field__label">Margem de Lucro — ML (%)</label>
            <input v-model.number="simMargemLucro" type="number" step="0.1" min="0" class="input" />
          </div>
          <div class="field">
            <label class="field__label">Desconto Máximo (%)</label>
            <input v-model.number="simDesconto" type="number" step="0.1" min="0" class="input" />
          </div>
        </div>

        <p v-if="erroSimulacao" class="sim-erro">{{ erroSimulacao }}</p>

        <Transition name="fade">
          <div v-if="simulacao" class="sim-resultado">
            <div class="sim-resultado__formula">
              <span>PV = CP / Divisor</span>
              <span>{{ formatCurrency(simulacao.custoBase) }} / {{ simulacao.divisorMarkup.toFixed(4) }}</span>
            </div>
            <div class="sim-resultado__pv">
              <span class="sim-resultado__pv-label">Preço de Venda</span>
              <span class="sim-resultado__pv-value">{{ formatCurrency(simulacao.precoVenda) }}</span>
            </div>
            <div class="sim-resultado__rodape">
              Soma dos percentuais: {{ formatPercent(simulacao.somaTotalPercentuais) }} ·
              Divisor: {{ simulacao.divisorMarkup.toFixed(4) }}
            </div>
          </div>
          <p v-else-if="simulando" class="sim-carregando">Calculando…</p>
        </Transition>
      </BaseCard>
    </div>
  </div>
</template>

<style scoped>
.precificacao__grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: var(--space-6);
  align-items: start;
}
@media (max-width: 1100px) { .precificacao__grid { grid-template-columns: 1fr; } }

.selector-row { margin-bottom: var(--space-5); }
.field__label { font-size: .8125rem; font-weight: 500; color: var(--color-text-muted); display: block; margin-bottom: var(--space-1); }

.sim-form { display: flex; flex-direction: column; gap: var(--space-4); }
.sim-form .field { display: flex; flex-direction: column; gap: var(--space-1); }

.sim-erro { color: var(--color-danger, #dc2626); font-size: .8125rem; margin-top: var(--space-3); }
.sim-carregando { color: var(--color-text-muted); font-size: .8125rem; margin-top: var(--space-4); font-style: italic; }

.sim-resultado {
  margin-top: var(--space-5);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, #059669 8%, transparent);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.sim-resultado__formula {
  display: flex; justify-content: space-between;
  font-size: .75rem; color: var(--color-text-muted);
}
.sim-resultado__pv { display: flex; flex-direction: column; gap: 2px; }
.sim-resultado__pv-label { font-size: .75rem; color: var(--color-text-muted); }
.sim-resultado__pv-value { font-size: 1.6rem; font-weight: 800; color: #059669; }
.sim-resultado__rodape { font-size: .7rem; color: var(--color-text-light); }

.fade-enter-active, .fade-leave-active { transition: opacity .2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.select {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  font-size: .9rem;
  color: var(--color-text);
  outline: none;
  cursor: pointer;
}
.select:focus { border-color: var(--color-primary-400); box-shadow: 0 0 0 3px rgba(85,181,89,.15); }

.resultado-card { display: flex; flex-direction: column; gap: var(--space-6); }

.resultado-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: var(--space-3);
}
.resultado-header h3 { font-size: 1rem; font-weight: 600; color: var(--color-text); }
.resultado-pv { text-align: right; }
.resultado-pv__label { display: block; font-size: .75rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: .05em; }
.resultado-pv__value { font-size: 1.75rem; font-weight: 800; color: var(--color-primary-600); }

.formula-block {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  flex-wrap: wrap;
}
.formula-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  flex: 1;
  min-width: 90px;
}
.formula-step__label { font-size: .7rem; text-transform: uppercase; letter-spacing: .06em; color: var(--color-text-muted); }
.formula-step__value { font-size: 1.125rem; font-weight: 700; color: var(--color-text); margin-top: 2px; }
.formula-step__detail { font-size: .7rem; color: var(--color-text-light); margin-top: 2px; }
.formula-step--result .formula-step__value { color: var(--color-primary-600); }
.formula-divider { font-size: 1.25rem; font-weight: 300; color: var(--color-text-light); }

.breakdown { display: flex; flex-direction: column; gap: var(--space-3); }
.breakdown__title { font-size: .8125rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: .05em; }

.breakdown-bar {
  display: flex;
  height: 10px;
  border-radius: 99px;
  overflow: hidden;
  gap: 1px;
}
.breakdown-bar__segment { height: 100%; transition: width .4s ease; }
.breakdown-bar__segment--cp      { background: var(--color-primary-400); }
.breakdown-bar__segment--imposto { background: #f59e0b; }
.breakdown-bar__segment--df      { background: #60a5fa; }
.breakdown-bar__segment--desconto{ background: #a78bfa; }
.breakdown-bar__segment--lucro   { background: var(--color-primary-600); }

.breakdown-items { display: flex; flex-direction: column; gap: var(--space-2); }
.breakdown-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: .8125rem;
  color: var(--color-text-muted);
}
.breakdown-item span:nth-child(2) { flex: 1; }
.breakdown-item strong { color: var(--color-text); font-weight: 600; }
.breakdown-item__pct { color: var(--color-text-light); min-width: 42px; text-align: right; }
.breakdown-item--lucro strong { color: var(--color-primary-600); }

.breakdown-item__dot {
  width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
}
.breakdown-item__dot--cp       { background: var(--color-primary-400); }
.breakdown-item__dot--imposto  { background: #f59e0b; }
.breakdown-item__dot--df       { background: #60a5fa; }
.breakdown-item__dot--desconto { background: #a78bfa; }
.breakdown-item__dot--lucro    { background: var(--color-primary-600); }

/* Simulação */
.sim-form { display: flex; flex-direction: column; gap: var(--space-4); margin-bottom: var(--space-5); }
.field { display: flex; flex-direction: column; gap: var(--space-1); }
.sim-input {
  padding: var(--space-2) var(--space-3);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius);
  font-size: .9rem;
  color: var(--color-text);
  outline: none;
  background: var(--color-surface);
}
.sim-input:focus { border-color: var(--color-primary-400); box-shadow: 0 0 0 3px rgba(85,181,89,.15); }

.sim-resultado {
  background: var(--color-primary-900);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.sim-resultado__formula { display: flex; justify-content: space-between; font-size: .8125rem; color: var(--color-primary-300); }
.sim-formula-label { font-weight: 500; }
.sim-resultado__pv { display: flex; flex-direction: column; align-items: center; text-align: center; }
.sim-pv-label { font-size: .75rem; text-transform: uppercase; letter-spacing: .06em; color: var(--color-primary-300); }
.sim-pv-value { font-size: 2rem; font-weight: 800; color: var(--color-primary-300); }
.sim-resultado__info { font-size: .75rem; color: var(--color-primary-400); text-align: center; }
.sim-resultado__info strong { color: var(--color-primary-200); }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-12) var(--space-4);
  color: var(--color-text-light);
  font-size: 2rem;
}
.empty-state p { font-size: .9rem; }
</style>
