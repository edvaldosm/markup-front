<script setup lang="ts">
/**
 * Cadastro e edição de usuário — reaproveitado pelos dois consumidores
 * (por-empresa em `UsuariosView.vue`, global em `AdminUsuariosView.vue`) via
 * `modoGlobal`. Mesmo padrão estrutural de `ProdutoFormModal`/`EmpresaFormModal`:
 * `entidade` ausente = criar, `watch(immediate)` popula em modo editar.
 *
 * O fluxo de senha provisória (exibida uma única vez, com aviso e botão
 * copiar) só existe no modo criar — editar não tem segredo a mostrar, então
 * `salvar()` fecha direto ao suceder (REQ-06/08/10).
 */
import { reactive, ref, computed, watch } from 'vue'
import { useUsuariosStore } from '@/stores/usuarios'
import { useAdminStore } from '@/stores/admin'
import { formatarCpf, validarCpf } from '@/composables/useCpf'
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'
import type { Perfil, Usuario } from '@/types'

const props = defineProps<{
  entidade?: Usuario   // undefined = cadastrar; presente = editar
  perfis: Perfil[]
  /** Convite/edição de escopo global (Gestão do Site) em vez de por-empresa */
  modoGlobal?: boolean
}>()

const emit = defineEmits<{ close: []; salvo: [usuario: Usuario] }>()

const usuariosStore = useUsuariosStore()
const adminStore = useAdminStore()

const ehEdicao = computed(() => !!props.entidade)

/** Só perfis de escopo global no modo global — o servidor recusaria qualquer outro. */
const perfisDisponiveis = computed(() =>
  props.modoGlobal ? props.perfis.filter(p => p.escopoGlobal) : props.perfis,
)

const salvando = computed(() => (props.modoGlobal ? adminStore.loading : usuariosStore.loading))

const form = reactive({
  nome: '',
  cpf: '',
  dataNascimento: '',
  email: '',
  perfilId: '',
})

// Senha provisória (só modo criar) e erros do formulário — declarados antes do
// `watch(immediate: true)` abaixo, que os usa já na primeira execução (síncrona).
const senhaProvisoria = ref<string | null>(null)
const copiada = ref(false)
const erros = ref<string[]>([])

// Popular ao editar — mesmo padrão de ProdutoFormModal/EmpresaFormModal
watch(() => props.entidade, (u) => {
  senhaProvisoria.value = null
  copiada.value = false
  erros.value = []
  if (u) {
    form.nome = u.nome
    form.cpf = formatarCpf(u.cpf)
    // `dataNascimento` chega ISO (`DateTime`); o input date quer só a data
    form.dataNascimento = u.dataNascimento.slice(0, 10)
    form.email = u.email
    form.perfilId = ''
  } else {
    form.nome = ''
    form.cpf = ''
    form.dataNascimento = ''
    form.email = ''
    form.perfilId = perfisDisponiveis.value[0]?.id ?? ''
  }
}, { immediate: true })

function onCpfInput(evento: Event) {
  form.cpf = formatarCpf((evento.target as HTMLInputElement).value)
}

const hojeISO = new Date().toISOString().slice(0, 10)
const cpfValido = computed(() => validarCpf(form.cpf))
const dataValida = computed(() => !!form.dataNascimento && form.dataNascimento <= hojeISO)

// ── Senha provisória (só modo criar) ────────────────────────────────────────

async function copiarSenha() {
  if (!senhaProvisoria.value) return
  try {
    await navigator.clipboard.writeText(senhaProvisoria.value)
    copiada.value = true
  } catch {
    // Sem permissão de área de transferência: a senha continua visível na tela
    copiada.value = false
  }
}

function concluir() {
  emit('close')
}

// ── Salvar ──────────────────────────────────────────────────────────────────

async function salvar() {
  erros.value = []
  if (!form.nome.trim()) erros.value.push('Nome é obrigatório.')
  if (!cpfValido.value) erros.value.push('CPF inválido — confira os números digitados.')
  if (!dataValida.value) erros.value.push('Data de nascimento é obrigatória e não pode ser no futuro.')
  if (!form.email.trim()) erros.value.push('E-mail é obrigatório.')
  if (!ehEdicao.value && !form.perfilId) erros.value.push('Selecione um perfil.')
  if (erros.value.length) return

  if (ehEdicao.value) {
    const alvo = props.entidade!
    const salvo = props.modoGlobal
      ? await adminStore.atualizarUsuarioAdmin(alvo.id, form.nome, form.cpf, form.dataNascimento, form.email)
      : await usuariosStore.atualizar(alvo.id, form.nome, form.cpf, form.dataNascimento, form.email)

    if (!salvo) {
      // O servidor recusou (CPF/e-mail duplicado, sem autorização...) — a modal
      // fica aberta com a mensagem, nunca fecha como se tivesse salvo (REQ-10).
      erros.value = [(props.modoGlobal ? adminStore.erro : usuariosStore.erro) ?? 'Não foi possível salvar o usuário.']
      return
    }
    emit('salvo', salvo)
    emit('close')
    return
  }

  const convidado = props.modoGlobal
    ? await adminStore.convidarGlobal(form.nome, form.email, form.cpf, form.dataNascimento, form.perfilId)
    : await usuariosStore.convidar(form.nome, form.email, form.cpf, form.dataNascimento, form.perfilId)

  if (!convidado) {
    erros.value = [(props.modoGlobal ? adminStore.erro : usuariosStore.erro) ?? 'Não foi possível cadastrar o usuário.']
    return
  }
  senhaProvisoria.value = convidado.senhaProvisoria
  emit('salvo', convidado.usuario)
}

