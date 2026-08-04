<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProdutosStore } from '@/stores/produtos'
import { useMateriaisStore } from '@/stores/materiais'
import { useEmpresaStore } from '@/stores/empresa'
import { segmentoConfig } from '@/config/segmentos'
import { useCurrency } from '@/composables/useCurrency'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import ProdutoFormModal from '@/components/ui/ProdutoFormModal.vue'

const router = useRouter()
const store = useProdutosStore()
const materiaisStore = useMateriaisStore()
const empresaStore = useEmpresaStore()
const seg = computed(() => segmentoConfig(empresaStore.empresa?.segmento))
const { formatPercent } = useCurrency()

onMounted(() => Promise.all([store.fetchProdutos(), materiaisStore.fetchMateriais()]))

const showFormModal = ref(false)

const busca = ref('')
const filtroCategoria = ref('')

const categorias = computed(() => {
  const set = new Set(store.produtos.map(p => p.categoria).filter(Boolean) as string[])
  return [...set]
})

const filtrados = computed(() =>
  store.produtos.filter(p => {
    const matchBusca = p.nome.toLowerCase().includes(busca.value.toLowerCase())
    const matchCat = !filtroCategoria.value || p.categoria === filtroCategoria.value
    return matchBusca && matchCat
  })
)

/** C1 vem calculado do servidor (B1) — a tela apenas lê. */
function custoBaseProduto(prodId: string): number {
  return store.getProduto(prodId)?.custoBase ?? 0
}
</script>

<template>
  <div class="produtos">
    <div class="toolbar">
      <input v-model="busca" :placeholder="`Buscar ${seg.rotulos.produto.toLowerCase()}…`" class="search-input" />
      <select v-model="filtroCategoria" class="select-filter">
        <option value="">Todas as categorias</option>
        <option v-for="c in categorias" :key="c" :value="c">{{ c }}</option>
      </select>
      <BaseButton @click="showFormModal = true">+ Novo {{ seg.rotulos.produto }}</BaseButton>
    </div>

    <div class="produtos-grid">
      <div
        v-for="p in filtrados"
        :key="p.id"
        class="produto-card"
        :class="{ 'produto-card--inativo': !p.ativo }"
        @click="router.push(`/produtos/${p.id}`)"
      >
        <div class="produto-card__header">
          <div>
            <h3 class="produto-card__nome">{{ p.nome }}</h3>
            <p v-if="p.categoria" class="produto-card__categoria">{{ p.categoria }}</p>
          </div>
          <BaseBadge :color="p.ativo ? 'green' : 'gray'">{{ p.ativo ? 'Ativo' : 'Inativo' }}</BaseBadge>
        </div>

        <p v-if="p.descricao" class="produto-card__desc">{{ p.descricao }}</p>

        <div class="produto-card__stats">
          <div class="pstat">
            <span class="pstat__label">{{ seg.rotulos.materialPlural }}</span>
            <span class="pstat__value">{{ p.ficha.length }}</span>
          </div>
          <div class="pstat">
            <span class="pstat__label">Margem</span>
            <span class="pstat__value">{{ formatPercent(p.margemLucro) }}</span>
          </div>
          <div class="pstat">
            <span class="pstat__label">Desc. máx.</span>
            <span class="pstat__value">{{ formatPercent(p.descontoMaximo) }}</span>
          </div>
        </div>

        <div class="produto-card__footer">
          <span class="produto-card__link">Ver {{ seg.rotulos.fichaTecnica.toLowerCase() }} →</span>
        </div>
      </div>

      <div v-if="!filtrados.length" class="empty-state">
        <span>{{ seg.icone }}</span>
        <p>Nenhum {{ seg.rotulos.produto.toLowerCase() }} encontrado</p>
        <BaseButton @click="showFormModal = true">Cadastrar primeiro {{ seg.rotulos.produto.toLowerCase() }}</BaseButton>
      </div>
    </div>

    <ProdutoFormModal
      v-if="showFormModal"
      @close="showFormModal = false"
      @saved="showFormModal = false"
    />
  </div>
</template>

<style scoped>
.produtos { display: flex; flex-direction: column; gap: var(--space-5); }

.toolbar { display: flex; gap: var(--space-3); align-items: center; flex-wrap: wrap; }
.search-input {
  flex: 1; min-width: 180px;
  padding: var(--space-2) var(--space-4);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius);
  font-size: .9rem; outline: none;
  background: var(--color-surface); color: var(--color-text);
}
.search-input:focus { border-color: var(--color-primary-400); box-shadow: 0 0 0 3px rgba(85,181,89,.15); }
.select-filter {
  padding: var(--space-2) var(--space-3);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius);
  font-size: .875rem;
  background: var(--color-surface); color: var(--color-text);
  outline: none;
}
.select-filter:focus { border-color: var(--color-primary-400); }

.produtos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--space-4); }

.produto-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  transition: box-shadow .2s, transform .15s;
}
.produto-card:hover {
  box-shadow: var(--shadow);
  transform: translateY(-2px);
}
.produto-card--inativo { opacity: .6; }

.produto-card__header { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-3); }
.produto-card__nome {
  font-size: .9375rem; font-weight: 600; color: var(--color-text);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden; height: 2.8em; line-height: 1.4;
}
.produto-card__categoria { font-size: .75rem; color: var(--color-text-muted); margin-top: 2px; }
.produto-card__desc {
  font-size: .8125rem; color: var(--color-text-muted);
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
  overflow: hidden; height: 3.9em; line-height: 1.6;
}

.produto-card__stats {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-3);
  background: var(--color-bg-subtle);
  border-radius: var(--radius);
}
.pstat { display: flex; flex-direction: column; align-items: center; flex: 1; }
.pstat__label { font-size: .65rem; text-transform: uppercase; letter-spacing: .06em; color: var(--color-text-muted); }
.pstat__value { font-size: .9375rem; font-weight: 700; color: var(--color-text); }

.produto-card__footer { display: flex; justify-content: flex-end; }
.produto-card__link { font-size: .8125rem; font-weight: 500; color: var(--color-primary-600); }

.empty-state {
  grid-column: 1/-1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-12);
  color: var(--color-text-light);
  font-size: 2.5rem;
}
.empty-state p { font-size: .9rem; }
</style>
