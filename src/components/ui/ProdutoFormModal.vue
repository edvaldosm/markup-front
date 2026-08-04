<script setup lang="ts">
import { ref, reactive, watch, computed, onMounted } from 'vue'
import { useMateriaisStore } from '@/stores/materiais'
import { useImpostosStore } from '@/stores/impostos'
import { useProdutosStore } from '@/stores/produtos'
import { useEmpresaStore } from '@/stores/empresa'
import { segmentoConfig } from '@/config/segmentos'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import type { ItemFichaTecnicaEntrada, Produto, TipoProduto } from '@/types'

const props = defineProps<{
  produto?: Produto  // undefined = novo produto
}>()

const emit = defineEmits<{ close: []; saved: [produto: Produto] }>()

const materiaisStore = useMateriaisStore()
const impostosStore = useImpostosStore()
const produtosStore = useProdutosStore()
const empresaStore = useEmpresaStore()

onMounted(() => {
  if (!materiaisStore.materiais.length) materiaisStore.fetchMateriais()
  if (!impostosStore.impostos.length) impostosStore.fetchImpostos()
})

// ── Formulário ─────────────────────────────────────────────────────────────

/**
 * Sem `ativo`: o contrato nao tem o campo em `ProdutoInput` e nao ha mutation de
 * alternancia. Oferecer o controle seria prometer o que o servidor recusa — a
 * listagem continua exibindo o estado, so nao deixa edita-lo. Pendencia
 * registrada para o markup-back.
 */
const form = reactive({
  nome: '',
  descricao: '',
  categoria: '',
  tipo: 'PRODUTO' as TipoProduto,
  margemLucro: 30,
  descontoMaximo: 5,
})

/** Ficha em formato de **entrada**: referencia por id, como o input espera. */
const ficha = ref<ItemFichaTecnicaEntrada[]>([])
/** Impostos por referencia: a aliquota e a do cadastro (C3), nao uma copia. */
const impostoIds = ref<string[]>([])

// Popular ao editar
watch(() => props.produto, (p) => {
  if (p) {
    form.nome = p.nome
    form.descricao = p.descricao ?? ''
    form.categoria = p.categoria ?? ''
    form.tipo = p.tipo
    form.margemLucro = p.margemLucro
    form.descontoMaximo = p.descontoMaximo
    // A ficha vem resolvida do servidor; a edicao volta a referenciar por id
    ficha.value = p.ficha.map(item => ({
      materialId: item.material.id,
      quantidadeUtilizada: item.quantidadeUtilizada,
      unidade: item.unidade,
    }))
    impostoIds.value = p.impostos.map(i => i.id)
  }
}, { immediate: true })

// ── Materiais da ficha técnica ──────────────────────────────────────────────

function addMaterial() {
  const primeiro = materiaisStore.materiais[0]
  if (primeiro) {
    ficha.value.push({ materialId: primeiro.id, quantidadeUtilizada: 1, unidade: primeiro.unidade })
  }
}

function removeMaterial(idx: number) {
  ficha.value.splice(idx, 1)
}

function onMaterialChange(idx: number, materialId: string) {
  const mat = materiaisStore.materiais.find(m => m.id === materialId)
  if (mat) ficha.value[idx].unidade = mat.unidade
}

function materialDe(materialId: string) {
  return materiaisStore.materiais.find(m => m.id === materialId)
}

// ── Impostos ────────────────────────────────────────────────────────────────

function addImposto() {
  const disponivel = impostosStore.impostos.find(
    i => i.ativo && !impostoIds.value.includes(i.id),
  )
  if (disponivel) impostoIds.value.push(disponivel.id)
}

function removeImposto(idx: number) {
  impostoIds.value.splice(idx, 1)
}

/** Alíquota exibida: sempre a do cadastro, nunca digitada aqui. */
function aliquotaDe(impostoId: string): number {
  return impostosStore.impostos.find(i => i.id === impostoId)?.aliquotaPercentual ?? 0
}

// ── Salvar ──────────────────────────────────────────────────────────────────

const erros = ref<string[]>([])

