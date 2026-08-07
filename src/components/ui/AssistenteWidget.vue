<script setup lang="ts">
/**
 * Widget plugável do assistente — montado uma única vez em `AppLayout.vue`
 * (REQ-10). Lê a config do plugin via `inject` (REQ-05); toda lógica de
 * conversa mora em `useAssistenteStore()` (F8: só envia e exibe).
 */
import { computed, inject, nextTick, ref, watch } from 'vue'
import { ASSISTENTE_OPCOES } from '@/plugins/assistente'
import { useAssistenteStore } from '@/stores/assistente'
import BaseButton from './BaseButton.vue'

const opcoes = inject(ASSISTENTE_OPCOES, { posicao: 'bottom-right' as const, maxMensagens: 10 })
const assistente = useAssistenteStore()
assistente.definirMaxMensagens(opcoes.maxMensagens)

const aberto = ref(false)
const pergunta = ref('')
const listaRef = ref<HTMLElement | null>(null)

const RECUSA: ReadonlySet<string> = new Set([
  'FORA_DE_ESCOPO', 'RECUSADO', 'SEM_FONTE', 'DADOS_INSUFICIENTES', 'NAO_ENCONTRADO', 'AMBIGUO',
])

function classeDoBalao(mensagem: { autor: string; status?: string }): string {
  if (mensagem.autor === 'usuario') return 'msg msg--usuario'
  return mensagem.status && RECUSA.has(mensagem.status) ? 'msg msg--assistente msg--recusa' : 'msg msg--assistente'
}

async function enviar(): Promise<void> {
  const texto = pergunta.value.trim()
  if (!texto || assistente.carregando) return
  pergunta.value = ''
  await assistente.perguntar(texto)
}

function alternar(): void {
  aberto.value = !aberto.value
}

function fechar(): void {
  aberto.value = false
}

function aoTeclarEsc(): void {
  if (aberto.value) fechar()
}

watch(() => assistente.mensagens.length, () => {
  nextTick(() => {
    if (listaRef.value) listaRef.value.scrollTop = listaRef.value.scrollHeight
  })
})

const posicaoClasse = computed(() => `assistente--${opcoes.posicao}`)
</script>

<template>
  <div class="assistente" :class="posicaoClasse" @keydown.esc="aoTeclarEsc">
    <button
      class="assistente__gatilho"
      type="button"
      :aria-expanded="aberto"
      aria-label="Assistente de precificação"
      @click="alternar"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    </button>

    <Transition name="slide-up">
      <div v-if="aberto" class="assistente__painel" role="dialog" aria-label="Assistente de precificação">
        <div class="assistente__header">
          <h2 class="assistente__titulo">Assistente</h2>
          <button class="assistente__fechar" type="button" aria-label="Fechar" @click="fechar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div ref="listaRef" class="assistente__lista" role="log" aria-live="polite" aria-label="Mensagens da conversa">
          <p v-if="assistente.mensagens.length === 0" class="assistente__vazio">
            Pergunte sobre formação de preço, markup, impostos, despesas fixas ou seus produtos cadastrados.
          </p>
          <div v-for="(msg, i) in assistente.mensagens" :key="i" :class="classeDoBalao(msg)">
            {{ msg.texto }}
          </div>
          <div v-if="assistente.carregando" class="msg msg--assistente msg--carregando" aria-live="off">
            Digitando…
          </div>
        </div>

        <p v-if="assistente.erro" class="assistente__erro" role="alert" aria-live="assertive">
          {{ assistente.erro }}
        </p>

        <form class="assistente__input" @submit.prevent="enviar">
          <input
            v-model="pergunta"
            type="text"
            placeholder="Digite sua pergunta…"
            :disabled="assistente.carregando"
            aria-label="Pergunta para o assistente"
          >
          <BaseButton type="submit" size="sm" :loading="assistente.carregando" :disabled="!pergunta.trim()">
            Enviar
          </BaseButton>
        </form>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.assistente {
  position: fixed;
  bottom: var(--space-6);
  z-index: 900;
}
.assistente--bottom-right { right: var(--space-6); }
.assistente--bottom-left { left: var(--space-6); }

.assistente__gatilho {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
  background: var(--color-primary-600);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-lg);
  transition: background .15s, transform .15s;
}
.assistente__gatilho:hover { background: var(--color-primary-700); transform: translateY(-2px); }

.assistente__painel {
  position: absolute;
  bottom: 64px;
  right: 0;
  width: min(360px, calc(100vw - 2 * var(--space-6)));
  max-height: min(520px, 70vh);
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}
.assistente--bottom-left .assistente__painel { right: auto; left: 0; }

.assistente__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border-light);
  background: var(--color-bg-subtle);
}
.assistente__titulo { font-size: .95rem; font-weight: 600; color: var(--color-text); }
.assistente__fechar {
  background: none; border: none; color: var(--color-text-muted);
  padding: var(--space-1); border-radius: var(--radius-sm); display: flex;
}
.assistente__fechar:hover { background: var(--color-bg); color: var(--color-text); }

.assistente__lista {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.assistente__vazio {
  font-size: .8125rem;
  color: var(--color-text-muted);
  text-align: center;
  padding: var(--space-4);
}

.msg {
  max-width: 85%;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius);
  font-size: .875rem;
  line-height: 1.5;
  white-space: pre-wrap;
}
.msg--usuario {
  align-self: flex-end;
  background: var(--color-primary-600);
  color: #fff;
  border-bottom-right-radius: var(--radius-sm);
}
.msg--assistente {
  align-self: flex-start;
  background: var(--color-bg-subtle);
  color: var(--color-text);
  border-bottom-left-radius: var(--radius-sm);
}
.msg--recusa { color: var(--color-text-muted); font-style: italic; }
.msg--carregando { color: var(--color-text-light); font-style: italic; }

.assistente__erro {
  margin: 0 var(--space-4);
  padding: var(--space-2) var(--space-3);
  font-size: .8125rem;
  color: var(--color-danger);
  background: #fee2e2;
  border-radius: var(--radius-sm);
}

.assistente__input {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--color-border-light);
}
.assistente__input input {
  flex: 1;
  min-width: 0;
  padding: var(--space-2) var(--space-3);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius);
  font-size: .875rem;
  color: var(--color-text);
}
.assistente__input input:focus {
  outline: none;
  border-color: var(--color-primary-400);
  box-shadow: 0 0 0 3px var(--focus-ring);
}

@media (max-width: 768px) {
  .assistente__painel {
    width: calc(100vw - 2 * var(--space-4));
  }
}
</style>
