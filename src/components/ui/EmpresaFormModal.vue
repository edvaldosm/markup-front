<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useEmpresaStore } from '@/stores/empresa'
import { segmentoConfig, SEGMENTOS } from '@/config/segmentos'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import FatorRNote from './FatorRNote.vue'
import IndisponivelBackend from './IndisponivelBackend.vue'
import CurrencyInput from './CurrencyInput.vue'
import type { Empresa, EmpresaEntrada, SegmentoNegocio } from '@/types'

const emit = defineEmits<{ close: []; created: [empresa: Empresa] }>()

const empresaStore = useEmpresaStore()

/** Mesma pendência de `EmpresaView` — ver ali para o motivo completo. */
const MOTIVO_FATOR_R = 'Fator R por empresa ainda não é um campo do contrato — pendência registrada para o backend.'

const form = reactive<EmpresaEntrada>({
  razaoSocial: '',
  cnpj: '',
  segmento: 'CONFEITARIA',
  regimeTributario: 'SIMPLES_NACIONAL',
  anexoCadastrado: 'ANEXO_II',
  faturamentoMedioMensal: 0,
  folhaPagamentoMensal: 0,
})

const salvando = ref(false)
const erros = ref<string[]>([])

const ehServico = computed(() => form.segmento === 'SERVICOS')
const ehSimples = computed(() => form.regimeTributario === 'SIMPLES_NACIONAL')

const segmentos = Object.values(SEGMENTOS)
const regimes = [
  { value: 'MEI', label: 'MEI' },
  { value: 'SIMPLES_NACIONAL', label: 'Simples Nacional' },
  { value: 'LUCRO_PRESUMIDO', label: 'Lucro Presumido' },
  { value: 'LUCRO_REAL', label: 'Lucro Real' },
] as const
const anexos = ['ANEXO_I', 'ANEXO_II', 'ANEXO_III', 'ANEXO_IV', 'ANEXO_V'] as const

// Ao trocar de segmento, sugere o anexo típico
function onSegmento(seg: SegmentoNegocio) {
  form.segmento = seg
  if (ehSimples.value) {
    form.anexoCadastrado = seg === 'SERVICOS' ? 'ANEXO_III' : 'ANEXO_II'
  }
}

async function salvar() {
  erros.value = []
  if (!form.razaoSocial.trim()) erros.value.push('Razão social é obrigatória.')
  if (!form.cnpj?.trim()) erros.value.push('CNPJ é obrigatório.')
  if (form.faturamentoMedioMensal <= 0) erros.value.push('Informe o faturamento médio mensal.')
  if (erros.value.length) return

  salvando.value = true
  // `donoUsuarioId` é definido pelo store a partir do usuário logado (R09)
  const payload: EmpresaEntrada = {
    ...form,
    anexoCadastrado: ehSimples.value ? form.anexoCadastrado : undefined,
    folhaPagamentoMensal: ehServico.value ? form.folhaPagamentoMensal : undefined,
  }
  const nova = await empresaStore.criarEmpresa(payload)
  salvando.value = false
  if (!nova) {
    // O servidor recusou: a mensagem já está no store, a modal fica aberta
    // para o usuário corrigir em vez de fechar como se tivesse salvo.
    erros.value = [empresaStore.erro ?? 'Não foi possível salvar a empresa.']
    return
  }
  emit('created', nova)
  emit('close')
}
</script>

