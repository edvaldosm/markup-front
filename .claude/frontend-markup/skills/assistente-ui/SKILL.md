---
name: assistente-ui
description: Componente/tela do assistente no frontend Markup — chat que ajuda o usuário a preencher o sistema, consumindo perguntarAssistente do backend. Use ao implementar a UI do assistente.
metadata:
  domain: frontend-markup
  kind: skill
  origin: Requisito 2026-07-31 (assistente na tela)
---

# Assistente na UI (chat de apoio)

Ajuda o usuário a esclarecer dúvidas sobre o preenchimento (formação de preço).
Só consome o backend e exibe ([[FR08-assistente-consome-backend]]).

## Peças

- **`AssistenteWidget.vue`** (`components/ui/`) — botão flutuante + painel de chat
  (lista de mensagens, input, estado de carregando). Estilo via tokens ([[design-tokens-tema]]).
- **`useAssistente.ts`** (`composables/`) — envia a pergunta e trata os status.
- Store opcional `stores/assistente.ts` para histórico da conversa da sessão.

## Composable

```ts
export function useAssistente() {
  const mensagens = ref<{ autor: 'user' | 'bot'; texto: string; fontes?: string[] }[]>([])
  const carregando = ref(false)

  async function perguntar(pergunta: string) {
    mensagens.value.push({ autor: 'user', texto: pergunta })
    carregando.value = true
    // via camada GraphQL (mock ou Apollo) — nunca chamar LLM/vault direto (FR08)
    const r = await perguntarAssistenteGql(pergunta) // { status, texto, fontes }
    mensagens.value.push({ autor: 'bot', texto: r.texto, fontes: r.fontes })
    carregando.value = false
    return r.status
  }

  return { mensagens, carregando, perguntar }
}
```

## Comportamento por status (do backend)

| status | UI |
|--------|----|
| `OK` | exibe resposta + fontes |
| `FORA_DE_ESCOPO` | exibe aviso cordial "só ajudo com formação de preço" |
| `RECUSADO` | exibe recusa neutra |
| `SEM_FONTE` | "não encontrei isso na base" |

## Integração

Contrato `perguntarAssistente(pergunta): RespostaAssistente` em
[[camada-graphql-mock]]; enquanto `MOCK_MODE=true`, `perguntarAssistenteGql`
devolve respostas simuladas. Backend: [[assistente-rag-precificacao]].
