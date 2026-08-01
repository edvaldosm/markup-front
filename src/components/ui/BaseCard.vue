<script setup lang="ts">
defineProps<{
  title?: string
  subtitle?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}>()
</script>

<template>
  <div class="card">
    <div v-if="title || $slots.header" class="card__header">
      <slot name="header">
        <div>
          <h3 class="card__title">{{ title }}</h3>
          <p v-if="subtitle" class="card__subtitle">{{ subtitle }}</p>
        </div>
      </slot>
      <slot name="actions" />
    </div>
    <div class="card__body" :class="`card__body--${padding ?? 'md'}`">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--color-border-light);
  gap: var(--space-4);
}

.card__title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
}

.card__subtitle {
  font-size: .8125rem;
  color: var(--color-text-muted);
  margin-top: 2px;
}

/* `padding="none"` deixa o conteúdo rente à borda — usado por tabelas de largura total */
.card__body--none { padding: 0; }
.card__body--sm   { padding: var(--space-3); }
.card__body--md   { padding: var(--space-6); }
.card__body--lg   { padding: var(--space-8); }
</style>
