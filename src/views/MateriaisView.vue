<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMateriaisStore } from '@/stores/materiais'
import { useEmpresaStore } from '@/stores/empresa'
import { segmentoConfig } from '@/config/segmentos'
import { useCurrency } from '@/composables/useCurrency'
import { usePaginacao } from '@/composables/usePaginacao'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import InfiniteScrollSentinel from '@/components/ui/InfiniteScrollSentinel.vue'
import CurrencyInput from '@/components/ui/CurrencyInput.vue'
import type { Material, MaterialEntrada } from '@/types'

const store = useMateriaisStore()
const empresaStore = useEmpresaStore()
const seg = computed(() => segmentoConfig(empresaStore.empresa?.segmento))
const { formatCurrency } = useCurrency()

onMounted(() => store.fetchMateriais())

const busca = ref('')
const showModal = ref(false)
const editando = ref<Partial<Material>>({})

const filtrados = computed(() =>
  store.materiais.filter(m =>
    m.nome.toLowerCase().includes(busca.value.toLowerCase()) ||
    (m.fornecedor ?? '').toLowerCase().includes(busca.value.toLowerCase())
  )
)

// Infinite scroll — pageSize configurável (padrão 10)
const {
  itensVisiveis,
  temMais,
  carregandoMais,
  totalItens,
  sentinelaEl,
  carregarMais,
} = usePaginacao(filtrados, { pageSize: 10 })

function novoMaterial() {
  // Sem `empresaId`: a empresa do registro e decidida pelo servidor a partir do
  // que o store envia (a empresa ativa), nunca montada no formulario.
  editando.value = {
    nome: '',
    unidade: seg.value.rotulos.unidadePrincipal as Material['unidade'],
    custoUnitario: 0,
    tipo: empresaStore.empresa?.segmento === 'SERVICOS' ? 'MAO_DE_OBRA' : 'INSUMO',
  }
  showModal.value = true
}

function editarMaterial(m: Material) {
  editando.value = { ...m }
  showModal.value = true
}

async function salvar() {
  const salvo = await store.salvar(editando.value as MaterialEntrada)
  // Fechar a modal com o servidor tendo recusado faria o usuario acreditar que
  // salvou. A mensagem ja esta no store.
  if (salvo) showModal.value = false
}

const unidades: Material['unidade'][] = ['KG', 'G', 'L', 'ML', 'UN', 'CX', 'PCT', 'H', 'PC', 'TON', 'M', 'M2']
</script>

<template>
  <div class="materiais">
    <!-- Toolbar -->
    <div class="toolbar">
      <input v-model="busca" :placeholder="`Buscar ${seg.rotulos.material.toLowerCase()} ou fornecedor…`" class="search-input" />
      <BaseButton @click="novoMaterial">+ Novo {{ seg.rotulos.material }}</BaseButton>
    </div>

    <!-- Stats -->
    <div class="mini-stats">
      <div class="mini-stat">
        <span class="mini-stat__value">{{ store.materiais.length }}</span>
        <span class="mini-stat__label">{{ seg.rotulos.materiais }}</span>
      </div>
      <div class="mini-stat">
        <span class="mini-stat__value">{{ store.materiais.filter(m => (m.estoque ?? 0) <= 5).length }}</span>
        <span class="mini-stat__label">Estoque Baixo</span>
      </div>
    </div>

    <BaseCard>
      <div v-if="store.loading" class="loading">Carregando…</div>
      <template v-else>
        <table class="table">
          <thead>
            <tr>
              <th>Material</th>
              <th>Unidade</th>
              <th>Custo Unitário</th>
              <th>Fornecedor</th>
              <th>Estoque</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in itensVisiveis" :key="m.id" class="table__row">
              <td class="table__name">{{ m.nome }}</td>
              <td><BaseBadge color="gray">{{ m.unidade }}</BaseBadge></td>
              <td>{{ formatCurrency(m.custoUnitario) }}</td>
              <td class="table__muted">{{ m.fornecedor ?? '—' }}</td>
              <td>
                <BaseBadge :color="(m.estoque ?? 99) <= 5 ? 'orange' : 'green'">
                  {{ m.estoque ?? '—' }}
                </BaseBadge>
              </td>
              <td>
                <BaseButton size="sm" variant="ghost" @click="editarMaterial(m)">Editar</BaseButton>
              </td>
            </tr>
            <tr v-if="!itensVisiveis.length">
              <td v-if="store.erro" colspan="6" class="table__erro">
                {{ store.erro }}
                <button class="table__retentar" @click="store.fetchMateriais()">Tentar de novo</button>
              </td>
              <td v-else colspan="6" class="table__empty">Nenhum material encontrado</td>
            </tr>
          </tbody>
        </table>

        <!-- Sentinela de scroll infinito -->
        <div ref="sentinelaEl" class="sentinela-wrapper">
          <InfiniteScrollSentinel
            :carregando-mais="carregandoMais"
            :tem-mais="temMais"
            :total-itens="totalItens"
            @carregar-mais="carregarMais"
          />
        </div>
      </template>
    </BaseCard>

    <!-- Modal -->
    <BaseModal v-if="showModal" :title="editando.id ? 'Editar Material' : 'Novo Material'" @close="showModal = false">
      <form class="form-grid" @submit.prevent="salvar">
        <div class="field">
          <label class="field__label">Nome do Material</label>
          <input v-model="editando.nome" class="input" required placeholder="Ex: Farinha de trigo" />
        </div>
        <div class="field">
          <label class="field__label">Unidade</label>
          <select v-model="editando.unidade" class="input">
            <option v-for="u in unidades" :key="u" :value="u">{{ u }}</option>
          </select>
        </div>
        <CurrencyInput v-model="editando.custoUnitario" label="Custo Unitário (R$)" />
        <div class="field">
          <label class="field__label">Fornecedor</label>
          <input v-model="editando.fornecedor" class="input" placeholder="Nome do fornecedor" />
        </div>
        <div class="field">
          <label class="field__label">Estoque atual</label>
          <input v-model.number="editando.estoque" type="number" class="input" placeholder="Quantidade" />
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
.materiais { display: flex; flex-direction: column; gap: var(--space-5); }

