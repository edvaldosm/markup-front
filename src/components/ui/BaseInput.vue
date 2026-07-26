<script setup lang="ts">
defineProps<{
  label?: string
  error?: string
  hint?: string
  prefix?: string
  suffix?: string
}>()

const model = defineModel<string | number>()
</script>

<template>
  <div class="field">
    <label v-if="label" class="field__label">{{ label }}</label>
    <div class="field__wrapper" :class="{ 'field__wrapper--error': error }">
      <span v-if="prefix" class="field__affix field__affix--prefix">{{ prefix }}</span>
      <input v-bind="$attrs" class="field__input" v-model="model" />
      <span v-if="suffix" class="field__affix field__affix--suffix">{{ suffix }}</span>
    </div>
    <p v-if="error" class="field__error">{{ error }}</p>
    <p v-else-if="hint" class="field__hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.field { display: flex; flex-direction: column; gap: var(--space-1); }

.field__label {
  font-size: .8125rem;
  font-weight: 500;
  color: var(--color-text-muted);
  letter-spacing: .02em;
}

.field__wrapper {
  display: flex;
  align-items: stretch;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  transition: border-color .15s, box-shadow .15s;
  overflow: hidden;
}
.field__wrapper:focus-within {
  border-color: var(--color-primary-400);
  box-shadow: 0 0 0 3px rgba(85,181,89,.15);
}
.field__wrapper--error { border-color: var(--color-danger); }
.field__wrapper--error:focus-within { box-shadow: 0 0 0 3px rgba(220,38,38,.12); }

.field__input {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: none;
  outline: none;
  background: transparent;
  font-size: .9rem;
  color: var(--color-text);
  min-width: 0;
}

.field__affix {
  display: flex;
  align-items: center;
  padding: 0 var(--space-3);
  background: var(--color-bg-subtle);
  font-size: .8125rem;
  color: var(--color-text-muted);
  border-right: 1px solid var(--color-border);
  white-space: nowrap;
}
.field__affix--suffix { border-right: none; border-left: 1px solid var(--color-border); }

.field__error { font-size: .75rem; color: var(--color-danger); }
.field__hint  { font-size: .75rem; color: var(--color-text-light); }
</style>