const titulo = computed(() => {
  if (ehEdicao.value) return 'Editar Usuário'
  return props.modoGlobal ? 'Cadastrar Usuário Global' : 'Cadastrar Usuário'
})
</script>

<template>
  <BaseModal :title="titulo" size="md" @close="emit('close')">
    <!-- Depois do cadastro: a senha, uma única vez -->
    <div v-if="senhaProvisoria" class="senha-box">
      <p class="senha-box__aviso">
        ⚠ Esta senha aparece <strong>uma única vez</strong>. Ela não é recuperável
        depois — copie e entregue a {{ form.nome || 'quem foi cadastrado' }} agora.
      </p>
      <div class="senha-box__valor">
        <code>{{ senhaProvisoria }}</code>
        <BaseButton size="sm" variant="secondary" @click="copiarSenha">
          {{ copiada ? 'Copiado ✓' : 'Copiar' }}
        </BaseButton>
      </div>
    </div>

    <form v-else class="form" @submit.prevent="salvar">
      <div class="field">
        <label class="field__label">Nome Completo *</label>
        <input v-model="form.nome" class="input" required />
      </div>

      <div class="grid-2">
        <div class="field">
          <label class="field__label">CPF *</label>
          <input
            :value="form.cpf"
            class="input"
            placeholder="000.000.000-00"
            inputmode="numeric"
            maxlength="14"
            @input="onCpfInput"
          />
          <p v-if="form.cpf && !cpfValido" class="field__hint field__hint--erro">CPF inválido.</p>
        </div>
        <div class="field">
          <label class="field__label">Data de Nascimento *</label>
          <input v-model="form.dataNascimento" type="date" class="input" :max="hojeISO" />
        </div>
      </div>

      <div class="field">
        <label class="field__label">E-mail *</label>
        <input v-model="form.email" type="email" class="input" required />
      </div>

      <div v-if="!ehEdicao" class="field">
        <label class="field__label">{{ modoGlobal ? 'Perfil (escopo global)' : 'Perfil de Acesso' }}</label>
        <select v-model="form.perfilId" class="input">
          <option v-for="p in perfisDisponiveis" :key="p.id" :value="p.id">{{ p.nome }}</option>
        </select>
        <p v-if="!perfisDisponiveis.length" class="field__hint field__hint--erro">
          Nenhum perfil disponível — não há como cadastrar.
        </p>
      </div>

      <div v-if="erros.length" class="erros">
        <p v-for="e in erros" :key="e">⚠ {{ e }}</p>
      </div>
    </form>

    <template #footer>
      <BaseButton v-if="senhaProvisoria" @click="concluir">Concluir</BaseButton>
      <template v-else>
        <BaseButton variant="ghost" @click="emit('close')">Cancelar</BaseButton>
        <BaseButton
          :loading="salvando"
          :disabled="!ehEdicao && !perfisDisponiveis.length"
          @click="salvar"
        >
          {{ ehEdicao ? 'Salvar Alterações' : 'Cadastrar' }}
        </BaseButton>
      </template>
    </template>
  </BaseModal>
</template>

<style scoped>
.form { display: flex; flex-direction: column; gap: var(--space-4); }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
@media (max-width: 480px) { .grid-2 { grid-template-columns: 1fr; } }

.field { display: flex; flex-direction: column; gap: var(--space-1); }
.field__label { font-size: .8125rem; font-weight: 500; color: var(--color-text-muted); }
.field__hint { font-size: .75rem; color: var(--color-text-light); }
.field__hint--erro { color: var(--color-danger); }

.input {
  padding: var(--space-2) var(--space-3);
  border: 1.5px solid var(--color-border); border-radius: var(--radius);
  font-size: .9rem; color: var(--color-text);
  outline: none; background: var(--color-surface); font-family: inherit;
}
.input:focus { border-color: var(--color-primary-400); box-shadow: 0 0 0 3px rgba(85,181,89,.15); }

.erros {
  background: #fef2f2; border: 1px solid #fca5a5; border-radius: var(--radius);
  padding: var(--space-3) var(--space-4);
}
.erros p { font-size: .8125rem; color: var(--color-danger); }

/* Senha provisória: destaque suficiente para ninguém fechar sem copiar */
.senha-box { display: flex; flex-direction: column; gap: var(--space-4); }
.senha-box__aviso {
  background: #fffbeb;
  border: 1px solid #fcd34d;
  color: #92400e;
  border-radius: var(--radius);
  padding: var(--space-3) var(--space-4);
  font-size: .875rem;
  line-height: 1.5;
}
.senha-box__valor {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  padding: var(--space-3) var(--space-4);
}
.senha-box__valor code {
  flex: 1;
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: .05em;
}
</style>
