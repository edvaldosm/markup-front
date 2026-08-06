<script setup lang="ts">
/**
 * Estado salvo vem de `Empresa.fatorR`/`Empresa.anexoAplicado` (C8/C9,
 * REQ-02 de `contrato-graphql-pendencias-frontend`). O simulador "e se" usa
 * `simularFatorR` (REQ-03, mesma revisão) — stateless, não grava nada. O
 * card "Impacto no preço" usa `simularImpactoAnexo`: compara o mesmo produto
 * sob a alíquota efetiva de cada anexo (1ª faixa do Simples: 6% Anexo III,
 * 15,5% Anexo V) — é comparação didática, não o preço oficial do produto
 * (que usa os impostos cadastrados nele, dado independente do anexo).
 * Nenhum cálculo acontece neste arquivo (Artigo III v2.5.0): os dois números
 * que mais importam aqui — Fator R e preço — sempre vêm de uma resposta do
 * servidor.
 */
import { ref, computed, watch, onMounted } from 'vue'
import { useEmpresaStore } from '@/stores/empresa'
import { usePrecificacaoStore } from '@/stores/precificacao'
import { useCurrency } from '@/composables/useCurrency'
import { apolloClient } from '@/graphql/client'
import { SIMULAR_FATOR_R } from '@/graphql/operations/acesso'
import { SIMULAR_IMPACTO_ANEXO } from '@/graphql/operations/precificacao'
import { mensagemDeErro } from '@/graphql/erros'
import type { SimulacaoFatorR, ImpactoAnexo, Empresa } from '@/types'
import FatorRNote from '@/components/ui/FatorRNote.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'

const LIMITE_FATOR_R = 28

const empresaStore = useEmpresaStore()
const precificacaoStore = usePrecificacaoStore()
const { formatPercent, formatCurrency } = useCurrency()

const empresa = computed(() => empresaStore.empresa)
const forRServico = computed(
  () => empresa.value?.segmento === 'SERVICOS' && empresa.value?.regimeTributario === 'SIMPLES_NACIONAL',
)

function rotuloAnexo(anexo: string | null | undefined): string {
  return anexo ? `Anexo ${anexo.replace('ANEXO_', '')}` : '—'
}
function corAnexo(anexo: string | null | undefined): 'green' | 'orange' | 'gray' {
  if (anexo === 'ANEXO_III') return 'green'
  if (anexo === 'ANEXO_V') return 'orange'
  return 'gray'
}

onMounted(async () => {
  await Promise.all([empresaStore.fetchEmpresas(), precificacaoStore.buscarTodos()])
})

// ── Simulador de Fator R — folha via slider + campo formatado ──────────────

const folhaSimulada = ref(empresa.value?.folhaPagamentoMensal ?? 0)
watch(empresa, (e) => { if (e) folhaSimulada.value = e.folhaPagamentoMensal ?? 0 })

const sliderMax = computed(() => {
  const base = Math.max(empresa.value?.faturamentoMedioMensal ?? 0, folhaSimulada.value, 10000)
  return Math.ceil((base * 1.2) / 1000) * 1000
})

/** Máscara monetária por dígitos (padrão de app bancário BR): digita da direita pra esquerda, sem pular cursor. */
const folhaTexto = computed<string>({
  get: () => formatCurrency(folhaSimulada.value),
  set: (valor: string) => {
    const digitos = valor.replace(/\D/g, '')
    folhaSimulada.value = digitos ? Number(digitos) / 100 : 0
  },
})

const simulacao = ref<SimulacaoFatorR | null>(null)
const simulando = ref(false)
const erroSimulacao = ref<string | null>(null)
let debounceId: ReturnType<typeof setTimeout> | undefined

async function simularFatorR(): Promise<void> {
  if (!empresa.value) return
  simulando.value = true
  erroSimulacao.value = null
  try {
    const { data } = await apolloClient.query({
      query: SIMULAR_FATOR_R,
      variables: {
        empresaId: empresa.value.id,
        faturamentoMedioMensal: empresa.value.faturamentoMedioMensal,
        folhaPagamentoMensal: folhaSimulada.value,
      },
      fetchPolicy: 'network-only',
    })
    simulacao.value = data.simularFatorR
  } catch (e) {
    erroSimulacao.value = mensagemDeErro(e, 'simularFatorR')
  } finally {
    simulando.value = false
  }
}

