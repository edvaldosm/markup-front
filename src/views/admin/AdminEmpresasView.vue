<script setup lang="ts">
/**
 * Gestão do Site — Empresas.
 * Lista **todas** as empresas da base (não o conjunto autorizado por ownership:
 * o escopo global do ADMIN já é o conjunto). Cada linha mostra dono, tributação
 * e a equipe com acesso; o detalhe abre em `/admin/empresas/:id`.
 */
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '@/stores/admin'
import { useCurrency } from '@/composables/useCurrency'
import { usePaginacao } from '@/composables/usePaginacao'
import { segmentoConfig, SEGMENTOS } from '@/config/segmentos'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import InfiniteScrollSentinel from '@/components/ui/InfiniteScrollSentinel.vue'
import type { SegmentoNegocio } from '@/types'

const store = useAdminStore()
const { formatCurrency } = useCurrency()

onMounted(() => { if (!store.carregado) store.fetchTudo() })

const busca = ref('')
const filtroSegmento = ref<SegmentoNegocio | ''>('')

const filtradas = computed(() => {
  const termo = busca.value.trim().toLowerCase()
  return store.empresas.filter(({ empresa, dono }) => {
    const casaSegmento = !filtroSegmento.value || empresa.segmento === filtroSegmento.value
    const casaTermo = !termo
      || empresa.razaoSocial.toLowerCase().includes(termo)
      || (empresa.cnpj?.includes(termo) ?? false)
      || (dono?.nome.toLowerCase().includes(termo) ?? false)
      || (dono?.email.toLowerCase().includes(termo) ?? false)
    return casaSegmento && casaTermo
  })
})

const {
  itensVisiveis, temMais, carregandoMais, totalItens, sentinelaEl, carregarMais,
} = usePaginacao(filtradas, { pageSize: 8 })

const iniciais = (nome: string) =>
  nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

const regime = (chave: string) => chave.replace(/_/g, ' ').toLowerCase()
</script>

<template>
  <div class="admin-empresas">
    <div class="toolbar">
      <div class="toolbar__info">
        <h2 class="section-title">Empresas cadastradas</h2>
        <p class="section-sub">{{ totalItens }} de {{ store.metricas?.totalEmpresas ?? '—' }} empresas da base</p>
      </div>
      <div class="toolbar__filtros">
        <input v-model="busca" class="input" placeholder="Buscar por empresa, CNPJ ou dono…" />
        <select v-model="filtroSegmento" class="input input--select">
          <option value="">Todos os segmentos</option>
          <option v-for="seg in SEGMENTOS" :key="seg.chave" :value="seg.chave">{{ seg.nome }}</option>
        </select>
      </div>
    </div>

    <BaseCard padding="none">
      <!-- A tabela é larga (7 colunas): rola dentro do card em vez de ser cortada -->
      <div class="tabela-scroll">
      <table class="table">
        <thead>
          <tr>
            <th>Empresa</th>
            <th>Segmento</th>
            <th>Tributação</th>
            <th>Dono</th>
            <th>Equipe com acesso</th>
            <th class="th-num">Faturamento médio</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="linha in itensVisiveis" :key="linha.empresa.id">
            <td>
              <span class="cell-forte">{{ linha.empresa.razaoSocial }}</span>
              <span class="cell-sub">{{ linha.empresa.cnpj }}</span>
            </td>
            <td>
              <span class="seg-pill">
                <span>{{ segmentoConfig(linha.empresa.segmento).icone }}</span>
                {{ segmentoConfig(linha.empresa.segmento).nome }}
              </span>
            </td>
            <td>
              <span class="cell-regime">{{ regime(linha.empresa.regimeTributario) }}</span>
              <span v-if="linha.empresa.anexoCadastrado" class="cell-sub">
                {{ linha.empresa.anexoCadastrado.replace('_', ' ') }}
              </span>
            </td>
            <td>
              <template v-if="linha.dono">
                <span class="cell-forte">{{ linha.dono.nome }}</span>
                <span class="cell-sub">{{ linha.dono.email }}</span>
              </template>
              <span v-else class="cell-sub">sem dono</span>
            </td>
            <td>
              <div class="equipe">
                <span
                  v-for="membro in linha.equipe.slice(0, 4)"
                  :key="membro.usuario.id"
                  class="avatar"
                  :class="{ 'avatar--inativo': !membro.usuario.ativo }"
                  :title="`${membro.usuario.nome} — ${membro.perfil?.nome ?? 'sem perfil'}`"
                >{{ iniciais(membro.usuario.nome) }}</span>
                <span v-if="linha.equipe.length > 4" class="equipe__mais">+{{ linha.equipe.length - 4 }}</span>
                <span class="equipe__total">{{ linha.equipe.length }} usuário(s)</span>
              </div>
            </td>
            <td class="td-num">{{ formatCurrency(linha.empresa.faturamentoMedioMensal) }}</td>
            <td class="td-acao">
              <RouterLink class="link" :to="`/admin/empresas/${linha.empresa.id}`">Gerenciar →</RouterLink>
            </td>
          </tr>
          <tr v-if="!itensVisiveis.length">
            <td colspan="7" class="table__empty">Nenhuma empresa encontrada com esse filtro.</td>
          </tr>
        </tbody>
      </table>
      </div>

      <div ref="sentinelaEl" class="sentinela-wrapper">
        <InfiniteScrollSentinel
          :carregando-mais="carregandoMais"
          :tem-mais="temMais"
          :total-itens="totalItens"
          @carregar-mais="carregarMais"
        />
      </div>
    </BaseCard>

    <p class="rodape-nota">
      <BaseBadge color="gray">Escopo global</BaseBadge>
      Esta listagem ignora ownership por ser área de suporte — a autoridade sobre o
      acesso continua no backend.
    </p>
  </div>
