<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useEmpresaStore } from '@/stores/empresa'
import { segmentoConfig } from '@/config/segmentos'

defineProps<{ open: boolean }>()
defineEmits<{ toggle: [] }>()

const route = useRoute()
const auth = useAuthStore()
const empresaStore = useEmpresaStore()
const segConfig = computed(() => segmentoConfig(empresaStore.empresa?.segmento))

const navGroups = [
  {
    label: 'Principal',
    items: [
      { name: 'Dashboard', to: '/dashboard', icon: '◎' },
      { name: 'Precificação', to: '/precificacao', icon: '◈' },
    ]
  },
  {
    label: 'Cadastros',
    items: [
      { name: 'Produtos', to: '/produtos', icon: '⬡' },
      { name: 'Materiais', to: '/materiais', icon: '◇' },
      { name: 'Despesas Fixas', to: '/despesas', icon: '◻' },
      { name: 'Impostos', to: '/impostos', icon: '◈' },
    ]
  },
  {
    label: 'Análise',
    items: [
      { name: 'Fator R', to: '/fator-r', icon: '🧮' },
      { name: 'Relatórios', to: '/relatorios', icon: '▤' },
    ]
  },
  {
    label: 'Configurações',
    items: [
      { name: 'Empresa', to: '/empresa', icon: '⬡' },
      { name: 'Usuários', to: '/usuarios', icon: '◎' },
      { name: 'Perfis & RBAC', to: '/perfis', icon: '◈' },
    ]
  },
]

const isActive = (to: string) => route.path === to || route.path.startsWith(to + '/')
</script>

<template>
  <aside class="sidebar" :class="{ 'sidebar--collapsed': !open }">
    <!-- Brand -->
    <div class="sidebar__brand">
      <div class="brand-logo" :style="{ background: `linear-gradient(135deg, ${segConfig.gradiente[0]}, ${segConfig.gradiente[1]})` }">
        <span class="brand-logo__mark">{{ segConfig.icone }}</span>
      </div>
      <Transition name="fade">
        <div v-if="open" class="brand-text">
          <span class="brand-text__name">Markup</span>
          <span class="brand-text__tagline">{{ segConfig.nome }}</span>
        </div>
      </Transition>
    </div>

    <!-- Nav -->
    <nav class="sidebar__nav">
      <div v-for="group in navGroups" :key="group.label" class="nav-group">
        <Transition name="fade">
          <p v-if="open" class="nav-group__label">{{ group.label }}</p>
        </Transition>
        <RouterLink
          v-for="item in group.items"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          :class="{ 'nav-item--active': isActive(item.to) }"
        >
          <span class="nav-item__icon">{{ item.icon }}</span>
          <Transition name="fade">
            <span v-if="open" class="nav-item__label">{{ item.name }}</span>
          </Transition>
        </RouterLink>
      </div>
    </nav>

    <!-- User footer -->
    <div class="sidebar__footer">
      <div class="user-chip">
        <div class="user-chip__avatar">{{ auth.user?.nome.charAt(0) }}</div>
        <Transition name="fade">
          <div v-if="open" class="user-chip__info">
            <span class="user-chip__name">{{ auth.user?.nome }}</span>
            <span class="user-chip__role">{{ auth.user?.perfil.nome }}</span>
          </div>
        </Transition>
      </div>
      <Transition name="fade">
        <button v-if="open" class="sidebar__logout" @click="auth.logout()" title="Sair">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
        </button>
      </Transition>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  position: fixed;
  top: 0; left: 0; bottom: 0;
  width: var(--sidebar-width);
  background: var(--color-primary-900);
  display: flex;
  flex-direction: column;
  transition: width .25s ease;
  z-index: 100;
  overflow: hidden;
}
.sidebar--collapsed { width: 64px; }

/* Brand */
.sidebar__brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-5) var(--space-4);
  border-bottom: 1px solid rgba(255,255,255,.08);
  min-height: var(--header-height);
}

.brand-logo {
  width: 36px; height: 36px;
  background: linear-gradient(135deg, var(--color-primary-400), var(--color-primary-600));
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.brand-logo__mark {
  font-size: 1.1rem;
  font-weight: 800;
  color: #fff;
  font-family: var(--font-sans);
}

.brand-text__name {
  display: block;
  font-size: .9375rem;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
}
.brand-text__tagline {
  display: block;
  font-size: .6875rem;
  color: var(--color-primary-300);
  text-transform: uppercase;
  letter-spacing: .08em;
  white-space: nowrap;
}

/* Nav */
.sidebar__nav {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4) var(--space-2);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.nav-group { display: flex; flex-direction: column; gap: 2px; margin-bottom: var(--space-3); }

.nav-group__label {
  font-size: .65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .1em;
  color: var(--color-primary-400);
  padding: var(--space-2) var(--space-3) var(--space-1);
  white-space: nowrap;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius);
  color: var(--color-primary-200);
  font-size: .875rem;
  font-weight: 500;
  transition: background .15s, color .15s;
  white-space: nowrap;
}
.nav-item:hover { background: rgba(255,255,255,.07); color: #fff; }
.nav-item--active { background: rgba(255,255,255,.12); color: #fff; }
.nav-item--active .nav-item__icon { color: var(--color-primary-300); }

.nav-item__icon { font-size: 1rem; flex-shrink: 0; width: 20px; text-align: center; }
.nav-item__label { overflow: hidden; }

/* Footer */
.sidebar__footer {
  padding: var(--space-3) var(--space-3);
  border-top: 1px solid rgba(255,255,255,.08);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.user-chip {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 1;
  min-width: 0;
}

.user-chip__avatar {
  width: 32px; height: 32px;
  background: linear-gradient(135deg, var(--color-primary-400), var(--color-primary-600));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .8125rem;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.user-chip__name {
  display: block;
  font-size: .8125rem;
  font-weight: 500;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.user-chip__role {
  display: block;
  font-size: .6875rem;
  color: var(--color-primary-300);
  white-space: nowrap;
}

.sidebar__logout {
  background: none;
  border: none;
  color: var(--color-primary-300);
  display: flex;
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  transition: background .15s, color .15s;
  flex-shrink: 0;
}
.sidebar__logout:hover { background: rgba(255,255,255,.1); color: #fff; }
</style>
