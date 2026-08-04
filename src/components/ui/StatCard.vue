<script setup lang="ts">
/**
 * `value`/`sub` aceitam texto direto **ou** um slot nomeado — o slot existe
 * para casos como `IndisponivelBackend`, onde o card não tem um número a
 * mostrar (Artigo III v2.5.0) e precisa de markup, não só string.
 */
defineProps<{
  label: string
  value?: string
  sub?: string
  icon?: string
  color?: 'green' | 'blue' | 'orange' | 'red' | 'purple'
  trend?: 'up' | 'down' | 'neutral'
}>()
</script>

<template>
  <div class="stat-card" :class="`stat-card--${color ?? 'green'}`">
    <div class="stat-card__icon" v-if="icon">{{ icon }}</div>
    <div class="stat-card__content">
      <p class="stat-card__label">{{ label }}</p>
      <p class="stat-card__value"><slot name="value">{{ value }}</slot></p>
      <p v-if="sub || $slots.sub" class="stat-card__sub"><slot name="sub">{{ sub }}</slot></p>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--space-5) var(--space-6);
  display: flex;
  gap: var(--space-4);
  align-items: flex-start;
  box-shadow: var(--shadow-xs);
  position: relative;
  overflow: hidden;
  transition: box-shadow .2s;
}
.stat-card:hover { box-shadow: var(--shadow-sm); }

.stat-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
}
.stat-card--green::before  { background: linear-gradient(90deg, var(--color-primary-400), var(--color-primary-600)); }
.stat-card--blue::before   { background: linear-gradient(90deg, #60a5fa, #2563eb); }
.stat-card--orange::before { background: linear-gradient(90deg, #fbbf24, #d97706); }
.stat-card--red::before    { background: linear-gradient(90deg, #f87171, #dc2626); }
.stat-card--purple::before { background: linear-gradient(90deg, #a78bfa, #7c3aed); }

.stat-card__icon {
  font-size: 1.5rem;
  flex-shrink: 0;
  margin-top: 2px;
}

.stat-card__label {
  font-size: .75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--color-text-muted);
}

.stat-card__value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.2;
  margin-top: var(--space-1);
}

.stat-card__sub {
  font-size: .75rem;
  color: var(--color-text-light);
  margin-top: var(--space-1);
}
</style>
