<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useUsuariosStore } from '@/stores/usuarios'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'

const store = useUsuariosStore()

onMounted(() => store.fetchUsuarios())

/**
 * Cadastro e por **convite** — nao existe criacao direta no contrato, nem edicao
 * de usuario por aqui. O convite devolve uma senha provisoria que o servidor
 * **nao devolve de novo**: por isso ela vive num estado proprio, exibida uma
 * unica vez, com o aviso antes de haver como perde-la.
 */
const showModal = ref(false)
const convite = reactive({ nome: '', email: '', perfilId: '' })
const senhaProvisoria = ref<string | null>(null)
const copiada = ref(false)

function novoConvite() {
  convite.nome = ''
  convite.email = ''
  convite.perfilId = store.perfis[0]?.id ?? ''
  senhaProvisoria.value = null
  copiada.value = false
  showModal.value = true
}

async function enviarConvite() {
  const convidado = await store.convidar(convite.nome, convite.email, convite.perfilId)
  // Erro mantem a modal aberta: a mensagem esta no store
  if (convidado) senhaProvisoria.value = convidado.senhaProvisoria
}

async function copiarSenha() {
  if (!senhaProvisoria.value) return
  try {
    await navigator.clipboard.writeText(senhaProvisoria.value)
    copiada.value = true
  } catch {
    // Sem permissao de area de transferencia: a senha continua visivel na tela
    copiada.value = false
  }
}

function fecharModal() {
  // A senha some junto com a modal — nao ha de onde exibi-la outra vez
  showModal.value = false
  senhaProvisoria.value = null
}

function inicialAvatar(nome: string) {
  return nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}
</script>

<template>
  <div class="usuarios">
    <div class="toolbar">
      <h2 class="section-title">Usuários do Sistema</h2>
      <BaseButton @click="novoConvite">+ Convidar Usuário</BaseButton>
    </div>

    <p v-if="store.erro" class="aviso aviso--erro">
      {{ store.erro }}
      <button class="aviso__acao" @click="store.fetchUsuarios()">Tentar de novo</button>
    </p>

    <div class="usuarios-grid">
      <div v-for="u in store.usuarios" :key="u.id" class="user-card" :class="{ 'user-card--inativo': !u.ativo }">
        <div class="user-card__avatar">{{ inicialAvatar(u.nome) }}</div>
        <div class="user-card__info">
          <span class="user-card__nome">{{ u.nome }}</span>
          <span class="user-card__email">{{ u.email }}</span>
          <div class="user-card__tags">
            <BaseBadge v-for="emp in u.empresas" :key="emp.perfilId" color="green">
              {{ emp.perfil?.nome ?? emp.perfilId }}
            </BaseBadge>
            <BaseBadge :color="u.ativo ? 'green' : 'gray'">{{ u.ativo ? 'Ativo' : 'Inativo' }}</BaseBadge>
          </div>
        </div>
        <!-- Sem acao de edicao: o contrato nao tem mutation de usuario -->
      </div>
    </div>

    <!-- Tabela permissões por perfil -->
    <BaseCard title="Visão Geral — Permissões por Perfil">
      <table class="table">
        <thead>
          <tr>
            <th>Perfil</th>
            <th>Usuários</th>
            <th>Permissões</th>
            <th>Descrição</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="perfil in store.perfis" :key="perfil.id">
            <td><BaseBadge color="purple">{{ perfil.nome }}</BaseBadge></td>
            <td>{{ store.usuarios.filter(u => u.empresas.some(e => e.perfilId === perfil.id)).length }}</td>
            <td>
              <div class="perms-wrap">
                <BaseBadge v-for="p in perfil.permissoes.slice(0,4)" :key="p.id" color="gray">{{ p.chave }}</BaseBadge>
                <span v-if="perfil.permissoes.length > 4" class="perms-more">+{{ perfil.permissoes.length - 4 }}</span>
              </div>
            </td>
            <td class="td-muted">{{ perfil.descricao }}</td>
          </tr>
        </tbody>
      </table>
    </BaseCard>

    <!-- Convite -->
    <BaseModal v-if="showModal" title="Convidar Usuário" @close="fecharModal">
      <!-- Depois do convite: a senha, uma unica vez -->
      <div v-if="senhaProvisoria" class="senha-box">
        <p class="senha-box__aviso">
          ⚠ Esta senha aparece <strong>uma única vez</strong>. Ela não é recuperável
          depois — copie e entregue a {{ convite.nome || 'quem foi convidado' }} agora.
        </p>
        <div class="senha-box__valor">
          <code>{{ senhaProvisoria }}</code>
          <BaseButton size="sm" variant="secondary" @click="copiarSenha">
            {{ copiada ? 'Copiado ✓' : 'Copiar' }}
          </BaseButton>
        </div>
      </div>

      <form v-else class="form-grid" @submit.prevent="enviarConvite">
        <div class="field" style="grid-column: 1/-1">
          <label class="field__label">Nome Completo</label>
          <input v-model="convite.nome" class="input" required />
        </div>
        <div class="field" style="grid-column: 1/-1">
          <label class="field__label">E-mail</label>
          <input v-model="convite.email" type="email" class="input" required />
        </div>
        <div class="field" style="grid-column: 1/-1">
          <label class="field__label">Perfil de Acesso</label>
          <select v-model="convite.perfilId" class="input">
            <option v-for="p in store.perfis" :key="p.id" :value="p.id">{{ p.nome }}</option>
          </select>
        </div>
        <p v-if="store.erro" class="aviso aviso--erro" style="grid-column: 1/-1">{{ store.erro }}</p>
      </form>

      <template #footer>
        <BaseButton v-if="senhaProvisoria" @click="fecharModal">Concluir</BaseButton>
        <template v-else>
          <BaseButton variant="ghost" @click="fecharModal">Cancelar</BaseButton>
          <BaseButton :loading="store.loading" @click="enviarConvite">Convidar</BaseButton>
        </template>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.usuarios { display: flex; flex-direction: column; gap: var(--space-5); }

