<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useEmpresaStore } from '@/stores/empresa'
import { useProdutosStore } from '@/stores/produtos'
import { useMateriaisStore } from '@/stores/materiais'
import { useDespesasStore } from '@/stores/despesas'
import { useMarkupCalculator, useCurrency, FATOR_R_LIMITE } from '@/composables/useMarkup'
import { segmentoConfig } from '@/config/segmentos'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import FatorRNote from '@/components/ui/FatorRNote.vue'

const empresaStore = useEmpresaStore()
const produtosStore = useProdutosStore()
const materiaisStore = useMateriaisStore()
const despesasStore = useDespesasStore()
const { } = useMarkupCalculator()
const { formatCurrency, formatPercent } = useCurrency()

// Alíquotas nominais de 1ª faixa — usadas para o comparativo didático
const ALIQ_ANEXO_III = 6.0
const ALIQ_ANEXO_V = 15.5

onMounted(() => Promise.all([
  empresaStore.fetchEmpresas(),
  produtosStore.fetchProdutos(),
  materiaisStore.fetchMateriais(),
  despesasStore.fetchDespesas(),
]))

const empresa = computed(() => empresaStore.empresa)
const seg = computed(() => segmentoConfig(empresa.value?.segmento))
const ehServico = computed(() => empresa.value?.segmento === 'SERVICOS')

// Folha simulada (permite ver o anexo "virar" ao vivo)
const folhaSimulada = ref(0)
watch(empresa, (e) => { folhaSimulada.value = e?.folhaPagamentoMensal ?? 0 }, { immediate: true })

const faturamento = computed(() => empresa.value?.faturamentoMedioMensal ?? 0)
const fatorRSim = computed(() => faturamento.value > 0 ? (folhaSimulada.value / faturamento.value) * 100 : 0)
const anexoSim = computed<'ANEXO_III' | 'ANEXO_V'>(() => fatorRSim.value >= FATOR_R_LIMITE ? 'ANEXO_III' : 'ANEXO_V')
const folhaParaVirar = computed(() => (FATOR_R_LIMITE / 100) * faturamento.value)

// Serviço representativo da empresa ativa
const servicoRef = computed(() => produtosStore.produtos.find(p => p.ativo) ?? produtosStore.produtos[0] ?? null)
// C1 vem do servidor, com a ficha ja resolvida — sem cruzar material por id
const custoRef = computed(() => servicoRef.value?.custoBase ?? 0)
const dfPct = computed(() => empresaStore.empresa?.percentualDespesasFixas ?? 0)

function pvComAnexo(aliqImposto: number) {
  if (!servicoRef.value) return 0
  const soma = aliqImposto + dfPct.value + servicoRef.value.margemLucro + servicoRef.value.descontoMaximo
  const divisor = 1 - soma / 100
  return divisor > 0 ? custoRef.value / divisor : 0
}

const pvIII = computed(() => pvComAnexo(ALIQ_ANEXO_III))
const pvV = computed(() => pvComAnexo(ALIQ_ANEXO_V))
const diferenca = computed(() => pvV.value - pvIII.value)
const diferencaPct = computed(() => pvIII.value > 0 ? (diferenca.value / pvIII.value) * 100 : 0)

// Tabela com todas as empresas de serviços
const empresasServico = computed(() =>
  empresaStore.empresas
    .filter(e => e.segmento === 'SERVICOS')
    .map(e => {
      const fr = e.faturamentoMedioMensal > 0 ? ((e.folhaPagamentoMensal ?? 0) / e.faturamentoMedioMensal) * 100 : 0
      return { ...e, fatorR: fr, anexo: fr >= FATOR_R_LIMITE ? 'ANEXO_III' : 'ANEXO_V' as const }
    })
)
</script>

