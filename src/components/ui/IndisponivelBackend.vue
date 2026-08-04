<script setup lang="ts">
/**
 * Aviso padronizado para funcionalidade **desativada** por falta de capacidade
 * no backend — nunca um número calculado no front para preencher a lacuna
 * (Artigo III v2.5.0).
 *
 * Sempre exige um motivo: não existe uso deste componente sem explicar por que
 * a tela não mostra o dado. Um "—" mudo pareceria bug; este componente deixa
 * claro que é limitação temporária, registrada, com dono (o backend).
 *
 * `tamanho="linha"` cabe dentro de uma célula de stat card ou tabela;
 * `tamanho="bloco"` ocupa uma seção inteira (ex.: tela de Fator R).
 */
const props = withDefaults(
  defineProps<{
    motivo: string
    tamanho?: 'linha' | 'bloco'
  }>(),
  { tamanho: 'linha' },
)
</script>

<template>
  <span v-if="props.tamanho === 'linha'" class="indisponivel indisponivel--linha" :title="motivo">
    <span class="indisponivel__icone">⏳</span>
    <span class="indisponivel__texto">Indisponível</span>
  </span>

  <div v-else class="indisponivel indisponivel--bloco">
    <span class="indisponivel__icone">⏳</span>
    <div class="indisponivel__conteudo">
      <strong>Indisponível no momento</strong>
      <p>{{ motivo }}</p>
    </div>
  </div>
</template>

<style scoped>
.indisponivel { color: var(--color-text-light); }

.indisponivel--linha {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: .8125rem;
  font-style: italic;
  cursor: help;
}
.indisponivel--linha .indisponivel__icone { font-size: .875rem; }

.indisponivel--bloco {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  background: var(--color-bg-subtle);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
}
.indisponivel--bloco .indisponivel__icone { font-size: 1.5rem; line-height: 1; }
.indisponivel__conteudo { display: flex; flex-direction: column; gap: var(--space-1); }
.indisponivel__conteudo strong { color: var(--color-text); font-size: .9375rem; }
.indisponivel__conteudo p { font-size: .8125rem; line-height: 1.5; margin: 0; }
</style>
