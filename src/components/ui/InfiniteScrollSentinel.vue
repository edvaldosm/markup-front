<script setup lang="ts">
defineProps<{
  carregandoMais: boolean
  temMais: boolean
  totalItens: number
}>()

const emit = defineEmits<{ 'carregar-mais': [] }>()
</script>

<template>
  <div class="sentinel">
    <!-- Estado: carregando próxima página -->
    <div v-if="carregandoMais" class="sentinel__loading">
      <span class="sentinel__spinner" />
      <span class="sentinel__text">Carregando mais itens…</span>
    </div>

    <!-- Estado: ainda tem mais itens (fallback manual caso scroll não dispare) -->
    <div v-else-if="temMais && totalItens > 0" class="sentinel__mais">
      <button class="sentinel__btn" @click="emit('carregar-mais')">
        Carregar mais
        <span class="sentinel__btn-hint">↓</span>
      </button>
    </div>

    <!-- Estado: fim da lista -->
    <div v-else-if="!temMais && totalItens > 0" class="sentinel__fim">
      <span class="sentinel__check">✓</span>
      <span class="sentinel__text">Todos os {{ totalItens }} itens carregados</span>
    </div>
  </div>
</template>

<style scoped>
.sentinel {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--space-5) var(--space-3);
  min-height: 56px;
}

.sentinel__loading,
.sentinel__fim,
.sentinel__mais {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.sentinel__text {
  font-size: .8125rem;
  color: var(--color-text-muted);
}

.sentinel__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary-500);
  border-radius: 50%;
  animation: spin .7s linear infinite;
  flex-shrink: 0;
}

.sentinel__check {
  font-size: .875rem;
  color: var(--color-primary-500);
  font-weight: 600;
}

.sentinel__btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: none;
  border: 1.5px solid var(--color-border);
  border-radius: 99px;
  font-size: .8125rem;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: border-color .15s, color .15s, background .15s;
}
.sentinel__btn:hover {
  border-color: var(--color-primary-400);
  color: var(--color-primary-600);
  background: var(--color-primary-50);
}

.sentinel__btn-hint {
  font-size: .75rem;
  opacity: .6;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
