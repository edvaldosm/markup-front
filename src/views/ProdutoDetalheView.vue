<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProdutosStore } from '@/stores/produtos'
import { useMateriaisStore } from '@/stores/materiais'
import { useEmpresaStore } from '@/stores/empresa'
import { useDespesasStore } from '@/stores/despesas'
import { useImpostosStore } from '@/stores/impostos'
import { usePrecificacaoStore } from '@/stores/precificacao'
import { useCurrency } from '@/composables/useCurrency'
import { useRelatorio } from '@/composables/useRelatorio'
import { segmentoConfig } from '@/config/segmentos'
import { apolloClient } from '@/graphql/client'
import { HISTORICO_DO_PRODUTO, REATIVAR_VERSAO_PRODUTO } from '@/graphql/operations/catalogo'
import { mensagemDeErro } from '@/graphql/erros'
import type { VersaoProduto } from '@/types'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import ProdutoFormModal from '@/components/ui/ProdutoFormModal.vue'
import FaixaNegociacaoCard from '@/components/ui/FaixaNegociacaoCard.vue'
import RelatorioPdfModal from '@/components/ui/RelatorioPdfModal.vue'

const route = useRoute()
const router = useRouter()
const produtosStore = useProdutosStore()
const materiaisStore = useMateriaisStore()
const empresaStore = useEmpresaStore()
const despesasStore = useDespesasStore()
const impostosStore = useImpostosStore()
const precificacaoStore = usePrecificacaoStore()
const { formatCurrency, formatPercent } = useCurrency()
const seg = computed(() => segmentoConfig(empresaStore.empresa?.segmento))

const id = route.params.id as string

onMounted(async () => {
  await Promise.all([
    produtosStore.fetchProdutos(),
    materiaisStore.fetchMateriais(),
    empresaStore.fetchEmpresa(),
    despesasStore.fetchDespesas(),
    impostosStore.fetchImpostos(),
    precificacaoStore.buscarProduto(id),
  ])
})

const produto = computed(() => produtosStore.getProduto(id))

/** Preço, breakdown e faixa de negociação — inteiramente do backend (C1–C12). */
const resultado = computed(() => precificacaoStore.resultadoDe(id))

/** Do preço de tabela ao piso do desconto máximo — já vem dentro do resultado */
const faixa = computed(() => resultado.value?.faixaNegociacao ?? null)

/**
 * O documento é gerado pelo **módulo de relatórios do backend** (JasperReports,
 * Artigo B12); o front só pede, pré-visualiza e baixa ([[FR11-relatorio-vem-do-backend]]).
 * PDF abre em modal antes de baixar; XLSX vai direto para "Salvar Como".
 */
const { carregando: gerandoPdf, erro: erroPdf, pdfAberto, visualizarPdf, fecharPdf, baixarPdfAberto, baixar } = useRelatorio()

function visualizarFichaPdf() {
  if (!produto.value) return
  visualizarPdf('FICHA_TECNICA_PRODUTO', { produtoId: produto.value.id })
}

function baixarFichaXlsx() {
  if (!produto.value) return
  baixar('FICHA_TECNICA_PRODUTO', 'XLSX', { produtoId: produto.value.id })
}

const emitidoEm = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short', timeStyle: 'short',
}).format(new Date())

/**
 * A ficha vem **resolvida** do servidor: o material inteiro está em cada item.
 * Antes esta tela cruzava `materialId` contra a lista em memória e caía em '—'
 * quando não achava — exibindo custo zero para um insumo que existe.
 */
const fichaItens = computed(() => {
  if (!produto.value) return []
  return produto.value.ficha.map(item => ({
    materialId: item.material.id,
    quantidadeUtilizada: item.quantidadeUtilizada,
    unidade: item.unidade,
    nome: item.material.nome,
    custoUnitario: item.material.custoUnitario,
    custoTotal: item.material.custoUnitario * item.quantidadeUtilizada,
  }))
})

/** Impostos já vêm com nome e alíquota do cadastro (C3). */
const impostosDosProduto = computed(() => produto.value?.impostos ?? [])

const showEditModal = ref(false)

const editandoMargem = ref(false)
const margemEdit = ref(0)

function iniciarEdicaoMargem() {
  margemEdit.value = produto.value?.margemLucro ?? 30
  editandoMargem.value = true
}

