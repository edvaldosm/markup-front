<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUsuariosStore } from '@/stores/usuarios'
import { useAuthStore } from '@/stores/auth'
import { useEmpresaStore } from '@/stores/empresa'
import { souDonoDaEmpresa } from '@/auth/autorizacao'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import UsuarioFormModal from '@/components/ui/UsuarioFormModal.vue'
import type { Usuario } from '@/types'

const store = useUsuariosStore()
const auth = useAuthStore()
const empresaStore = useEmpresaStore()

onMounted(() => store.fetchUsuarios())

/**
 * Cadastro e edição restritos ao **dono da empresa** (REQ-03/04) ou a quem tem
 * escopo global — `USUARIO_WRITE` sozinho deixou de bastar para **mostrar** a
 * ação: qualquer PROPRIETARIO vinculado tem a permissão RBAC, mas só o dono
 * (`Empresa.donoUsuarioId`) ou o ADMIN global chegam ao formulário. Se o
 * servidor recusar mesmo assim (dado desatualizado no cliente), a tela trata
 * como qualquer erro de mutation — `UsuarioFormModal` cuida disso.
 */
const podeCadastrar = computed(() =>
  souDonoDaEmpresa(auth.user, empresaStore.empresa) || auth.adminGlobal,
)

const showModal = ref(false)
const usuarioEditando = ref<Usuario | undefined>(undefined)

function novoCadastro() {
  usuarioEditando.value = undefined
  showModal.value = true
}

function editar(usuario: Usuario) {
  usuarioEditando.value = usuario
  showModal.value = true
}

function fecharModal() {
  showModal.value = false
  usuarioEditando.value = undefined
}

function inicialAvatar(nome: string) {
  return nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}
</script>

<template>
  <div class="usuarios">
    <div class="toolbar">
      <h2 class="section-title">Usuários do Sistema</h2>
      <BaseButton v-if="podeCadastrar" @click="novoCadastro">+ Cadastrar Usuário</BaseButton>
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
            <BaseBadge v-for="emp in u.empresas" :key="emp.perfil.id" color="green">
              {{ emp.perfil.nome }}
            </BaseBadge>
            <BaseBadge :color="u.ativo ? 'green' : 'gray'">{{ u.ativo ? 'Ativo' : 'Inativo' }}</BaseBadge>
          </div>
        </div>
        <div v-if="podeCadastrar" class="user-card__actions">
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
            <td>{{ store.usuarios.filter(u => u.empresas.some(e => e.perfil.id === perfil.id)).length }}</td>
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

    <!--
      Cadastro / edição. Só `@close` fecha a modal: em modo criar, `@salvo`
      dispara antes da tela de senha provisória (REQ-06) — fechar nesse
      momento faria o usuário nunca ver a senha.
    -->
    <UsuarioFormModal
      v-if="showModal"
      :entidade="usuarioEditando"
      :perfis="store.perfis"
      @close="fecharModal"
    />
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
</style>
