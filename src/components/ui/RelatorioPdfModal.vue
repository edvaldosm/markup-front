<script setup lang="ts">
/**
 * Pré-visualização de PDF em modal (FR11) — o binário vem pronto do backend
 * (`modo=inline`); aqui só exibe (`<iframe>` sobre o Object URL) e oferece
 * baixar o mesmo blob, sem requisição nova.
 */
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'

defineProps<{
  url: string
  nomeArquivo: string
}>()

const emit = defineEmits<{ close: []; baixar: [] }>()
</script>

<template>
  <BaseModal title="Pré-visualização do relatório" size="xl" @close="emit('close')">
    <iframe :src="url" :title="nomeArquivo" class="pdf-frame" />

    <template #footer>
      <BaseButton variant="secondary" @click="emit('close')">Fechar</BaseButton>
      <BaseButton @click="emit('baixar')">Baixar PDF</BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.pdf-frame {
  width: 100%;
  height: 75vh;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius);
}
</style>