/** Debounced: arrastar o slider não dispara uma consulta por pixel. */
watch(folhaSimulada, () => {
  clearTimeout(debounceId)
  debounceId = setTimeout(simularFatorR, 350)
})
watch(empresa, (e) => { if (e && forRServico.value) simularFatorR() }, { immediate: true })

const fatorRExibido = computed(() => simulacao.value?.fatorR ?? empresa.value?.fatorR ?? 0)
const anexoExibido = computed(() => simulacao.value?.anexoAplicado ?? empresa.value?.anexoAplicado ?? null)
const gaugePercent = computed(() => Math.min((fatorRExibido.value / 60) * 100, 100))
const limitePercent = (LIMITE_FATOR_R / 60) * 100

// ── Impacto no preço — mesmo produto, Anexo III vs V ────────────────────────

const produtoEscolhidoId = ref<string>('')
const produtosServico = computed(() => precificacaoStore.todos.filter(r => r.produto.ativo))

watch(produtosServico, (lista) => {
  if (!produtoEscolhidoId.value && lista.length) produtoEscolhidoId.value = lista[0].produto.id
}, { immediate: true })

const impacto = ref<ImpactoAnexo | null>(null)
const carregandoImpacto = ref(false)
const erroImpacto = ref<string | null>(null)

async function carregarImpacto(): Promise<void> {
  if (!produtoEscolhidoId.value) { impacto.value = null; return }
  carregandoImpacto.value = true
  erroImpacto.value = null
  try {
    const { data } = await apolloClient.query({
      query: SIMULAR_IMPACTO_ANEXO,
      variables: { produtoId: produtoEscolhidoId.value },
      fetchPolicy: 'network-only',
    })
    impacto.value = data.simularImpactoAnexo
  } catch (e) {
    erroImpacto.value = mensagemDeErro(e, 'simularImpactoAnexo')
    impacto.value = null
  } finally {
    carregandoImpacto.value = false
  }
}
watch(produtoEscolhidoId, carregarImpacto, { immediate: true })

const diferencaPreco = computed(() => {
  if (!impacto.value) return null
  const iii = impacto.value.comoAnexoIII.precoVenda
  const v = impacto.value.comoAnexoV.precoVenda
  return { valor: v - iii, percentual: iii > 0 ? ((v - iii) / iii) * 100 : 0 }
})

// ── Empresas de serviços — comparativo ──────────────────────────────────────

const empresasDeServico = computed<Empresa[]>(
  () => empresaStore.empresas.filter(e => e.segmento === 'SERVICOS' && e.regimeTributario === 'SIMPLES_NACIONAL'),
)
</script>