<template>
  <div class="fator-r">
    <!-- Nota explicativa -->
    <FatorRNote />

    <!-- Aviso para não-serviços -->
    <div v-if="!ehServico" class="info-box">
      <h4>ℹ O Fator R aplica-se apenas a empresas de <strong>Serviços</strong></h4>
      <p>
        A empresa ativa ({{ seg.icone }} {{ seg.nome }}) vende mercadoria própria e é tributada por outro anexo.
        Selecione uma empresa de serviços no seletor do topo para simular, ou veja o comparativo entre as empresas de serviços abaixo.
      </p>
    </div>

    <!-- Simulador -->
    <div v-if="ehServico" class="sim-grid">
      <BaseCard title="Simulador de Fator R" subtitle="Ajuste a folha e veja o anexo mudar">
        <div class="sim">
          <div class="sim__field">
            <label>Faturamento médio mensal</label>
            <span class="sim__fixed">{{ formatCurrency(faturamento) }}</span>
          </div>
          <div class="sim__field">
            <label>Folha de pagamento mensal</label>
            <input type="range" :min="0" :max="faturamento" step="500" v-model.number="folhaSimulada" class="sim__range" />
            <input type="number" step="500" v-model.number="folhaSimulada" class="sim__input" />
          </div>

          <div class="gauge" :class="fatorRSim >= 28 ? 'gauge--ok' : 'gauge--warn'">
            <div class="gauge__value">{{ formatPercent(fatorRSim) }}</div>
            <div class="gauge__label">Fator R</div>
            <div class="gauge__bar">
              <div class="gauge__fill" :style="{ width: `${Math.min(fatorRSim, 60) / 60 * 100}%` }" />
              <div class="gauge__threshold" :style="{ left: `${28 / 60 * 100}%` }" title="Limite 28%" />
            </div>
          </div>

          <div class="sim__result">
            <BaseBadge :color="anexoSim === 'ANEXO_III' ? 'green' : 'orange'">
              {{ anexoSim.replace('_', ' ') }}
            </BaseBadge>
            <p v-if="anexoSim === 'ANEXO_III'" class="sim__hint sim__hint--ok">
              ✓ Fator R ≥ 28% — tributando na alíquota menor (6%).
            </p>
            <p v-else class="sim__hint sim__hint--warn">
              Folha precisa chegar a <strong>{{ formatCurrency(folhaParaVirar) }}</strong> (28%) para migrar ao Anexo III.
            </p>
          </div>
        </div>
      </BaseCard>

      <!-- Comparativo de preço -->
      <BaseCard :title="`Impacto no preço — ${servicoRef?.nome ?? 'serviço'}`" subtitle="Mesmo serviço, dois anexos">
        <div v-if="servicoRef" class="compare">
          <div class="compare__cols">
            <div class="compare__col compare__col--ok">
              <span class="compare__anexo">Anexo III (6%)</span>
              <span class="compare__price">{{ formatCurrency(pvIII) }}</span>
            </div>
            <div class="compare__col compare__col--warn">
              <span class="compare__anexo">Anexo V (15,5%)</span>
              <span class="compare__price">{{ formatCurrency(pvV) }}</span>
            </div>
          </div>
          <div class="compare__delta">
            No Anexo V, o preço sobe <strong>{{ formatCurrency(diferenca) }}</strong>
            (<strong>+{{ formatPercent(diferencaPct) }}</strong>) para manter a mesma margem.
          </div>
          <div class="compare__meta">
            Custo base {{ formatCurrency(custoRef) }} · DF {{ formatPercent(dfPct) }} ·
            ML {{ formatPercent(servicoRef.margemLucro) }} · Desc. {{ formatPercent(servicoRef.descontoMaximo) }}
          </div>
        </div>
        <p v-else class="empty">Nenhum serviço cadastrado nesta empresa.</p>
      </BaseCard>
    </div>

    <!-- Tabela de empresas de serviço -->
    <BaseCard title="Empresas de serviços" subtitle="Fator R e anexo de cada empresa">
      <table class="data-table">
        <thead>
          <tr>
            <th>Empresa</th>
            <th>Faturamento</th>
            <th>Folha</th>
            <th>Fator R</th>
            <th>Anexo</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in empresasServico" :key="e.id" :class="{ 'row--active': e.id === empresaStore.empresaAtivaId }">
            <td class="data-table__name">🛠️ {{ e.razaoSocial }}</td>
            <td>{{ formatCurrency(e.faturamentoMedioMensal) }}</td>
            <td>{{ formatCurrency(e.folhaPagamentoMensal ?? 0) }}</td>
            <td :class="e.fatorR >= 28 ? 'text-ok' : 'text-warn'">{{ formatPercent(e.fatorR) }}</td>
            <td>
              <BaseBadge :color="e.anexo === 'ANEXO_III' ? 'green' : 'orange'">{{ e.anexo.replace('_', ' ') }}</BaseBadge>
            </td>
          </tr>
        </tbody>
      </table>
    </BaseCard>
  </div>
