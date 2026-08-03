<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useEmpresaStore } from '@/stores/empresa'
import { segmentoConfig } from '@/config/segmentos'
import type { PermissaoChave } from '@/types'

defineProps<{ open: boolean; mobileOpen?: boolean }>()
defineEmits<{ toggle: [] }>()

const route = useRoute()
const auth = useAuthStore()
const empresaStore = useEmpresaStore()
const segConfig = computed(() => segmentoConfig(empresaStore.empresa?.segmento))

/** Estamos no módulo de Gestão do Site? Muda a marca e o tema (FR10) */
const emAdmin = computed(() => route.path.startsWith('/admin'))

/** Marca exibida no topo: o segmento da empresa ativa, ou a área do gestor */
const brand = computed(() =>
  emAdmin.value
    ? { icone: '⚙', nome: 'Gestão do Site', gradiente: ['var(--color-neutral-500)', 'var(--color-neutral-700)'] }
    : { icone: segConfig.value.icone, nome: segConfig.value.nome, gradiente: segConfig.value.gradiente }
)

/**
 * `permissao` espelha o `meta.permissao` da rota — item sem ela é sempre visível.
 * `soAdminGlobal` espelha o `meta.adminGlobal`: escopo, não permissão (R09/FR10).
 */
const navGroups: {
  label: string
  soAdminGlobal?: boolean
  items: { name: string; to: string; icon: string; permissao?: PermissaoChave; exata?: boolean }[]
}[] = [
  {
    label: 'Principal',
    items: [
      { name: 'Dashboard', to: '/dashboard', icon: '◎' },
      { name: 'Precificação', to: '/precificacao', icon: '◈', permissao: 'PRODUTO_READ' },
    ]
  },
  {
    label: 'Cadastros',
    items: [
      { name: 'Produtos', to: '/produtos', icon: '⬡', permissao: 'PRODUTO_READ' },
      { name: 'Materiais', to: '/materiais', icon: '◇', permissao: 'MATERIAL_READ' },
      { name: 'Despesas Fixas', to: '/despesas', icon: '◻', permissao: 'DESPESA_READ' },
      { name: 'Impostos', to: '/impostos', icon: '◈', permissao: 'IMPOSTO_READ' },
    ]
  },
  {
    label: 'Análise',
    items: [
      { name: 'Fator R', to: '/fator-r', icon: '🧮', permissao: 'EMPRESA_READ' },
      { name: 'Relatórios', to: '/relatorios', icon: '▤', permissao: 'RELATORIO_READ' },
    ]
  },
  {
    label: 'Configurações',
    items: [
      { name: 'Empresa', to: '/empresa', icon: '⬡', permissao: 'EMPRESA_READ' },
      { name: 'Usuários', to: '/usuarios', icon: '◎', permissao: 'USUARIO_READ' },
      { name: 'Perfis & RBAC', to: '/perfis', icon: '◈', permissao: 'PERFIL_READ' },
    ]
  },
  {
    label: 'Gestão do Site',
    soAdminGlobal: true,
    items: [
      { name: 'Visão Geral', to: '/admin', icon: '▦', exata: true },
      { name: 'Empresas', to: '/admin/empresas', icon: '▣' },
      { name: 'Usuários Globais', to: '/admin/usuarios', icon: '◍' },
    ]
  },
]

/** Só os grupos/itens que o perfil do usuário pode acessar (grupo vazio some) */
const navVisivel = computed(() =>
  navGroups
    .filter(g => !g.soAdminGlobal || auth.adminGlobal)
    .map(g => ({ ...g, items: g.items.filter(i => !i.permissao || auth.hasPermissao(i.permissao)) }))
    .filter(g => g.items.length > 0)
)

/** `exata` evita que `/admin` fique aceso enquanto se navega em `/admin/…` */
const isActive = (to: string, exata = false) =>
  exata ? route.path === to : route.path === to || route.path.startsWith(to + '/')
</script>

<template>
  <aside class="sidebar" :class="{ 'sidebar--collapsed': !open, 'sidebar--drawer-open': mobileOpen }">
    <!-- Brand -->
    <div class="sidebar__brand">
      <div class="brand-logo" :style="{ background: `linear-gradient(135deg, ${brand.gradiente[0]}, ${brand.gradiente[1]})` }">
        <span class="brand-logo__mark">{{ brand.icone }}</span>
      </div>
      <Transition name="fade">
        <div v-if="open" class="brand-text">
          <span class="brand-text__name">Markup</span>
          <span class="brand-text__tagline">{{ brand.nome }}</span>
        </div>
      </Transition>
    </div>

    <!-- Nav -->
    <nav class="sidebar__nav">
      <div v-for="group in navVisivel" :key="group.label" class="nav-group">
        <Transition name="fade">
          <p v-if="open" class="nav-group__label">{{ group.label }}</p>
        </Transition>
        <RouterLink
          v-for="item in group.items"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          :class="{ 'nav-item--active': isActive(item.to, item.exata) }"
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
            <span class="user-chip__role">{{ auth.perfil?.nome }}</span>
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

/* ─── Mobile: drawer off-canvas ──────────────────────────────────────────── */
@media (max-width: 768px) {
  .sidebar {
    width: var(--sidebar-width);
    transform: translateX(-100%);
    transition: transform .28s ease;
    box-shadow: 0 0 40px rgba(0, 0, 0, .35);
  }
  /* Nunca colapsa em ícones no mobile — mostra o menu completo quando aberto */
  .sidebar--collapsed { width: var(--sidebar-width); }
  /* Estado aberto do drawer — especificidade dupla p/ vencer .sidebar sem ambiguidade */
  .sidebar.sidebar--drawer-open { transform: translateX(0); }
}

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