.toolbar { display: flex; gap: var(--space-3); align-items: center; }
.search-input {
  flex: 1;
  padding: var(--space-2) var(--space-4);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius);
  font-size: .9rem;
  outline: none;
  background: var(--color-surface);
  color: var(--color-text);
}
.search-input:focus { border-color: var(--color-primary-400); box-shadow: 0 0 0 3px rgba(85,181,89,.15); }

.mini-stats { display: flex; gap: var(--space-4); }
.mini-stat {
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius);
  padding: var(--space-3) var(--space-5);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.mini-stat__value { font-size: 1.25rem; font-weight: 700; color: var(--color-text); }
.mini-stat__label { font-size: .75rem; color: var(--color-text-muted); }

.table { width: 100%; border-collapse: collapse; font-size: .875rem; }
.table th {
  text-align: left;
  padding: var(--space-2) var(--space-3);
  font-size: .75rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: .05em;
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-border-light);
}
.table td { padding: var(--space-3); border-bottom: 1px solid var(--color-border-light); }
.table__row:hover td { background: var(--color-bg-subtle); }
.table__name { font-weight: 500; color: var(--color-text); }
.table__muted { color: var(--color-text-muted); font-size: .8125rem; }
.table__empty { text-align: center; color: var(--color-text-light); padding: var(--space-8) !important; }
/* Falha de carregamento nao pode parecer ausencia de cadastro (REQ-16) */
.table__erro { text-align: center; color: var(--color-danger); padding: var(--space-8) !important; }
.table__retentar {
  display: block;
  margin: var(--space-3) auto 0;
  background: none;
  border: 1px solid currentColor;
  color: inherit;
  border-radius: var(--radius);
  padding: var(--space-1) var(--space-3);
  cursor: pointer;
  font-size: .8125rem;
}

.sentinela-wrapper { border-top: 1px dashed var(--color-border-light); }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
.field { display: flex; flex-direction: column; gap: var(--space-1); }
.field__label { font-size: .8125rem; font-weight: 500; color: var(--color-text-muted); }
.input {
  padding: var(--space-2) var(--space-3);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius);
  font-size: .9rem;
  color: var(--color-text);
  outline: none;
  background: var(--color-surface);
  font-family: inherit;
}
.input:focus { border-color: var(--color-primary-400); box-shadow: 0 0 0 3px rgba(85,181,89,.15); }
.loading { padding: var(--space-8); text-align: center; color: var(--color-text-muted); }
</style>
