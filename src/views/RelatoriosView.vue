<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useProdutosStore } from '@/stores/produtos'
import { useMateriaisStore } from '@/stores/materiais'
import { useEmpresaStore } from '@/stores/empresa'
import { useDespesasStore } from '@/stores/despesas'
import { usePrecificacaoStore } from '@/stores/precificacao'
import { useCurrency } from '@/composables/useCurrency'
import { useRelatorio } from '@/composables/useRelatorio'
import type { TipoRelatorio } from '@/graphql/relatorios'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import RelatorioPdfModal from '@/components/ui/RelatorioPdfModal.vue'
import PrecificacaoChart from '@/components/ui/PrecificacaoChart.vue'

const produtosStore = useProdutosStore()
const materiaisStore = useMateriaisStore()
const empresaStore = useEmpresaStore()
const despesasStore = useDespesasStore()
const precificacaoStore = usePrecificacaoStore()
const { formatCurrency, formatPercent } = useCurrency()

onMounted(() => Promise.all([
  produtosStore.fetchProdutos(),
  materiaisStore.fetchMateriais(),
  empresaStore.fetchEmpresa(),
  despesasStore.fetchDespesas(),
  precificacaoStore.buscarTodos(),
]))

const relatorioAtivo = ref<'precificacao' | 'despesas' | 'materiais'>('precificacao')

/** Cada aba da tela é um tipo do catálogo fechado do backend (REQ-10). */
const TIPO_POR_ABA: Record<typeof relatorioAtivo.value, TipoRelatorio> = {
  precificacao: 'LISTA_PRECIFICACAO',
  despesas: 'DESPESAS_FIXAS',
  materiais: 'CUSTO_MATERIAIS',
}

const percentualDF = computed(() =>
  empresaStore.empresa?.percentualDespesasFixas ?? 0
)

/** Soma dos custos unitários já listados na tabela abaixo — nenhuma conta nova. */
const custoTotalMateriais = computed(() =>
  materiaisStore.materiais.reduce((soma, m) => soma + m.custoUnitario, 0)
)

/** Dado do gráfico: mesmas linhas da tabela de precificação, sem cálculo novo. */
const dadosGrafico = computed(() =>
  precificacaoStore.todos.map(item => ({
    nome: item.produto.nome,
    custoBase: item.custoBase,
    lucroLiquido: item.breakdown.lucroLiquido,
    precoVenda: item.precoVenda,
  })),
)

/** Totais da tabela — soma das linhas já exibidas, igual ao rodapé do PDF. */
const totalCustoBase = computed(() => precificacaoStore.todos.reduce((s, i) => s + i.custoBase, 0))
const totalPrecoVenda = computed(() => precificacaoStore.todos.reduce((s, i) => s + i.precoVenda, 0))
const totalLucroLiquido = computed(() => precificacaoStore.todos.reduce((s, i) => s + i.breakdown.lucroLiquido, 0))

/**
 * Documento gerado pelo módulo de relatórios do backend (JasperReports,
 * Artigo B12); o front só pede, pré-visualiza e baixa ([[FR11-relatorio-vem-do-backend]]).
 */
const { carregando, erro, pdfAberto, visualizarPdf, fecharPdf, baixarPdfAberto, baixar } = useRelatorio()

function parametroRelatorio(): Record<string, string> {
  const empresaId = empresaStore.empresa?.id
  return empresaId ? { empresaId } : {}
}

