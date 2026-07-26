<script setup lang="ts">
defineProps<{
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}>()

const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div class="modal-overlay" @click.self="emit('close')">
        <div class="modal" :class="`modal--${size ?? 'md'}`" role="dialog">
          <div class="modal__header">
            <h2 class="modal__title">{{ title }}</h2>
            <button class="modal__close" @click="emit('close')" aria-label="Fechar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="modal__body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="modal__footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.35);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-4);
}

.modal {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.modal--sm { max-width: 400px; }
.modal--md { max-width: 560px; }
.modal--lg { max-width: 720px; }
.modal--xl { max-width: 900px; }

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--color-border-light);
}

.modal__title {
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--color-text);
}

.modal__close {
  background: none;
  border: none;
  color: var(--color-text-muted);
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  display: flex;
  transition: background .15s, color .15s;
}
.modal__close:hover { background: var(--color-bg-subtle); color: var(--color-text); }

.modal__body { padding: var(--space-6); overflow-y: auto; }

.modal__footer {
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border-light);
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}

/* Transition */
.modal-enter-active, .modal-leave-active { transition: all .2s ease; }
.modal-enter-from .modal, .modal-leave-to .modal { transform: scale(.95); opacity: 0; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