</template>

<style scoped>
.admin-empresas { display: flex; flex-direction: column; gap: var(--space-5); }

.toolbar { display: flex; align-items: flex-end; justify-content: space-between; gap: var(--space-4); flex-wrap: wrap; }
.section-title { font-size: 1rem; font-weight: 600; color: var(--color-text); }
.section-sub { font-size: .8125rem; color: var(--color-text-muted); }
.toolbar__filtros { display: flex; gap: var(--space-3); }

.input {
  padding: var(--space-2) var(--space-3);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius);
  font-size: .875rem;
  color: var(--color-text);
  background: var(--color-surface);
  outline: none;
  font-family: inherit;
  min-width: 260px;
}
.input:focus { border-color: var(--color-primary-500); box-shadow: 0 0 0 3px var(--focus-ring); }
.input--select { min-width: 190px; }

.tabela-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.table { width: 100%; min-width: 900px; border-collapse: collapse; font-size: .875rem; }
.table th {
  text-align: left; padding: var(--space-3) var(--space-4);
  font-size: .7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .06em;
  color: var(--color-text-muted); border-bottom: 1px solid var(--color-border-light);
  background: var(--color-bg-subtle);
}
.table td { padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border-light); vertical-align: middle; }
.table tbody tr:hover { background: var(--color-primary-50); }
.th-num, .td-num { text-align: right; }
.td-num { font-variant-numeric: tabular-nums; color: var(--color-text); }
.td-acao { text-align: right; white-space: nowrap; }
.table__empty { text-align: center; color: var(--color-text-light); padding: var(--space-8) !important; }

.cell-forte { display: block; font-weight: 600; color: var(--color-text); }
.cell-sub { display: block; font-size: .75rem; color: var(--color-text-muted); }
.cell-regime { display: block; text-transform: capitalize; color: var(--color-text); }

.seg-pill {
  display: inline-flex; align-items: center; gap: var(--space-1);
  padding: 2px var(--space-2);
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border-light);
  border-radius: 99px;
  font-size: .75rem; font-weight: 600; color: var(--color-text-muted);
  white-space: nowrap;
}

.equipe { display: flex; align-items: center; gap: var(--space-1); }
.avatar {
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--color-primary-700);
  color: #fff; font-size: .65rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid var(--color-surface);
  margin-right: -8px;
}
.avatar--inativo { background: var(--color-primary-300); color: var(--color-primary-800); }
.equipe__mais { font-size: .7rem; font-weight: 700; color: var(--color-text-muted); margin-left: 12px; }
.equipe__total { font-size: .75rem; color: var(--color-text-muted); margin-left: var(--space-3); white-space: nowrap; }

.link { font-size: .8125rem; font-weight: 600; color: var(--color-primary-700); }
.link:hover { text-decoration: underline; }

.sentinela-wrapper { border-top: 1px dashed var(--color-border-light); }

.rodape-nota {
  display: flex; align-items: center; gap: var(--space-2);
  font-size: .75rem; color: var(--color-text-muted);
}

@media (max-width: 768px) {
  .toolbar__filtros { width: 100%; flex-direction: column; }
  .input, .input--select { min-width: 0; width: 100%; }
}
</style>