const visualizarRelatorio = () => visualizarPdf(TIPO_POR_ABA[relatorioAtivo.value], parametroRelatorio())
const baixarXlsx = () => baixar(TIPO_POR_ABA[relatorioAtivo.value], 'XLSX', parametroRelatorio())
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
      <BaseButton variant="secondary" size="sm" :loading="carregando" @click="visualizarRelatorio">
        📄 Visualizar PDF
      </BaseButton>
      <BaseButton variant="ghost" size="sm" :loading="carregando" @click="baixarXlsx">
        📊 Baixar XLSX
      </BaseButton>
    </div>

    <p v-if="erro" class="erro-relatorio">{{ erro }}</p>

    <RelatorioPdfModal
      v-if="pdfAberto"
      :url="pdfAberto.url"
      :nome-arquivo="pdfAberto.nomeArquivo"
      @close="fecharPdf"
      @baixar="baixarPdfAberto"
    />

    <!-- Relatório: Precificação -->
    <div v-if="relatorioAtivo === 'precificacao'" class="relatorio-precificacao">
      <BaseCard title="Relatório de Precificação" :subtitle="`Empresa: ${empresaStore.empresa?.razaoSocial ?? '...'} · Gerado em ${new Date().toLocaleDateString('pt-BR')}`">
        <div class="report-meta">
          <div class="report-meta__item">
            <span>Faturamento Médio Mensal</span>
            <strong>{{ formatCurrency(empresaStore.empresa?.faturamentoMedioMensal ?? 0) }}</strong>
          </div>
          <div class="report-meta__item">
            <span>Despesas Fixas (rateio)</span>
            <strong>{{ formatCurrency(despesasStore.totalMensal) }}</strong>
            <span class="report-meta__pct">{{ formatPercent(percentualDF) }} do faturamento</span>
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
            <tr v-for="item in precificacaoStore.todos" :key="item.produto.id">
              <td class="report-table__name">{{ item.produto.nome }}</td>
              <td>{{ formatCurrency(item.custoBase) }}</td>
              <td>{{ formatPercent(item.percentualImpostos) }}</td>
              <td>{{ formatPercent(item.percentualDespesasFixas) }}</td>
              <td>{{ formatPercent(item.percentualMargemLucro) }}</td>
              <td>{{ formatPercent(item.percentualDesconto) }}</td>
              <td class="report-table__mono">{{ item.divisorMarkup.toFixed(4) }}</td>
              <td class="report-table__price">{{ formatCurrency(item.precoVenda) }}</td>
              <td class="report-table__lucro">{{ formatCurrency(item.breakdown.lucroLiquido) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="report-tfoot">
              <td>Total ({{ precificacaoStore.todos.length }} produtos)</td>
              <td>{{ formatCurrency(totalCustoBase) }}</td>
              <td colspan="4"></td>
              <td></td>
              <td class="report-table__price">{{ formatCurrency(totalPrecoVenda) }}</td>
              <td class="report-table__lucro">{{ formatCurrency(totalLucroLiquido) }}</td>
            </tr>
          </tfoot>
        </table>

        <p class="report-note">
          * Rateio mensal soma apenas despesas <strong>ATIVAS</strong> (guarda de cálculo R11). Despesas inativas
          continuam listadas no relatório "Despesas Fixas" para histórico, mas não entram neste total — por isso a
          soma das linhas ali pode superar o valor de rateio mostrado aqui.
        </p>
      </BaseCard>

      <BaseCard
        v-if="dadosGrafico.length"
        title="Visão estratégica"
        subtitle="Custo base, Lucro Líquido e Preço de venda por produto"
      >
        <PrecificacaoChart :itens="dadosGrafico" />
      </BaseCard>
    </div>

    <!-- Relatório: Despesas -->
    <div v-else-if="relatorioAtivo === 'despesas'">
      <BaseCard title="Relatório de Despesas Fixas" :subtitle="`Mês de referência: ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`">
        <div class="report-meta">
          <div class="report-meta__item">
            <span>Total Mensal</span>
            <strong>{{ formatCurrency(despesasStore.totalMensal) }}</strong>
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
              <td>{{ formatCurrency(despesasStore.totalMensal) }}</td>
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
        <p class="custo-total-aviso">
          Custo total dos materiais: <strong>{{ formatCurrency(custoTotalMateriais) }}</strong>
        </p>
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

.erro-relatorio { color: var(--color-danger); font-size: .875rem; margin: 0; }

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
.report-meta__item span.report-meta__pct { text-transform: none; letter-spacing: normal; font-size: .7rem; font-weight: 400; }

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

.report-note { font-size: .75rem; color: var(--color-text-light); margin-top: var(--space-4); line-height: 1.6; }

.custo-total-aviso { display: flex; align-items: center; gap: var(--space-2); font-size: .875rem; color: var(--color-text-muted); margin-bottom: var(--space-4); }

.relatorio-precificacao { display: flex; flex-direction: column; gap: var(--space-5); }
</style>