.aviso {
  border-radius: var(--radius);
  padding: var(--space-3) var(--space-4);
  font-size: .875rem;
}
.aviso--erro { background: #fef2f2; border: 1px solid #fca5a5; color: var(--color-danger); }
.aviso__acao {
  margin-left: var(--space-3);
  background: none;
  border: 1px solid currentColor;
  color: inherit;
  border-radius: var(--radius);
  padding: 0 var(--space-2);
  cursor: pointer;
}

/* Senha provisoria: destaque suficiente para ninguem fechar sem copiar */
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
.toolbar { display: flex; align-items: center; justify-content: space-between; }
.section-title { font-size: 1rem; font-weight: 600; color: var(--color-text); }

.usuarios-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: var(--space-4); }
.user-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  transition: box-shadow .2s;
}
.user-card:hover { box-shadow: var(--shadow-sm); }
.user-card--inativo { opacity: .6; }

.user-card__avatar {
  width: 44px; height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary-300), var(--color-primary-600));
  display: flex; align-items: center; justify-content: center;
  font-size: .9rem; font-weight: 700; color: #fff;
  flex-shrink: 0;
}
.user-card__info { flex: 1; display: flex; flex-direction: column; gap: var(--space-1); min-width: 0; }
.user-card__nome { font-size: .9375rem; font-weight: 600; color: var(--color-text); }
.user-card__email { font-size: .8125rem; color: var(--color-text-muted); }
.user-card__tags { display: flex; gap: var(--space-1); flex-wrap: wrap; margin-top: var(--space-1); }
.user-card__actions { flex-shrink: 0; }

.table { width: 100%; border-collapse: collapse; font-size: .875rem; }
.table th { text-align: left; padding: var(--space-2) var(--space-3); font-size: .75rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: var(--color-text-muted); border-bottom: 1px solid var(--color-border-light); }
.table td { padding: var(--space-3); border-bottom: 1px solid var(--color-border-light); vertical-align: top; }
.td-muted { color: var(--color-text-muted); font-size: .8125rem; }
.perms-wrap { display: flex; gap: 4px; flex-wrap: wrap; }
.perms-more { font-size: .7rem; color: var(--color-text-muted); align-self: center; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
.field { display: flex; flex-direction: column; gap: var(--space-1); }
.field__label { font-size: .8125rem; font-weight: 500; color: var(--color-text-muted); }
.input { padding: var(--space-2) var(--space-3); border: 1.5px solid var(--color-border); border-radius: var(--radius); font-size: .9rem; color: var(--color-text); outline: none; background: var(--color-surface); font-family: inherit; }
.input:focus { border-color: var(--color-primary-400); box-shadow: 0 0 0 3px rgba(85,181,89,.15); }
.toggle-field { display: flex; align-items: center; gap: var(--space-2); cursor: pointer; font-size: .875rem; }
.toggle-input { width: 16px; height: 16px; accent-color: var(--color-primary-500); }
</style>