async function salvar() {
  erros.value = []
  if (!form.nome.trim()) erros.value.push('Nome do produto é obrigatório.')
  if (ficha.value.length === 0) erros.value.push('Adicione ao menos um material na ficha técnica.')
  if (erros.value.length) return

  const salvo = await produtosStore.salvar({
    id: props.produto?.id,
    ...form,
    ficha: ficha.value,
    impostoIds: impostoIds.value,
  })

  if (!salvo) {
    // O servidor recusou (entrada invalida, material inexistente — guarda V6).
    // Fechar aqui faria o usuario acreditar que salvou.
    erros.value = [produtosStore.erro ?? 'Não foi possível salvar o produto.']
    return
  }

  emit('saved', salvo)
  emit('close')
}

const rotuloProduto = computed(() => segmentoConfig(empresaStore.empresa?.segmento).rotulos.produto)
const titulo = computed(() => `${props.produto ? 'Editar' : 'Novo'} ${rotuloProduto.value}`)
</script>

<template>
  <BaseModal :title="titulo" size="xl" @close="emit('close')">
    <div class="form">
      <!-- Dados básicos -->
      <section class="form__section">
        <h3 class="form__section-title">Dados do Produto</h3>
        <div class="grid-2">
          <div class="field" style="grid-column:1/-1">
            <label class="field__label">Nome *</label>
            <input v-model="form.nome" class="input" placeholder="Ex: Bolo de Cenoura" required />
          </div>
          <div class="field" style="grid-column:1/-1">
            <label class="field__label">Descrição</label>
            <textarea v-model="form.descricao" class="input" rows="2" placeholder="Descrição curta do produto…" />
          </div>
          <div class="field">
            <label class="field__label">Categoria</label>
            <input v-model="form.categoria" class="input" placeholder="Ex: Bolos Clássicos" />
          </div>
          <!-- `ativo` nao e editavel pelo contrato: exibido so na listagem -->
        </div>
      </section>

      <!-- Margens -->
      <section class="form__section">
        <h3 class="form__section-title">Parâmetros de Precificação</h3>
        <div class="grid-2">
          <div class="field">
            <label class="field__label">Margem de Lucro — ML (%)</label>
            <input v-model.number="form.margemLucro" type="number" step="0.5" min="0" max="100" class="input" />
            <p class="field__hint">Alimentação: 25%–40% recomendado</p>
          </div>
          <div class="field">
            <label class="field__label">Desconto Máximo (%)</label>
            <input v-model.number="form.descontoMaximo" type="number" step="0.5" min="0" max="100" class="input" />
            <p class="field__hint">Reserva para promoções sem perder margem</p>
          </div>
        </div>
      </section>

      <!-- Ficha Técnica -->
      <section class="form__section">
        <div class="section-header">
          <h3 class="form__section-title">Ficha Técnica — Insumos</h3>
          <BaseButton size="sm" variant="secondary" @click="addMaterial">+ Insumo</BaseButton>
        </div>

        <div v-if="ficha.length" class="ft-list">
          <div class="ft-list__header">
            <span>Material</span><span>Quantidade</span><span>Unidade</span><span>Custo Unit.</span><span></span>
          </div>
          <div v-for="(pm, idx) in ficha" :key="idx" class="ft-row">
            <select v-model="pm.materialId" class="input input--sm" @change="onMaterialChange(idx, pm.materialId)">
              <option v-for="m in materiaisStore.materiais" :key="m.id" :value="m.id">{{ m.nome }}</option>
            </select>
            <input v-model.number="pm.quantidadeUtilizada" type="number" step="0.001" min="0" class="input input--sm" />
            <span class="ft-unidade">
              {{ materialDe(pm.materialId)?.unidade ?? pm.unidade }}
            </span>
            <span class="ft-custo">
              {{ new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                (materialDe(pm.materialId)?.custoUnitario ?? 0) * pm.quantidadeUtilizada
              ) }}
            </span>
            <button class="ft-remove" @click="removeMaterial(idx)" title="Remover">×</button>
          </div>
        </div>
        <p v-else class="ft-empty">Nenhum insumo adicionado. Clique em "+ Insumo" para começar.</p>
      </section>

      <!-- Impostos -->
      <section class="form__section">
        <div class="section-header">
          <h3 class="form__section-title">Impostos Vinculados</h3>
          <BaseButton size="sm" variant="secondary" @click="addImposto">+ Imposto</BaseButton>
        </div>

        <div v-if="impostoIds.length" class="imp-list">
          <div v-for="(impostoId, idx) in impostoIds" :key="impostoId" class="imp-row">
            <select v-model="impostoIds[idx]" class="input input--sm">
              <option v-for="i in impostosStore.impostos" :key="i.id" :value="i.id">{{ i.nome }}</option>
            </select>
            <!-- Alíquota e do cadastro do imposto, nao um valor por produto -->
            <span class="imp-aliquota">{{ aliquotaDe(impostoId).toFixed(2) }}</span>
            <span class="imp-pct-label">%</span>
            <button class="ft-remove" @click="removeImposto(idx)" title="Remover">×</button>
          </div>
        </div>
        <p v-else class="ft-empty">Nenhum imposto vinculado.</p>
      </section>

      <!-- Erros -->
      <div v-if="erros.length" class="erros">
        <p v-for="e in erros" :key="e">⚠ {{ e }}</p>
      </div>
    </div>

    <template #footer>
      <BaseButton variant="ghost" @click="emit('close')">Cancelar</BaseButton>
      <BaseButton :loading="produtosStore.loading" @click="salvar">
        {{ produto ? 'Salvar Alterações' : 'Criar Produto' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.form { display: flex; flex-direction: column; gap: var(--space-6); }

.form__section {
  display: flex; flex-direction: column; gap: var(--space-4);
  padding-bottom: var(--space-5);
  border-bottom: 1px solid var(--color-border-light);
}
.form__section:last-of-type { border-bottom: none; padding-bottom: 0; }

.form__section-title {
  font-size: .8125rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: .06em;
  color: var(--color-text-muted);
}

.section-header { display: flex; align-items: center; justify-content: space-between; }

.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }

.field { display: flex; flex-direction: column; gap: var(--space-1); }
.field__label { font-size: .8125rem; font-weight: 500; color: var(--color-text-muted); }
.field__hint  { font-size: .72rem; color: var(--color-text-light); }

.input {
  padding: var(--space-2) var(--space-3);
  border: 1.5px solid var(--color-border); border-radius: var(--radius);
  font-size: .875rem; color: var(--color-text);
  outline: none; background: var(--color-surface); font-family: inherit;
  resize: vertical;
}
.input:focus { border-color: var(--color-primary-400); box-shadow: 0 0 0 3px rgba(85,181,89,.15); }
.input--sm { padding: var(--space-1) var(--space-2); font-size: .8125rem; }

.toggle-field { display: flex; align-items: center; gap: var(--space-2); cursor: pointer; font-size: .875rem; margin-top: var(--space-5); }
.toggle-input { width: 16px; height: 16px; accent-color: var(--color-primary-500); }

/* Ficha técnica */
.ft-list { display: flex; flex-direction: column; gap: var(--space-2); }
.ft-list__header {
  display: grid; grid-template-columns: 1fr 100px 70px 90px 28px;
  gap: var(--space-2);
  font-size: .7rem; font-weight: 600; text-transform: uppercase;
  letter-spacing: .05em; color: var(--color-text-light);
  padding: 0 2px;
}
.ft-row {
  display: grid; grid-template-columns: 1fr 100px 70px 90px 28px;
  gap: var(--space-2); align-items: center;
  background: var(--color-bg-subtle); border-radius: var(--radius);
  padding: var(--space-2) var(--space-2);
}
.ft-unidade { font-size: .75rem; color: var(--color-text-muted); text-align: center; }
.ft-custo { font-size: .8125rem; font-weight: 600; color: var(--color-primary-700); }
.ft-remove {
  background: none; border: none; color: var(--color-text-light);
  font-size: 1rem; cursor: pointer; border-radius: var(--radius-sm);
  width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
  transition: background .15s, color .15s;
}
.ft-remove:hover { background: #fee2e2; color: var(--color-danger); }
.ft-empty { font-size: .8125rem; color: var(--color-text-light); padding: var(--space-3) 0; }

/* Impostos */
.imp-list { display: flex; flex-direction: column; gap: var(--space-2); }
.imp-row {
  display: flex; gap: var(--space-2); align-items: center;
  background: var(--color-bg-subtle); border-radius: var(--radius);
  padding: var(--space-2);
}
.imp-row .input:first-child { flex: 1; }
.imp-pct-label { font-size: .8125rem; color: var(--color-text-muted); }

/* Erros */
.imp-aliquota {
  display: inline-block;
  min-width: 90px;
  text-align: right;
  font-weight: 600;
}

.erros {
  background: #fef2f2; border: 1px solid #fca5a5;
  border-radius: var(--radius); padding: var(--space-3) var(--space-4);
  display: flex; flex-direction: column; gap: var(--space-1);
}
.erros p { font-size: .875rem; color: var(--color-danger); }
</style>
