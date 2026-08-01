<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}>(), {
  variant: 'primary',
  size: 'md',
  type: 'button'
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="['btn', `btn--${variant}`, `btn--${size}`, { 'btn--loading': loading }]"
  >
    <span v-if="loading" class="btn__spinner" aria-hidden="true" />
    <slot />
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  border: none;
  border-radius: var(--radius);
  font-weight: 500;
  letter-spacing: 0.01em;
  transition: all .15s ease;
  white-space: nowrap;
}

.btn:disabled { opacity: .55; cursor: not-allowed; }

/* Tamanhos */
.btn--sm  { padding: var(--space-2) var(--space-3); font-size: .8125rem; border-radius: var(--radius-sm); }
.btn--md  { padding: var(--space-2) var(--space-5); font-size: .9rem; }
.btn--lg  { padding: var(--space-3) var(--space-6); font-size: 1rem; }

/* Variantes */
.btn--primary {
  background: var(--color-primary-600);
  color: #fff;
  box-shadow: 0 1px 3px var(--color-primary-shadow);
}
.btn--primary:hover:not(:disabled) { background: var(--color-primary-700); box-shadow: 0 2px 6px var(--color-primary-shadow-strong); }

.btn--secondary {
  background: var(--color-primary-50);
  color: var(--color-primary-700);
  border: 1px solid var(--color-primary-200);
}
.btn--secondary:hover:not(:disabled) { background: var(--color-primary-100); }

.btn--ghost {
  background: transparent;
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
}
.btn--ghost:hover:not(:disabled) { background: var(--color-bg-subtle); color: var(--color-text); }

.btn--danger {
  background: #fee2e2;
  color: var(--color-danger);
  border: 1px solid #fca5a5;
}
.btn--danger:hover:not(:disabled) { background: #fecaca; }

/* Spinner */
.btn__spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
