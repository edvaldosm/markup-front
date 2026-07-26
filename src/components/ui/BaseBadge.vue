<script setup lang="ts">
defineProps<{
  color?: 'green' | 'blue' | 'orange' | 'red' | 'gray' | 'purple'
}>()
</script>

<template>
  <span class="badge" :class="`badge--${color ?? 'green'}`">
    <slot />
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px var(--space-2);
  border-radius: 99px;
  font-size: .7rem;
  font-weight: 600;
  letter-spacing: .04em;
  text-transform: uppercase;
  white-space: nowrap;
}
.badge--green  { background: var(--color-primary-50);  color: var(--color-primary-700); }
.badge--blue   { background: #eff6ff; color: #1d4ed8; }
.badge--orange { background: #fffbeb; color: #92400e; }
.badge--red    { background: #fef2f2; color: #b91c1c; }
.badge--gray   { background: #f3f4f6; color: #374151; }
.badge--purple { background: #f5f3ff; color: #5b21b6; }
</style>