async function salvarMargem() {
  if (!produto.value) return
  // Mutation propria: reenviar o produto inteiro para mudar um numero deixaria
  // a ficha em memoria sobrescrever a que esta no servidor.
  const salvo = await produtosStore.ajustarMargem(produto.value.id, margemEdit.value)
  if (salvo) {
    editandoMargem.value = false
    // A margem muda o preço: busca de novo em vez de deixar o preço velho na tela.
    await precificacaoStore.buscarProduto(id)
    await buscarHistorico()   // o ajuste abriu versão nova (REQ-01) — recarrega a lista
  }
}

// ── Histórico de margem/desconto (spec versionamento-margem-produto) ───────

const historico = ref<VersaoProduto[]>([])
const carregandoHistorico = ref(false)
const erroHistorico = ref<string | null>(null)
const reativandoVersaoId = ref<string | null>(null)

const formatarData = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

async function buscarHistorico(): Promise<void> {
  carregandoHistorico.value = true
  erroHistorico.value = null
  try {
    const { data } = await apolloClient.query({
      query: HISTORICO_DO_PRODUTO,
      variables: { produtoId: id },
      fetchPolicy: 'network-only',
    })
    historico.value = data.historicoDoProduto
  } catch (e) {
    erroHistorico.value = mensagemDeErro(e, 'historicoDoProduto')
  } finally {
    carregandoHistorico.value = false
  }
}

async function reativar(versaoId: string): Promise<void> {
  reativandoVersaoId.value = versaoId
  try {
    await apolloClient.mutate({ mutation: REATIVAR_VERSAO_PRODUTO, variables: { versaoId } })
    // Reativar não volta no tempo: fecha a vigente e abre uma versão nova —
    // recarrega produto, preço e histórico pra refletir o estado real.
    await Promise.all([
      produtosStore.fetchProdutos(),
      precificacaoStore.buscarProduto(id),
      buscarHistorico(),
    ])
  } catch (e) {
    erroHistorico.value = mensagemDeErro(e, 'reativarVersaoProduto')
  } finally {
    reativandoVersaoId.value = null
  }
}

buscarHistorico()
</script>

