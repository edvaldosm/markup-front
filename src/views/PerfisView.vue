<script setup lang="ts">
import { onMounted } from 'vue'
import { useUsuariosStore } from '@/stores/usuarios'
import { mockPermissoes } from '@/mock/data'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'

const store = useUsuariosStore()
onMounted(() => store.fetchUsuarios())

const moduloColors: Record<string, 'green' | 'blue' | 'orange' | 'purple' | 'red'> = {
  'Produtos': 'green',
  'Materiais': 'blue',
  'Despesas': 'orange',
  'Impostos': 'red',
  'Relatórios': 'purple',
  'Usuários': 'blue',
  'Empresa': 'green',
  'Perfis': 'purple',
}

const modulos = [...new Set(mockPermissoes.map(p => p.modulo))]
</script>

<template>
  <div class="perfis">
    <!-- Perfis -->
    <div class="perfis-grid">
      <div v-for="perfil in store.perfis" :key="perfil.id" class="perfil-card">
        <div class="perfil-card__header">
          <BaseBadge color="purple">{{ perfil.nome }}</BaseBadge>
          <span class="perfil-card__count">{{ perfil.permissoes.length }} permissões</span>
        </div>
        <p class="perfil-card__desc">{{ perfil.descricao }}</p>
        <div class="perfil-card__perms">
          <div
            v-for="perm in perfil.permissoes"
            :key="perm.id"
            class="perm-chip"
            :class="`perm-chip--${perm.chave.endsWith('_WRITE') ? 'write' : 'read'}`"
            :title="perm.descricao"
          >
            {{ perm.chave }}
          </div>
        </div>
      </div>
    </div>

    <!-- Matriz de Permissões -->
    <BaseCard title="Matriz de Permissões RBAC" subtitle="Controle granular por perfil e módulo">
      <div class="matrix-scroll">
        <table class="matrix">
          <thead>
            <tr>
              <th class="matrix__label-col">Permissão</th>
              <th v-for="perfil in store.perfis" :key="perfil.id" class="matrix__perfil-col">
                <BaseBadge color="purple">{{ perfil.nome }}</BaseBadge>
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-for="modulo in modulos" :key="modulo">
              <tr class="matrix__modulo-row">
                <td :colspan="store.perfis.length + 1" class="matrix__modulo-cell">
                  <BaseBadge :color="moduloColors[modulo] ?? 'gray'">{{ modulo }}</BaseBadge>
                </td>
              </tr>
              <tr
                v-for="perm in mockPermissoes.filter(p => p.modulo === modulo)"
                :key="perm.id"
                class="matrix__row"
              >
                <td class="matrix__perm-name">
                  <code>{{ perm.chave }}</code>
                  <span class="matrix__perm-desc">{{ perm.descricao }}</span>
                </td>
                <td
                  v-for="perfil in store.perfis"
                  :key="perfil.id"
                  class="matrix__check-cell"
                >
                  <span
                    v-if="perfil.permissoes.some(p => p.id === perm.id)"
                    class="matrix__check matrix__check--ok"
                  >✓</span>
                  <span v-else class="matrix__check matrix__check--no">—</span>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </BaseCard>
  </div>
</template>

<style scoped>
.perfis { display: flex; flex-direction: column; gap: var(--space-6); }

.perfis-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-4); }

.perfil-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex; flex-direction: column; gap: var(--space-3);
}
.perfil-card__header { display: flex; justify-content: space-between; align-items: center; }
.perfil-card__count { font-size: .75rem; color: var(--color-text-muted); font-weight: 500; }
.perfil-card__desc { font-size: .8125rem; color: var(--color-text-muted); }
.perfil-card__perms { display: flex; flex-wrap: wrap; gap: 4px; }

.perm-chip {
  font-size: .6rem;
  padding: 2px var(--space-2);
  border-radius: 99px;
  font-weight: 600;
  letter-spacing: .03em;
  font-family: monospace;
}
.perm-chip--write { background: #fef3c7; color: #92400e; }
.perm-chip--read  { background: var(--color-primary-50); color: var(--color-primary-700); }

.matrix-scroll { overflow-x: auto; }
.matrix { border-collapse: collapse; font-size: .8125rem; min-width: 600px; width: 100%; }
.matrix__label-col { min-width: 260px; text-align: left; }
.matrix__perfil-col { text-align: center; padding: var(--space-2) var(--space-3); }

.matrix thead tr th {
  padding: var(--space-2) var(--space-3);
  border-bottom: 2px solid var(--color-border-light);
}

.matrix__modulo-row .matrix__modulo-cell {
  padding: var(--space-3) var(--space-3) var(--space-2);
  background: var(--color-bg-subtle);
  border-top: 1px solid var(--color-border-light);
}

.matrix__row:hover td { background: var(--color-primary-50); }
.matrix__perm-name {
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-border-light);
}
.matrix__perm-name code { display: block; font-size: .75rem; color: var(--color-text); font-weight: 600; }
.matrix__perm-name span { display: block; font-size: .7rem; color: var(--color-text-muted); margin-top: 1px; }
.matrix__check-cell { text-align: center; padding: var(--space-2); border-bottom: 1px solid var(--color-border-light); }
.matrix__check { font-size: .9rem; font-weight: 700; }
.matrix__check--ok  { color: var(--color-primary-600); }
.matrix__check--no  { color: var(--color-border); }
</style>
