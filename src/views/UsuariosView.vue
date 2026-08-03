<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUsuariosStore } from '@/stores/usuarios'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import type { Usuario } from '@/types'

const store = useUsuariosStore()

onMounted(() => store.fetchUsuarios())

const showModal = ref(false)
const editando = ref<Partial<Usuario>>({})

function novo() {
  editando.value = { nome: '', email: '', ativo: true, empresas: [] }
  showModal.value = true
}

function editar(u: Usuario) {
  editando.value = { ...u }
  showModal.value = true
}

async function salvar() {
  await store.salvarUsuario(editando.value as Usuario)
  showModal.value = false
}

function inicialAvatar(nome: string) {
  return nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}
</script>

<template>
  <div class="usuarios">
    <div class="toolbar">
      <h2 class="section-title">Usuários do Sistema</h2>
      <BaseButton @click="novo">+ Novo Usuário</BaseButton>
    </div>

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
        <div class="user-card__actions">
          <BaseButton size="sm" variant="ghost" @click="editar(u)">Editar</BaseButton>
        </div>
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

    <!-- Modal -->
    <BaseModal v-if="showModal" :title="editando.id ? 'Editar Usuário' : 'Novo Usuário'" @close="showModal = false">
      <form class="form-grid" @submit.prevent="salvar">
        <div class="field" style="grid-column: 1/-1">
          <label class="field__label">Nome Completo</label>
          <input v-model="editando.nome" class="input" required />
        </div>
        <div class="field" style="grid-column: 1/-1">
          <label class="field__label">E-mail</label>
          <input v-model="editando.email" type="email" class="input" required />
        </div>
        <div class="field">
          <label class="field__label">Perfil de Acesso</label>
          <select class="input" :value="editando.empresas?.[0]?.perfilId" @change="e => { if(editando.empresas?.[0]) editando.empresas[0].perfilId = (e.target as HTMLSelectElement).value }">
            <option v-for="p in store.perfis" :key="p.id" :value="p.id">{{ p.nome }}</option>
          </select>
        </div>
        <div class="field">
          <label class="toggle-field">
            <input v-model="editando.ativo" type="checkbox" class="toggle-input" />
            <span>Usuário ativo</span>
          </label>
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
.usuarios { display: flex; flex-direction: column; gap: var(--space-5); }
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