<template>
  <BaseModal title="Nova Empresa" size="lg" @close="emit('close')">
    <div class="form">
      <!-- Segmento -->
      <div class="field">
        <label class="field__label">Segmento de negócio</label>
        <div class="seg-picker">
          <button
            v-for="s in segmentos"
            :key="s.chave"
            type="button"
            class="seg-option"
            :class="{ 'seg-option--active': form.segmento === s.chave }"
            :style="{ '--seg': s.cor, '--seg-suave': s.corSuave }"
            @click="onSegmento(s.chave)"
          >
            <span class="seg-option__icon">{{ s.icone }}</span>
            <span class="seg-option__name">{{ s.nome }}</span>
          </button>
        </div>
        <p class="field__hint">{{ segmentoConfig(form.segmento).descricao }}</p>
      </div>

      <!-- Nota do Fator R — só aparece ao escolher Serviços -->
      <Transition name="note">
        <FatorRNote v-if="ehServico" compact />
      </Transition>

      <div class="grid-2">
        <div class="field" style="grid-column:1/-1">
          <label class="field__label">Razão Social *</label>
          <input v-model="form.razaoSocial" class="input" placeholder="Ex: Minha Empresa LTDA" />
        </div>
        <div class="field">
          <label class="field__label">CNPJ *</label>
          <input v-model="form.cnpj" class="input" placeholder="00.000.000/0000-00" />
        </div>
        <div class="field">
          <label class="field__label">Regime Tributário</label>
          <select v-model="form.regimeTributario" class="input">
            <option v-for="r in regimes" :key="r.value" :value="r.value">{{ r.label }}</option>
          </select>
        </div>
        <div class="field" v-if="ehSimples">
          <label class="field__label">Anexo Simples</label>
          <select v-model="form.anexoCadastrado" class="input">
            <option v-for="a in anexos" :key="a" :value="a">{{ a.replace('_', ' ') }}</option>
          </select>
        </div>
        <CurrencyInput v-model="form.faturamentoMedioMensal" label="Faturamento Médio Mensal (R$) *" />
        <div v-if="ehServico" style="grid-column:1/-1">
          <CurrencyInput v-model="form.folhaPagamentoMensal" label="Folha de Pagamento Mensal (R$)">
            <template #hint>
              <p class="field__hint" v-if="ehSimples">
                <strong>Fator R:</strong> <IndisponivelBackend :motivo="MOTIVO_FATOR_R" />
              </p>
            </template>
          </CurrencyInput>
        </div>
      </div>

      <div v-if="erros.length" class="erros">
        <p v-for="(e, i) in erros" :key="i">⚠ {{ e }}</p>
      </div>
    </div>

    <template #footer>
      <BaseButton variant="secondary" @click="emit('close')">Cancelar</BaseButton>
      <BaseButton :loading="salvando" @click="salvar">Criar Empresa</BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.form { display: flex; flex-direction: column; gap: var(--space-5); }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
@media (max-width: 600px) { .grid-2 { grid-template-columns: 1fr; } }

.field { display: flex; flex-direction: column; gap: var(--space-1); }
.field__label { font-size: .8125rem; font-weight: 500; color: var(--color-text-muted); }
.field__hint { font-size: .75rem; color: var(--color-text-light); }
.input {
  padding: var(--space-2) var(--space-3);
  border: 1.5px solid var(--color-border); border-radius: var(--radius);
  font-size: .9rem; color: var(--color-text);
  outline: none; background: var(--color-surface); font-family: inherit;
}
.input:focus { border-color: var(--color-primary-400); box-shadow: 0 0 0 3px rgba(85,181,89,.15); }

.seg-picker { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-3); }
@media (max-width: 600px) { .seg-picker { grid-template-columns: 1fr; } }
.seg-option {
  display: flex; flex-direction: column; align-items: center; gap: var(--space-2);
  padding: var(--space-4) var(--space-2);
  border: 1.5px solid var(--color-border); border-radius: var(--radius-lg);
  background: var(--color-surface); cursor: pointer;
  transition: border-color .15s, background .15s;
}
.seg-option:hover { border-color: var(--seg); }
.seg-option--active { border-color: var(--seg); background: var(--seg-suave); }
.seg-option__icon { font-size: 1.75rem; line-height: 1; }
.seg-option__name { font-size: .85rem; font-weight: 600; color: var(--color-text); }

.erros {
  background: #fef2f2; border: 1px solid #fca5a5; border-radius: var(--radius);
  padding: var(--space-3) var(--space-4);
}
.erros p { font-size: .8125rem; color: #b91c1c; }

.note-enter-active, .note-leave-active { transition: opacity .2s ease, transform .2s ease; }
.note-enter-from, .note-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