<template>
  <div class="fator-r">
    <FatorRNote />

    <template v-if="!empresa">
      <p class="aviso">Selecione uma empresa para ver o Fator R.</p>
    </template>

    <template v-else-if="!forRServico">
      <div class="aviso">
        <strong>Fator R não se aplica a esta empresa.</strong>
        <p>Vale só para prestação de serviços no Simples Nacional — {{ empresa.segmento }} /
          {{ empresa.regimeTributario }} fica fora do recorte.</p>
      </div>
    </template>

    <template v-else>
      <div class="grid-principal">
        <BaseCard title="Simulador de Fator R" subtitle="Ajuste a folha e veja o anexo mudar">
          <div class="campo-leitura">
            <span class="campo-leitura__label">Faturamento médio mensal</span>
            <span class="campo-leitura__valor">{{ formatCurrency(empresa.faturamentoMedioMensal) }}</span>
          </div>

          <div class="campo-slider">
            <span class="campo-leitura__label">Folha de pagamento mensal</span>
            <input
              v-model.number="folhaSimulada"
              type="range" class="slider"
              :min="0" :max="sliderMax" :step="100"
            />
            <input
              v-model="folhaTexto"
              type="text" inputmode="numeric" class="input input--valor"
            />
          </div>

          <div class="gauge">
            <div class="gauge__valor" :class="{ 'gauge__valor--v': anexoExibido === 'ANEXO_V' }">
              {{ formatPercent(fatorRExibido) }}
            </div>
            <div class="gauge__rotulo">FATOR R <span v-if="simulando" class="gauge__carregando">atualizando…</span></div>
            <div class="gauge__trilha">
              <div
                class="gauge__preenchido"
                :class="{ 'gauge__preenchido--v': anexoExibido === 'ANEXO_V' }"
                :style="{ width: gaugePercent + '%' }"
              />
              <div class="gauge__limite" :style="{ left: limitePercent + '%' }" title="Limite de 28%" />
            </div>
          </div>

          <div class="anexo-resultado">
            <BaseBadge :color="corAnexo(anexoExibido)">{{ rotuloAnexo(anexoExibido) }}</BaseBadge>
            <span class="anexo-resultado__nota">
              <template v-if="anexoExibido === 'ANEXO_III'">✓ Fator R ≥ 28% — tributando na alíquota menor (6%).</template>
              <template v-else-if="anexoExibido === 'ANEXO_V'">Fator R &lt; 28% — tributando na alíquota maior (15,5%).</template>
            </span>
          </div>

          <p v-if="erroSimulacao" class="erro">{{ erroSimulacao }}</p>
        </BaseCard>

        <BaseCard title="Impacto no preço" subtitle="Mesmo serviço, dois anexos">
          <div v-if="produtosServico.length" class="seletor-produto">
            <select v-model="produtoEscolhidoId" class="input">
              <option v-for="r in produtosServico" :key="r.produto.id" :value="r.produto.id">
                {{ r.produto.nome }}
              </option>
            </select>
          </div>

          <p v-if="erroImpacto" class="erro">{{ erroImpacto }}</p>
          <p v-else-if="carregandoImpacto" class="aviso-inline">Calculando…</p>
          <p v-else-if="!produtosServico.length" class="aviso-inline">Nenhum produto ativo cadastrado.</p>

          <template v-else-if="impacto">
            <div class="comparativo">
              <div class="comparativo__box comparativo__box--iii">
                <span class="comparativo__rotulo">ANEXO III (6%)</span>
                <span class="comparativo__preco">{{ formatCurrency(impacto.comoAnexoIII.precoVenda) }}</span>
              </div>
              <div class="comparativo__box comparativo__box--v">
                <span class="comparativo__rotulo">ANEXO V (15,5%)</span>
                <span class="comparativo__preco">{{ formatCurrency(impacto.comoAnexoV.precoVenda) }}</span>
              </div>
            </div>

            <p v-if="diferencaPreco && diferencaPreco.valor > 0" class="comparativo__nota">
              No Anexo V, o preço sobe <strong>{{ formatCurrency(diferencaPreco.valor) }}
              ({{ diferencaPreco.percentual >= 0 ? '+' : '' }}{{ formatPercent(diferencaPreco.percentual) }})</strong>
              para manter a mesma margem.
            </p>

            <p class="comparativo__rodape">
              Custo base {{ formatCurrency(impacto.comoAnexoIII.custoBase) }} ·
              DF {{ formatPercent(impacto.comoAnexoIII.percentualDespesasFixas) }} ·
              ML {{ formatPercent(impacto.comoAnexoIII.percentualMargemLucro) }} ·
              Desc. {{ formatPercent(impacto.comoAnexoIII.percentualDesconto) }}
            </p>
            <p class="comparativo__aproximacao">
              Comparação didática com a alíquota da 1ª faixa do Simples — não é o cálculo oficial
              do produto, que usa os impostos cadastrados nele.
            </p>
          </template>
        </BaseCard>
      </div>

      <BaseCard
        v-if="empresasDeServico.length > 1"
        title="Empresas de serviços"
        subtitle="Fator R e anexo de cada empresa"
      >
        <table class="tabela-empresas">
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
            <tr v-for="e in empresasDeServico" :key="e.id" :class="{ 'tabela-empresas__ativa': e.id === empresa.id }">
              <td>{{ e.razaoSocial }}</td>
              <td>{{ formatCurrency(e.faturamentoMedioMensal) }}</td>
              <td>{{ formatCurrency(e.folhaPagamentoMensal ?? 0) }}</td>
              <td class="tabela-empresas__forte">{{ e.fatorR != null ? formatPercent(e.fatorR) : '—' }}</td>
              <td><BaseBadge :color="corAnexo(e.anexoAplicado)">{{ rotuloAnexo(e.anexoAplicado) }}</BaseBadge></td>
            </tr>
          </tbody>
        </table>
      </BaseCard>
    </template>
  </div>
