<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'
import { useEmpresaStore } from '@/stores/empresa'
import { segmentoConfig } from '@/config/segmentos'

const sidebarOpen = ref(true)
const empresaStore = useEmpresaStore()

onMounted(() => {
  if (!empresaStore.empresas.length) empresaStore.fetchEmpresas()
})

/** Acento do tema segue o segmento da empresa ativa */
const segStyle = computed(() => {
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
  <div class="app-layout" :class="{ 'sidebar-collapsed': !sidebarOpen }" :style="segStyle">
    <AppSidebar :open="sidebarOpen" @toggle="sidebarOpen = !sidebarOpen" />
    <div class="app-main">
      <AppHeader @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <main class="app-content">
        <RouterView />
      </main>
    </div>
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

@media (max-width: 768px) {
  .app-main { margin-left: 0; }
  .sidebar-collapsed .app-main { margin-left: 0; }
}
</style>
