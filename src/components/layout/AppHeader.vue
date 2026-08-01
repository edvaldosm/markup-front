<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import CompanySwitcher from './CompanySwitcher.vue'

defineEmits<{ 'toggle-sidebar': [] }>()

const route = useRoute()

const pageTitle: Record<string, string> = {
  dashboard: 'Dashboard',
  empresa: 'Dados da Empresa',
  materiais: 'Materiais & Insumos',
  despesas: 'Despesas Fixas',
  impostos: 'Impostos & Alíquotas',
  produtos: 'Produtos',
  'produto-detalhe': 'Ficha Técnica',
  precificacao: 'Calculadora de Markup',
  'fator-r': 'Fator R — Anexo III vs V',
  relatorios: 'Relatórios',
  usuarios: 'Gerenciar Usuários',
  perfis: 'Perfis & Permissões',
  admin: 'Gestão do Site',
  'admin-empresas': 'Gestão do Site — Empresas',
  'admin-empresa-detalhe': 'Gestão do Site — Empresa',
  'admin-usuarios': 'Gestão do Site — Usuários',
}

const title = () => pageTitle[route.name as string] ?? 'Markup'

/**
 * No módulo administrativo não existe "empresa ativa" — a visão é da base
 * inteira. O switcher sai do header e dá lugar ao selo do modo gestor (REQ-09).
 */
const emAdmin = computed(() => route.path.startsWith('/admin'))
</script>

<template>
  <header class="header">
    <div class="header__left">
      <button class="header__toggle" @click="$emit('toggle-sidebar')" aria-label="Menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      <h1 class="header__title">{{ title() }}</h1>
    </div>
    <div class="header__right">
      <span v-if="emAdmin" class="modo-gestor">
        <span class="modo-gestor__dot" />
        Modo gestor · escopo global
      </span>
      <CompanySwitcher v-else />
    </div>
  </header>
</template>

<style scoped>
.header {
  position: fixed;
  top: 0; right: 0; left: var(--sidebar-width);
  height: var(--header-height);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-6);
  z-index: 90;
  box-shadow: var(--shadow-xs);
  transition: left .25s ease;
}

.header__left { display: flex; align-items: center; gap: var(--space-4); }

.header__toggle {
  background: none;
  border: none;
  color: var(--color-text-muted);
  display: flex;
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  transition: background .15s, color .15s;
}
.header__toggle:hover { background: var(--color-bg-subtle); color: var(--color-text); }

.header__title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
}

/* Selo do módulo administrativo — herda a paleta neutra do escopo .theme-admin */
.modo-gestor {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border);
  border-radius: 99px;
  font-size: .75rem;
  font-weight: 600;
  letter-spacing: .02em;
  color: var(--color-text-muted);
  white-space: nowrap;
}
.modo-gestor__dot {
  width: 6px; height: 6px;
  background: var(--color-primary-600);
  border-radius: 50%;
  flex-shrink: 0;
}

.company-pill {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-3);
  background: var(--color-primary-50);
  border: 1px solid var(--color-primary-200);
  border-radius: 99px;
  font-size: .8125rem;
  font-weight: 500;
  color: var(--color-primary-700);
}

.company-pill__dot {
  width: 6px; height: 6px;
  background: var(--color-primary-500);
  border-radius: 50%;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .header {
    left: 0;
    padding: 0 var(--space-4);
    gap: var(--space-3);
  }
  .header__left { gap: var(--space-2); min-width: 0; }
  /* Deixa o título encolher para o switcher de empresa caber */
  .header__title {
    font-size: .9375rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .header__right { flex-shrink: 0; }
}
</style>