</template>

<style scoped>
.fator-r { display: flex; flex-direction: column; gap: var(--space-6); }

.aviso {
  background: var(--color-bg-subtle);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  color: var(--color-text-muted);
}
.aviso strong { color: var(--color-text); display: block; margin-bottom: var(--space-2); }
.aviso p { margin: 0; font-size: .875rem; }
.aviso-inline { color: var(--color-text-muted); font-size: .875rem; }

.grid-principal {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: var(--space-6);
  align-items: start;
}

.campo-leitura { display: flex; flex-direction: column; gap: var(--space-1); margin-bottom: var(--space-4); }
.campo-leitura__label { font-size: .8125rem; color: var(--color-text-muted); }
.campo-leitura__valor { font-size: 1.1rem; font-weight: 700; color: var(--color-text); }

.campo-slider { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-5); }
.slider {
  width: 100%;
  accent-color: #059669;
  cursor: pointer;
}
.input--valor { max-width: 220px; font-weight: 600; }

.gauge { text-align: center; margin: var(--space-5) 0; }
.gauge__valor { font-size: 2.25rem; font-weight: 800; color: #059669; line-height: 1.1; }
.gauge__valor--v { color: #d97706; }
.gauge__rotulo { font-size: .75rem; letter-spacing: .06em; color: var(--color-text-muted); margin-bottom: var(--space-3); }
.gauge__carregando { font-style: italic; }
.gauge__trilha {
  position: relative;
  height: 10px;
  border-radius: 99px;
  background: var(--color-bg-subtle);
  overflow: visible;
}
.gauge__preenchido {
  height: 100%;
  border-radius: 99px;
  background: linear-gradient(90deg, #34d399, #059669);
  transition: width .25s ease;
}
.gauge__preenchido--v { background: linear-gradient(90deg, #fbbf24, #d97706); }
.gauge__limite {
  position: absolute;
  top: -3px;
  width: 2px;
  height: 16px;
  background: var(--color-text-light);
}

.anexo-resultado { display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; }
.anexo-resultado__nota { font-size: .8125rem; color: var(--color-text-muted); }

.seletor-produto { margin-bottom: var(--space-4); }

.comparativo { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
.comparativo__box {
  display: flex; flex-direction: column; gap: var(--space-1);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
}
.comparativo__box--iii { background: color-mix(in srgb, #059669 10%, transparent); }
.comparativo__box--v { background: color-mix(in srgb, #d97706 10%, transparent); }
.comparativo__rotulo { font-size: .7rem; font-weight: 700; letter-spacing: .04em; color: var(--color-text-muted); }
.comparativo__preco { font-size: 1.35rem; font-weight: 800; color: var(--color-text); }

.comparativo__nota { font-size: .8125rem; color: var(--color-text); margin: var(--space-4) 0 0; }
.comparativo__rodape { font-size: .75rem; color: var(--color-text-muted); margin: var(--space-3) 0 0; }
.comparativo__aproximacao { font-size: .7rem; color: var(--color-text-light); font-style: italic; margin: var(--space-2) 0 0; }

.erro { color: var(--color-danger, #dc2626); font-size: .875rem; }

.tabela-empresas { width: 100%; border-collapse: collapse; font-size: .875rem; }
.tabela-empresas th {
  text-align: left; font-size: .75rem; text-transform: uppercase; letter-spacing: .04em;
  color: var(--color-text-muted); padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--color-border-light);
}
.tabela-empresas td { padding: var(--space-3); border-bottom: 1px solid var(--color-border-light); }
.tabela-empresas__ativa { background: color-mix(in srgb, #059669 6%, transparent); }
.tabela-empresas__forte { font-weight: 700; }
</style>
