<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useEmpresaStore } from '@/stores/empresa'
import { segmentoConfig } from '@/config/segmentos'
import EmpresaFormModal from '@/components/ui/EmpresaFormModal.vue'

const empresaStore = useEmpresaStore()
const open = ref(false)
const showNovaEmpresa = ref(false)

function abrirNovaEmpresa() {
  open.value = false
  showNovaEmpresa.value = true
}

const ativa = computed(() => empresaStore.empresa)
const configAtiva = computed(() => segmentoConfig(ativa.value?.segmento))

function selecionar(id: string) {
  empresaStore.selecionarEmpresa(id)
  open.value = false
}

function onClickFora(e: MouseEvent) {
  if (!(e.target as HTMLElement).closest('.switcher')) open.value = false
}
onMounted(() => document.addEventListener('click', onClickFora))
onBeforeUnmount(() => document.removeEventListener('click', onClickFora))
</script>

<template>
  <div class="switcher">
    <button
      class="switcher__trigger"
      :style="{ '--seg': configAtiva.cor, '--seg-suave': configAtiva.corSuave }"
      @click.stop="open = !open"
    >
      <span class="switcher__icon">{{ configAtiva.icone }}</span>
      <span class="switcher__info">
        <span class="switcher__name">{{ ativa?.razaoSocial ?? 'Selecionar empresa' }}</span>
        <span class="switcher__seg">{{ configAtiva.nome }} · {{ ativa?.cnpj }}</span>
      </span>
      <svg class="switcher__chevron" :class="{ 'switcher__chevron--open': open }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>

    <Transition name="drop">
      <div v-if="open" class="switcher__menu">
        <p class="switcher__menu-label">Trocar de empresa</p>
        <button
          v-for="emp in empresaStore.empresas"
          :key="emp.id"
          class="switcher__item"
          :class="{ 'switcher__item--active': emp.id === empresaStore.empresaAtivaId }"
          :style="{ '--seg': segmentoConfig(emp.segmento).cor, '--seg-suave': segmentoConfig(emp.segmento).corSuave }"
          @click="selecionar(emp.id)"
        >
          <span class="switcher__item-icon">{{ segmentoConfig(emp.segmento).icone }}</span>
          <span class="switcher__item-info">
            <span class="switcher__item-name">{{ emp.razaoSocial }}</span>
            <span class="switcher__item-seg">{{ segmentoConfig(emp.segmento).nome }} · {{ emp.cnpj }}</span>
          </span>
          <svg v-if="emp.id === empresaStore.empresaAtivaId" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>

        <button class="switcher__nova" @click="abrirNovaEmpresa">
          <span class="switcher__nova-icon">+</span>
          Nova empresa
        </button>
      </div>
    </Transition>

    <EmpresaFormModal
      v-if="showNovaEmpresa"
      @close="showNovaEmpresa = false"
      @created="showNovaEmpresa = false"
    />
  </div>
</template>

<style scoped>
.switcher { position: relative; }

.switcher__trigger {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  background: var(--seg-suave, var(--color-bg-subtle));
  border: 1px solid color-mix(in srgb, var(--seg, #888) 35%, transparent);
  border-radius: 10px;
  cursor: pointer;
  transition: border-color .15s, background .15s;
  max-width: 320px;
}
.switcher__trigger:hover { border-color: var(--seg, #888); }

.switcher__icon { font-size: 1.25rem; line-height: 1; flex-shrink: 0; }

.switcher__info { display: flex; flex-direction: column; min-width: 0; text-align: left; }
.switcher__name {
  font-size: .8125rem; font-weight: 600; color: var(--color-text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px;
}
.switcher__seg { font-size: .6875rem; color: var(--seg, var(--color-text-muted)); font-weight: 600; }

.switcher__chevron { color: var(--color-text-muted); flex-shrink: 0; transition: transform .2s; }
.switcher__chevron--open { transform: rotate(180deg); }

.switcher__menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 340px;
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: 12px;
  box-shadow: var(--shadow-lg, 0 12px 32px rgba(0,0,0,.14));
  padding: var(--space-2);
  z-index: 200;
}
.switcher__menu-label {
  font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em;
  color: var(--color-text-muted); padding: var(--space-2) var(--space-2) var(--space-1);
}

.switcher__item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3);
  border: 1px solid transparent;
  border-radius: 8px;
  background: none;
  cursor: pointer;
  text-align: left;
  transition: background .15s, border-color .15s;
  color: var(--seg);
}
.switcher__item:hover { background: var(--seg-suave); }
.switcher__item--active { background: var(--seg-suave); border-color: color-mix(in srgb, var(--seg) 40%, transparent); }

.switcher__item-icon {
  font-size: 1.35rem; line-height: 1; flex-shrink: 0;
  width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;
  background: var(--color-surface); border-radius: 10px;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--seg) 25%, transparent);
}
.switcher__item-info { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.switcher__item-name {
  font-size: .8125rem; font-weight: 600; color: var(--color-text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.switcher__item-seg { font-size: .6875rem; color: var(--seg); font-weight: 600; }

.switcher__nova {
  display: flex; align-items: center; gap: var(--space-2);
  width: 100%; margin-top: var(--space-1);
  padding: var(--space-3);
  border: 1px dashed var(--color-border); border-radius: 8px;
  background: none; cursor: pointer; text-align: left;
  font-size: .8125rem; font-weight: 600; color: var(--color-text-muted);
  transition: background .15s, border-color .15s, color .15s;
}
.switcher__nova:hover { background: var(--color-bg-subtle); border-color: var(--color-primary-400); color: var(--color-primary-700); }
.switcher__nova-icon {
  width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
  font-size: 1.1rem; font-weight: 700; border-radius: 6px;
  background: var(--color-bg-subtle); flex-shrink: 0;
}

.drop-enter-active, .drop-leave-active { transition: opacity .15s, transform .15s; }
.drop-enter-from, .drop-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
