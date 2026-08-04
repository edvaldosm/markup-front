<script setup lang="ts">
/**
 * Esta tela inteira dependia de fórmula de domínio calculada no front: Fator R
 * simulado ("e se"), impacto no preço entre Anexo III/V (reimplementava
 * `CalculadoraDeMarkup` com alíquotas fixas) e uma tabela comparando o Fator R
 * de cada empresa de serviços. Nenhuma dessas contas tem hoje um equivalente no
 * backend — nem um campo persistido, nem um endpoint de simulação stateless.
 *
 * Por decisão explícita (Artigo III v2.5.0), a tela **não reimplementa a
 * fórmula mais simples possível como substituto** — fica desativada, com o
 * motivo, até as pendências registradas em
 * `integracao-backend-precificacao/spec.md` serem atendidas pelo markup-back:
 * `Empresa.fatorR`/`Empresa.anexoAplicado` para o estado salvo, e uma consulta
 * de simulação para o "e se".
 */
import FatorRNote from '@/components/ui/FatorRNote.vue'
import IndisponivelBackend from '@/components/ui/IndisponivelBackend.vue'

const MOTIVO = 'O simulador de Fator R e o comparativo de anexo precisam de um endpoint de ' +
  'simulação no backend (recebe folha/faturamento hipotéticos, devolve o Fator R e o anexo ' +
  'aplicado) e de Empresa.fatorR/Empresa.anexoAplicado para o estado já salvo. Nenhum dos ' +
  'dois existe no contrato hoje — pendência registrada para o markup-back.'
</script>

<template>
  <div class="fator-r">
    <FatorRNote />
    <IndisponivelBackend :motivo="MOTIVO" tamanho="bloco" />
  </div>
</template>

<style scoped>
.fator-r { display: flex; flex-direction: column; gap: var(--space-6); }
</style>