<template>
  <div v-if="produto" class="detalhe">
    <!-- Cabeçalho que só aparece no PDF/impressão -->
    <div class="print-only folha-cabecalho">
      <div>
        <span class="folha-cabecalho__empresa">{{ empresaStore.empresa?.razaoSocial }}</span>
        <span class="folha-cabecalho__cnpj">CNPJ {{ empresaStore.empresa?.cnpj }}</span>
      </div>
      <div class="folha-cabecalho__meta">
        <span>{{ seg.rotulos.fichaTecnica }} e Precificação</span>
        <span>Emitido em {{ emitidoEm }}</span>
      </div>
    </div>

    <!-- Header -->
    <div class="detalhe__header">
      <div>
        <button class="back-btn no-print" @click="router.push('/produtos')">← Produtos</button>
        <h1 class="detalhe__nome">{{ produto.nome }}</h1>
        <p v-if="produto.descricao" class="detalhe__desc">{{ produto.descricao }}</p>
      </div>
      <div class="detalhe__actions">
        <BaseBadge :color="produto.ativo ? 'green' : 'gray'">{{ produto.ativo ? 'Ativo' : 'Inativo' }}</BaseBadge>
        <BaseButton class="no-print" variant="ghost" :loading="gerandoPdf" @click="visualizarFichaPdf">Visualizar PDF</BaseButton>
        <BaseButton class="no-print" variant="ghost" :loading="gerandoPdf" @click="baixarFichaXlsx">Baixar XLSX</BaseButton>
        <BaseButton class="no-print" variant="secondary" @click="showEditModal = true">Editar {{ seg.rotulos.produto }}</BaseButton>
      </div>
    </div>

    <p v-if="erroPdf" class="erro-pdf no-print">{{ erroPdf }}</p>
    <p v-if="precificacaoStore.erroProduto" class="erro-pdf no-print">{{ precificacaoStore.erroProduto }}</p>

    <RelatorioPdfModal
      v-if="pdfAberto"
      class="no-print"
      :url="pdfAberto.url"
      :nome-arquivo="pdfAberto.nomeArquivo"
      @close="fecharPdf"
      @baixar="baixarPdfAberto"
    />

    <div class="detalhe__grid">
      <!-- Ficha Técnica -->
      <div class="detalhe__left">
        <BaseCard :title="seg.rotulos.fichaTecnica" :subtitle="`${fichaItens.length} ${seg.rotulos.materialPlural.toLowerCase()}`">
          <table class="ft-table">
            <thead>
              <tr>
                <th>Material</th>
                <th>Qtd. Utilizada</th>
                <th>Un.</th>
                <th>Custo Unit.</th>
                <th>Custo Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in fichaItens" :key="item.materialId">
                <td class="ft-name">{{ item.nome }}</td>
                <td>{{ item.quantidadeUtilizada }}</td>
                <td><BaseBadge color="gray">{{ item.unidade }}</BaseBadge></td>
                <td>{{ formatCurrency(item.custoUnitario) }}</td>
                <td class="ft-cost">{{ formatCurrency(item.custoTotal) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="ft-total">
                <td colspan="4">Custo Base Total (CP)</td>
                <td>{{ formatCurrency(resultado?.custoBase ?? 0) }}</td>
              </tr>
            </tfoot>
          </table>
        </BaseCard>

        <!-- Impostos vinculados -->
        <BaseCard title="Impostos Vinculados" subtitle="Tributação aplicada a este produto" style="margin-top: var(--space-5)">
          <div class="imp-list">
            <div v-for="imp in impostosDosProduto" :key="imp.id" class="imp-item">
              <span class="imp-item__nome">{{ imp.nome }}</span>
              <span class="imp-item__aliquota">{{ formatPercent(imp.aliquotaPercentual) }}</span>
            </div>
            <div v-if="!impostosDosProduto.length" class="imp-empty">Nenhum imposto vinculado</div>
          </div>
        </BaseCard>

        <!-- Faixa de negociação: do preço de tabela ao piso do desconto máximo -->
        <FaixaNegociacaoCard v-if="faixa" :faixa="faixa" class="faixa-card" />
      </div>

      <!-- Precificação -->
      <div class="detalhe__right">
        <BaseCard title="Parâmetros de Precificação">
          <div class="params">
            <div class="param-item">
              <span class="param-item__label">Margem de Lucro (ML)</span>
              <div v-if="!editandoMargem" class="param-item__valor-row">
                <span class="param-item__valor param-item__valor--green">{{ formatPercent(produto.margemLucro) }}</span>
                <button class="param-item__edit no-print" @click="iniciarEdicaoMargem">Editar</button>
              </div>
              <div v-else class="param-item__edit-row">
                <input v-model.number="margemEdit" type="number" step="0.5" class="param-input" />
                <BaseButton size="sm" :loading="produtosStore.loading" @click="salvarMargem">Salvar</BaseButton>
                <BaseButton size="sm" variant="ghost" @click="editandoMargem = false">×</BaseButton>
              </div>
            </div>
            <div class="param-item">
              <span class="param-item__label">Desconto (mín. → máx.)</span>
              <span class="param-item__valor">
                {{ formatPercent(0) }} <span class="param-item__ate">até</span> {{ formatPercent(produto.descontoMaximo) }}
              </span>
              <span v-if="faixa" class="param-item__hint">
                piso de {{ formatCurrency(faixa.precoMinimo) }} — abaixo disso sai do lucro
              </span>
            </div>
            <div class="param-item">
              <span class="param-item__label">Impostos (total)</span>
              <span class="param-item__valor">{{ formatPercent(resultado?.percentualImpostos ?? 0) }}</span>
            </div>
            <div class="param-item">
              <span class="param-item__label">Despesas Fixas (rateio)</span>
              <span class="param-item__valor">{{ formatPercent(resultado?.percentualDespesasFixas ?? 0) }}</span>
            </div>
          </div>
        </BaseCard>

        <BaseCard title="Histórico de Margem" subtitle="Cada ajuste vira uma versão — nada se apaga">
          <p v-if="erroHistorico" class="hist-erro">{{ erroHistorico }}</p>
          <p v-else-if="carregandoHistorico && !historico.length" class="hist-vazio">Carregando…</p>
          <p v-else-if="!historico.length" class="hist-vazio">Nenhuma versão registrada ainda.</p>

          <ul v-else class="hist-lista">
            <li v-for="v in historico" :key="v.id" class="hist-item" :class="{ 'hist-item--vigente': !v.dataFim }">
              <div class="hist-item__valores">
                <span>ML {{ formatPercent(v.margemLucro) }}</span>
                <span>·</span>
                <span>Desc. {{ formatPercent(v.descontoMaximo) }}</span>
                <BaseBadge v-if="!v.dataFim" color="green">vigente</BaseBadge>
              </div>
              <div class="hist-item__periodo">
                {{ formatarData.format(new Date(v.dataInicio)) }}
                <template v-if="v.dataFim"> → {{ formatarData.format(new Date(v.dataFim)) }}</template>
                <template v-else> → hoje</template>
              </div>
              <BaseButton
                v-if="v.dataFim"
                size="sm" variant="ghost"
                :loading="reativandoVersaoId === v.id"
                @click="reativar(v.id)"
              >Reativar</BaseButton>
            </li>
          </ul>
        </BaseCard>

        <div v-if="resultado" class="preco-box">
          <div class="preco-box__formula">
            PV = <strong>{{ formatCurrency(resultado.custoBase) }}</strong> / <strong>{{ resultado.divisorMarkup.toFixed(4) }}</strong>
          </div>
          <div class="preco-box__pv">
            <span class="preco-box__label">Preço de Venda</span>
            <span class="preco-box__value">{{ formatCurrency(resultado.precoVenda) }}</span>
          </div>
          <div class="preco-box__breakdown">
            <div class="pb-row"><span>Custo recuperado</span><strong>{{ formatCurrency(resultado.breakdown.custoRecuperado) }}</strong></div>
            <div class="pb-row"><span>Impostos</span><strong>{{ formatCurrency(resultado.breakdown.valorImpostos) }}</strong></div>
            <div class="pb-row"><span>Despesas Fixas</span><strong>{{ formatCurrency(resultado.breakdown.valorDespesasFixas) }}</strong></div>
            <div class="pb-row"><span>Desconto reservado</span><strong>{{ formatCurrency(resultado.breakdown.valorDesconto) }}</strong></div>
            <div class="pb-row pb-row--lucro"><span>Lucro Líquido</span><strong>{{ formatCurrency(resultado.breakdown.lucroLiquido) }}</strong></div>
          </div>
        </div>
      </div>
    </div>

    <ProdutoFormModal
      v-if="showEditModal"
      :produto="produto"
      @close="showEditModal = false"
      @saved="showEditModal = false"
    />
  </div>

  <div v-else class="loading-page">
    <div class="spinner" />
    <p>Carregando produto…</p>
  </div>
</template>

<style scoped>
.detalhe { display: flex; flex-direction: column; gap: var(--space-6); }

.hist-erro { color: var(--color-danger, #dc2626); font-size: .8125rem; }
.hist-vazio { color: var(--color-text-muted); font-size: .8125rem; }

.hist-lista { display: flex; flex-direction: column; gap: var(--space-3); list-style: none; margin: 0; padding: 0; }
.hist-item {
  display: flex; align-items: center; justify-content: space-between; gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius);
  font-size: .8125rem;
}
.hist-item--vigente { border-color: color-mix(in srgb, #059669 40%, var(--color-border-light)); background: color-mix(in srgb, #059669 6%, transparent); }
.hist-item__valores { display: flex; align-items: center; gap: var(--space-2); font-weight: 600; color: var(--color-text); }
.hist-item__periodo { color: var(--color-text-muted); font-size: .75rem; flex: 1; text-align: right; margin-right: var(--space-2); }

.back-btn {
  background: none; border: none;
  font-size: .8125rem; color: var(--color-text-muted);
  cursor: pointer; margin-bottom: var(--space-2);
  transition: color .15s;
}
.back-btn:hover { color: var(--color-primary-600); }

.detalhe__header { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-4); flex-wrap: wrap; }
.detalhe__nome { font-size: 1.375rem; font-weight: 700; color: var(--color-text); }
.detalhe__desc { font-size: .875rem; color: var(--color-text-muted); margin-top: var(--space-1); }
.detalhe__actions { display: flex; align-items: center; gap: var(--space-3); }

.detalhe__grid { display: grid; grid-template-columns: 1fr 320px; gap: var(--space-6); align-items: start; }
@media (max-width: 1000px) { .detalhe__grid { grid-template-columns: 1fr; } }
.detalhe__left, .detalhe__right { display: flex; flex-direction: column; gap: var(--space-5); }

.ft-table { width: 100%; border-collapse: collapse; font-size: .875rem; }
.ft-table th { text-align: left; padding: var(--space-2) var(--space-3); font-size: .75rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: var(--color-text-muted); border-bottom: 1px solid var(--color-border-light); }
.ft-table td { padding: var(--space-3); border-bottom: 1px solid var(--color-border-light); }
.ft-name { font-weight: 500; color: var(--color-text); }
.ft-cost { font-weight: 600; }
.ft-total td { font-weight: 700; color: var(--color-primary-700); padding: var(--space-3); background: var(--color-primary-50); border-top: 2px solid var(--color-primary-200); }

.imp-list { display: flex; flex-direction: column; gap: var(--space-2); }
.imp-item { display: flex; justify-content: space-between; align-items: center; padding: var(--space-3); background: var(--color-bg-subtle); border-radius: var(--radius); }
.imp-item__nome { font-size: .875rem; font-weight: 500; }
.imp-item__aliquota { font-size: .9375rem; font-weight: 700; color: var(--color-primary-600); }
.imp-empty { font-size: .875rem; color: var(--color-text-light); text-align: center; padding: var(--space-4); }

.params { display: flex; flex-direction: column; gap: var(--space-4); }
.param-item { display: flex; flex-direction: column; gap: var(--space-1); }
.param-item__label { font-size: .75rem; font-weight: 500; text-transform: uppercase; letter-spacing: .06em; color: var(--color-text-muted); }
.param-item__valor { font-size: 1.125rem; font-weight: 700; color: var(--color-text); }
.param-item__ate { font-size: .8125rem; font-weight: 500; color: var(--color-text-light); }
.param-item__hint { font-size: .6875rem; color: var(--color-text-muted); line-height: 1.4; }
.param-item__valor--green { color: var(--color-primary-600); }
.param-item__valor-row { display: flex; align-items: center; gap: var(--space-3); }
.param-item__edit { background: none; border: none; font-size: .75rem; color: var(--color-primary-600); cursor: pointer; font-weight: 500; }
.param-item__edit-row { display: flex; gap: var(--space-2); align-items: center; }
.param-input {
  width: 80px; padding: var(--space-1) var(--space-2);
  border: 1.5px solid var(--color-border); border-radius: var(--radius-sm);
  font-size: .9rem; outline: none;
}
.param-input:focus { border-color: var(--color-primary-400); }

.preco-box {
  background: var(--color-primary-900);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.preco-box__formula { font-size: .8125rem; color: var(--color-primary-300); text-align: center; }
.preco-box__formula strong { color: var(--color-primary-200); }
.preco-box__pv { display: flex; flex-direction: column; align-items: center; text-align: center; }
.preco-box__label { font-size: .7rem; text-transform: uppercase; letter-spacing: .08em; color: var(--color-primary-400); }
.preco-box__value { font-size: 2rem; font-weight: 800; color: var(--color-primary-300); }
.preco-box__breakdown { display: flex; flex-direction: column; gap: var(--space-2); border-top: 1px solid rgba(255,255,255,.1); padding-top: var(--space-4); }
.pb-row { display: flex; justify-content: space-between; gap: var(--space-3); font-size: .8125rem; color: var(--color-primary-300); }
.pb-row strong { color: var(--color-primary-200); }
.pb-row--lucro { border-top: 1px solid rgba(255,255,255,.1); padding-top: var(--space-2); }
.pb-row--lucro span, .pb-row--lucro strong { color: var(--color-primary-200); font-weight: 700; }

.erro-pdf {
  padding: var(--space-3) var(--space-4);
  background: #fef2f2;
  border: 1px solid #fca5a5;
  border-radius: var(--radius);
  font-size: .8125rem;
  color: #b91c1c;
}

/* ─── Cabeçalho da folha (só no PDF) ─────────────────────────────────────── */
.folha-cabecalho {
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 2px solid var(--color-primary-600);
  margin-bottom: var(--space-2);
}
.folha-cabecalho__empresa { display: block; font-size: 1rem; font-weight: 700; color: var(--color-text); }
.folha-cabecalho__cnpj { display: block; font-size: .75rem; color: var(--color-text-muted); }
.folha-cabecalho__meta { display: flex; flex-direction: column; text-align: right; font-size: .75rem; color: var(--color-text-muted); }

/* ─── Ajustes de impressão da ficha ──────────────────────────────────────── */
@media print {
  .detalhe { gap: var(--space-4); }
  .detalhe__nome { font-size: 1.125rem; }
  /* No papel a coluna da direita encolhe: cabe tudo numa folha só */
  .detalhe__grid { grid-template-columns: 1fr 260px; gap: var(--space-4); }
  .preco-box__value { font-size: 1.5rem; }
  .faixa-card { break-before: auto; }
}

.loading-page { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); padding: var(--space-12); color: var(--color-text-muted); }
.spinner { width: 32px; height: 32px; border: 3px solid var(--color-border); border-top-color: var(--color-primary-500); border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
