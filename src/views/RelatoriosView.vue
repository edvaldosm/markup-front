<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useProdutosStore } from '@/stores/produtos'
import { useMateriaisStore } from '@/stores/materiais'
import { useEmpresaStore } from '@/stores/empresa'
import { useDespesasStore } from '@/stores/despesas'
import { useMarkupCalculator, useCurrency } from '@/composables/useMarkup'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'

const produtosStore = useProdutosStore()
const materiaisStore = useMateriaisStore()
const empresaStore = useEmpresaStore()
const despesasStore = useDespesasStore()
const { calcularPrecificacao, calcularPercentualDF } = useMarkupCalculator()
const { formatCurrency, formatPercent } = useCurrency()

onMounted(() => Promise.all([
  produtosStore.fetchProdutos(),
  materiaisStore.fetchMateriais(),
  empresaStore.fetchEmpresa(),
  despesasStore.fetchDespesas(),
]))

const relatorioAtivo = ref<'precificacao' | 'despesas' | 'materiais'>('precificacao')

const produtosComResultado = computed(() => {
  if (!empresaStore.empresa) return []
  return produtosStore.produtos.map(p => ({
    ...p,
    resultado: calcularPrecificacao(p, empresaStore.empresa!, despesasStore.despesas, materiaisStore.materiais)
  }))
})

const percentualDF = computed(() =>
  calcularPercentualDF(despesasStore.despesas, empresaStore.empresa?.faturamentoMedioMensal ?? 1)
)

const totalDespesas = computed(() => despesasStore.totalMensal)

const custoTotalMateriais = computed(() =>
  materiaisStore.materiais.reduce((acc, m) => acc + m.custoUnitario, 0)
)

const gerandoPDF = ref(false)
function gerarPDF() {
  gerandoPDF.value = true
  setTimeout(() => {
    gerandoPDF.value = false
    alert('Em produção: relatório PDF gerado via JasperReports/iText no backend.')
  }, 1200)
}
</script>

<template>
  <div class="relatorios">
    <!-- Seletor de relatório -->
    <div class="relatorio-tabs">
      <button
        v-for="tab in [
          { key: 'precificacao', label: 'Precificação Completa' },
          { key: 'despesas', label: 'Despesas Fixas' },
          { key: 'materiais', label: 'Custo de Materiais' },
        ]"
        :key="tab.key"
        class="tab-btn"
        :class="{ 'tab-btn--active': relatorioAtivo === tab.key }"
        @click="relatorioAtivo = tab.key as any"
      >
        {{ tab.label }}
      </button>
      <div style="flex:1" />
      <BaseButton variant="secondary" size="sm" :loading="gerandoPDF" @click="gerarPDF">
        📄 Exportar PDF
      </BaseButton>
    </div>

    <!-- Relatório: Precificação -->
    <div v-if="relatorioAtivo === 'precificacao'">
      <BaseCard title="Relatório de Precificação" :subtitle="`Empresa: ${empresaStore.empresa?.razaoSocial ?? '...'} · Gerado em ${new Date().toLocaleDateString('pt-BR')}`">
        <div class="report-meta">
          <div class="report-meta__item">
            <span>Faturamento Médio Mensal</span>
            <strong>{{ formatCurrency(empresaStore.empresa?.faturamentoMedioMensal ?? 0) }}</strong>
          </div>
          <div class="report-meta__item">
            <span>% Despesas Fixas (rateio)</span>
            <strong>{{ formatPercent(percentualDF) }}</strong>
          </div>
          <div class="report-meta__item">
            <span>Regime Tributário</span>
            <strong>{{ empresaStore.empresa?.regimeTributario ?? '—' }}</strong>
          </div>
        </div>

        <table class="report-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Custo Base</th>
              <th>Impostos</th>
              <th>DF%</th>
              <th>ML%</th>
              <th>Desconto</th>
              <th>Divisor</th>
              <th>Preço de Venda</th>
              <th>Lucro Líquido</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in produtosComResultado" :key="item.id">
              <td class="report-table__name">{{ item.nome }}</td>
              <td>{{ formatCurrency(item.resultado.custoBase) }}</td>
              <td>{{ formatPercent(item.resultado.percentualImpostos) }}</td>
              <td>{{ formatPercent(item.resultado.percentualDespesasFixas) }}</td>
              <td>{{ formatPercent(item.resultado.percentualMargemLucro) }}</td>
              <td>{{ formatPercent(item.resultado.percentualDesconto) }}</td>
              <td class="report-table__mono">{{ item.resultado.divisorMarkup.toFixed(4) }}</td>
              <td class="report-table__price">{{ formatCurrency(item.resultado.precoVenda) }}</td>
              <td class="report-table__lucro">{{ formatCurrency(item.resultado.breakdown.lucroLiquido) }}</td>
            </tr>
          </tbody>
        </table>
      </BaseCard>
    </div>

    <!-- Relatório: Despesas -->
    <div v-else-if="relatorioAtivo === 'despesas'">
      <BaseCard title="Relatório de Despesas Fixas" :subtitle="`Mês de referência: ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`">
        <div class="report-meta">
          <div class="report-meta__item">
            <span>Total Mensal</span>
            <strong>{{ formatCurrency(totalDespesas) }}</strong>
          </div>
          <div class="report-meta__item">
            <span>% do Faturamento</span>
            <strong>{{ formatPercent(percentualDF) }}</strong>
          </div>
          <div class="report-meta__item">
            <span>Faturamento Médio</span>
            <strong>{{ formatCurrency(empresaStore.empresa?.faturamentoMedioMensal ?? 0) }}</strong>
          </div>
        </div>

        <table class="report-table">
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Valor Mensal</th>
              <th>% do Faturamento</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in despesasStore.despesas" :key="d.id">
              <td class="report-table__name">{{ d.descricao }}</td>
              <td><BaseBadge color="blue">{{ d.categoria }}</BaseBadge></td>
              <td>{{ formatCurrency(d.valorMensal) }}</td>
              <td>{{ formatPercent(d.valorMensal / (empresaStore.empresa?.faturamentoMedioMensal ?? 1) * 100) }}</td>
              <td><BaseBadge :color="d.ativa ? 'green' : 'gray'">{{ d.ativa ? 'Ativa' : 'Inativa' }}</BaseBadge></td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="report-tfoot">
              <td colspan="2">Total</td>
              <td>{{ formatCurrency(totalDespesas) }}</td>
              <td>{{ formatPercent(percentualDF) }}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </BaseCard>
    </div>

    <!-- Relatório: Materiais -->
    <div v-else>
      <BaseCard title="Relatório de Materiais e Insumos">
        <table class="report-table">
          <thead>
            <tr>
              <th>Material</th>
              <th>Unidade</th>
              <th>Custo Unitário</th>
              <th>Fornecedor</th>
              <th>Estoque</th>
              <th>Alerta</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in materiaisStore.materiais" :key="m.id">
              <td class="report-table__name">{{ m.nome }}</td>
              <td><BaseBadge color="gray">{{ m.unidade }}</BaseBadge></td>
              <td>{{ formatCurrency(m.custoUnitario) }}</td>
              <td class="report-table__muted">{{ m.fornecedor ?? '—' }}</td>
              <td>{{ m.estoque ?? '—' }}</td>
              <td>
                <BaseBadge v-if="(m.estoque ?? 99) <= 5" color="orange">Baixo</BaseBadge>
                <BaseBadge v-else color="green">OK</BaseBadge>
              </td>
            </tr>
          </tbody>
        </table>
      </BaseCard>
    </div>
  </div>
