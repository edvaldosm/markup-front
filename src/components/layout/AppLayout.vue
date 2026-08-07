<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'
import AssistenteWidget from '@/components/ui/AssistenteWidget.vue'
import { useEmpresaStore } from '@/stores/empresa'
import { guardaNavegacao } from '@/router'
import { segmentoConfig } from '@/config/segmentos'

const route = useRoute()
const router = useRouter()
const empresaStore = useEmpresaStore()

/**
 * Trocar de empresa pode trocar o perfil (REQ-09) e, com ele, o que o usuário
 * pode abrir. Se a rota atual deixar de ser permitida, ele vai para o dashboard
 * (REQ-09a) — não fica olhando uma tela que o servidor passará a negar.
 *
 * A decisão é reexecutada pelo **mesmo guard** da navegação: duplicar a regra de
 * permissão aqui é como as duas versões passam a divergir.
 */
watch(() => empresaStore.empresaAtivaId, (nova, anterior) => {
  if (!nova || nova === anterior) return
  const destino = guardaNavegacao(route)
  if (destino !== true) router.push(destino)
})

/** Colapso da sidebar no desktop */
const sidebarOpen = ref(true)
/** Drawer aberto no mobile (sobreposto ao conteúdo) */
const mobileOpen = ref(false)
/** Viewport mobile (≤ 768px) */
const isMobile = ref(false)

const MOBILE_BREAKPOINT = 768

function updateViewport() {
  isMobile.value = window.innerWidth <= MOBILE_BREAKPOINT
  // Ao voltar para desktop, garante que o drawer não fique preso aberto
  if (!isMobile.value) mobileOpen.value = false
}

/** No mobile o toggle abre/fecha o drawer; no desktop colapsa a sidebar */
function toggleSidebar() {
  if (isMobile.value) mobileOpen.value = !mobileOpen.value
  else sidebarOpen.value = !sidebarOpen.value
}

// Fecha o drawer ao navegar (boa navegabilidade em telas pequenas)
watch(() => route.fullPath, () => { mobileOpen.value = false })

onMounted(() => {
  updateViewport()
  window.addEventListener('resize', updateViewport)
  if (!empresaStore.empresas.length) empresaStore.fetchEmpresas()
})

onBeforeUnmount(() => window.removeEventListener('resize', updateViewport))

/**
 * Escopo de tema do módulo de Gestão do Site (FR10). Em `/admin*` o layout troca
 * a paleta verde por uma neutra — o gestor precisa reconhecer, pela cor, que está
 * na área de suporte e não operando a empresa de um cliente.
 */
const emAdmin = computed(() => route.path.startsWith('/admin'))

/**
 * A classe também vai no `<html>`: o `background` do `body` e tudo que o Vue
 * teleporta para fora do layout (`BaseModal` usa `<Teleport to="body">`)
 * escapariam do escopo e voltariam ao verde do produto.
 */
watch(emAdmin, (ativo) => {
  document.documentElement.classList.toggle('theme-admin', ativo)
}, { immediate: true })

onBeforeUnmount(() => document.documentElement.classList.remove('theme-admin'))

/** Acento do tema: o segmento da empresa ativa — ou o neutro, no módulo do gestor */
const segStyle = computed(() => {
  if (emAdmin.value) {
    return {
      '--seg-accent': 'var(--color-neutral-600)',
      '--seg-accent-soft': 'var(--color-neutral-100)',
      '--seg-grad-from': 'var(--color-neutral-500)',
      '--seg-grad-to': 'var(--color-neutral-700)',
    }
  }
  const cfg = segmentoConfig(empresaStore.empresa?.segmento)
  return {
    '--seg-accent': cfg.cor,
    '--seg-accent-soft': cfg.corSuave,
    '--seg-grad-from': cfg.gradiente[0],
    '--seg-grad-to': cfg.gradiente[1],
  }
})
</script>

<template>
  <div
    class="app-layout"
    :class="{ 'sidebar-collapsed': !sidebarOpen, 'mobile-open': mobileOpen, 'theme-admin': emAdmin }"
    :style="segStyle"
  >
    <AppSidebar :open="isMobile ? true : sidebarOpen" :mobile-open="mobileOpen" @toggle="toggleSidebar" />

    <!-- Backdrop do drawer no mobile -->
    <div
      v-if="mobileOpen"
      class="app-backdrop"
      aria-hidden="true"
      @click="mobileOpen = false"
    />

    <div class="app-main">
      <AppHeader @toggle-sidebar="toggleSidebar" />
      <main class="app-content">
        <RouterView />
      </main>
    </div>

    <!-- Fora de .app-content (overflow-y: auto cortaria o painel flutuante) e
         fora de .app-main (não deve remontar a cada troca de rota). Único
         ponto de instalação do site (assistente-chat-plugavel, REQ-10). -->
    <AssistenteWidget />
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: var(--color-bg);
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  margin-left: var(--sidebar-width);
  transition: margin-left .25s ease;
}

.sidebar-collapsed .app-main { margin-left: 64px; }

.app-content {
  flex: 1;
  padding: var(--space-8);
  margin-top: var(--header-height);
  overflow-y: auto;
}

/* Backdrop escuro exibido atrás do drawer no mobile */
.app-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .45);
  z-index: 95;
  animation: backdrop-in .2s ease;
}
@keyframes backdrop-in { from { opacity: 0; } to { opacity: 1; } }

@media (max-width: 768px) {
  .app-main { margin-left: 0; }
  .sidebar-collapsed .app-main { margin-left: 0; }
  .app-content {
    padding: var(--space-4);
    /* Evita rolagem horizontal acidental do conteúdo em telas estreitas */
    max-width: 100vw;
    overflow-x: hidden;
  }
}
</style>
