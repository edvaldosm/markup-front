<script setup lang="ts">
/**
 * Input monetário com máscara pt-BR (R$ 1.234,56) aplicada durante a digitação.
 * `v-model` expõe o valor em reais (number), igual a um input numérico comum —
 * só a apresentação muda.
 */
import { ref, watch, nextTick } from 'vue'

defineProps<{
  label?: string
  hint?: string
  id?: string
}>()

const model = defineModel<number>({ default: 0 })

const fmt = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const display = ref(fmt.format(model.value ?? 0))

watch(model, (v) => {
  const formatted = fmt.format(v ?? 0)
  if (formatted !== display.value) display.value = formatted
})

function onInput(e: Event) {
  const el = e.target as HTMLInputElement
  const digits = el.value.replace(/\D/g, '')
  const cents = digits ? parseInt(digits, 10) : 0
  const valor = cents / 100
  model.value = valor
  display.value = fmt.format(valor)
  nextTick(() => {
    const len = el.value.length
    el.setSelectionRange(len, len)
  })
}

function onFocus(e: Event) {
  ;(e.target as HTMLInputElement).select()
}
</script>

<template>
  <div class="field">
    <label v-if="label" class="field__label" :for="id">{{ label }}</label>
    <div class="field__wrapper">
      <span class="field__affix">R$</span>
      <input
        :id="id"
        class="field__input"
        type="text"
        inputmode="decimal"
        autocomplete="off"
        :value="display"
        @input="onInput"
        @focus="onFocus"
      />
    </div>
    <slot name="hint">
      <p v-if="hint" class="field__hint">{{ hint }}</p>
    </slot>
  </div>
</template>

<style scoped>
.field { display: flex; flex-direction: column; gap: var(--space-1); }
.field__label { font-size: .8125rem; font-weight: 500; color: var(--color-text-muted); }
.field__hint { font-size: .75rem; color: var(--color-text-light); }

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

.field__input {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: none;
  outline: none;
  background: transparent;
  font-size: .9rem;
  color: var(--color-text);
  min-width: 0;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
</style>