</template>

<style scoped>
.fator-r { display: flex; flex-direction: column; gap: var(--space-6); }

.info-box {
  background: var(--color-bg-subtle); border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg); padding: var(--space-4) var(--space-5);
}
.info-box h4 { font-size: .95rem; margin-bottom: var(--space-2); color: var(--color-text); }
.info-box p { font-size: .875rem; color: var(--color-text-muted); }

.sim-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); }
@media (max-width: 1000px) { .sim-grid { grid-template-columns: 1fr; } }

.sim { display: flex; flex-direction: column; gap: var(--space-4); }
.sim__field { display: flex; flex-direction: column; gap: var(--space-2); }
.sim__field label { font-size: .8125rem; font-weight: 600; color: var(--color-text-muted); }
.sim__fixed { font-size: 1.15rem; font-weight: 700; color: var(--color-text); }
.sim__range { width: 100%; accent-color: var(--seg-accent, var(--color-primary-500)); }
.sim__input {
  padding: var(--space-2) var(--space-3); border: 1.5px solid var(--color-border);
  border-radius: var(--radius); font-size: .9rem; width: 160px;
}

.gauge { padding: var(--space-4); border-radius: var(--radius-lg); text-align: center; }
.gauge--ok { background: #ecfdf5; }
.gauge--warn { background: #fffbeb; }
.gauge__value { font-size: 2rem; font-weight: 800; }
.gauge--ok .gauge__value { color: #059669; }
.gauge--warn .gauge__value { color: #d97706; }
.gauge__label { font-size: .75rem; text-transform: uppercase; letter-spacing: .06em; color: var(--color-text-muted); }
.gauge__bar { position: relative; height: 8px; background: var(--color-border-light); border-radius: 99px; margin-top: var(--space-3); overflow: visible; }
.gauge__fill { height: 100%; border-radius: 99px; background: currentColor; }
.gauge--ok .gauge__fill { background: #059669; }
.gauge--warn .gauge__fill { background: #d97706; }
.gauge__threshold { position: absolute; top: -3px; width: 2px; height: 14px; background: var(--color-text); }

.sim__result { display: flex; flex-direction: column; gap: var(--space-2); align-items: flex-start; }
.sim__hint { font-size: .8125rem; }
.sim__hint--ok { color: #059669; }
.sim__hint--warn { color: #92400e; }

.compare { display: flex; flex-direction: column; gap: var(--space-4); }
.compare__cols { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
.compare__col { padding: var(--space-4); border-radius: var(--radius-lg); display: flex; flex-direction: column; gap: var(--space-1); }
.compare__col--ok { background: #ecfdf5; border: 1px solid #a7f3d0; }
.compare__col--warn { background: #fffbeb; border: 1px solid #fde68a; }
.compare__anexo { font-size: .75rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: var(--color-text-muted); }
.compare__price { font-size: 1.5rem; font-weight: 800; color: var(--color-text); }
.compare__delta { padding: var(--space-3); background: var(--color-bg-subtle); border-radius: var(--radius); font-size: .9rem; color: var(--color-text); }
.compare__meta { font-size: .75rem; color: var(--color-text-light); }
.empty { font-size: .875rem; color: var(--color-text-muted); }

.data-table { width: 100%; border-collapse: collapse; font-size: .875rem; }
.data-table th {
  text-align: left; padding: var(--space-2) var(--space-3); font-size: .72rem;
  font-weight: 600; text-transform: uppercase; letter-spacing: .05em;
  color: var(--color-text-muted); border-bottom: 1px solid var(--color-border-light);
}
.data-table td { padding: var(--space-3); border-bottom: 1px solid var(--color-border-light); color: var(--color-text); }
.data-table__name { font-weight: 500; }
.row--active td { background: var(--color-bg-subtle); }
.text-ok { color: #059669; font-weight: 600; }
.text-warn { color: #d97706; font-weight: 600; }
</style>