</template>

<style scoped>
.relatorios { display: flex; flex-direction: column; gap: var(--space-5); }

.relatorio-tabs { display: flex; gap: var(--space-2); align-items: center; flex-wrap: wrap; }
.tab-btn {
  padding: var(--space-2) var(--space-4);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  font-size: .875rem;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all .15s;
}
.tab-btn:hover { border-color: var(--color-primary-300); color: var(--color-primary-700); }
.tab-btn--active { background: var(--color-primary-600); border-color: var(--color-primary-600); color: #fff; }

.report-meta {
  display: flex;
  gap: var(--space-6);
  padding: var(--space-4);
  background: var(--color-primary-50);
  border: 1px solid var(--color-primary-100);
  border-radius: var(--radius);
  margin-bottom: var(--space-5);
  flex-wrap: wrap;
}
.report-meta__item { display: flex; flex-direction: column; gap: 2px; }
.report-meta__item span { font-size: .75rem; color: var(--color-text-muted); font-weight: 500; text-transform: uppercase; letter-spacing: .05em; }
.report-meta__item strong { font-size: 1.0625rem; font-weight: 700; color: var(--color-primary-800); }

.report-table { width: 100%; border-collapse: collapse; font-size: .8125rem; }
.report-table th { text-align: left; padding: var(--space-2) var(--space-3); font-size: .7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: var(--color-text-muted); border-bottom: 1px solid var(--color-border-light); white-space: nowrap; }
.report-table td { padding: var(--space-3); border-bottom: 1px solid var(--color-border-light); }
.report-table tr:last-child td { border-bottom: none; }
.report-table__name { font-weight: 500; color: var(--color-text); }
.report-table__price { font-weight: 700; color: var(--color-primary-600); }
.report-table__lucro { font-weight: 700; color: var(--color-success); }
.report-table__mono { font-family: monospace; font-size: .75rem; }
.report-table__muted { color: var(--color-text-muted); }

.report-tfoot td { font-weight: 700; background: var(--color-primary-50); color: var(--color-primary-800); padding: var(--space-3); }
</style>
