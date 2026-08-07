---
name: assistente-ui
description: Widget plugável do assistente no frontend Markup — chat global (app.use + AppLayout.vue) que consome perguntarAssistente do backend, com memória multi-turn (threadId) e histórico em Pinia com janela deslizante. Use ao mexer na UI do assistente.
metadata:
  domain: frontend-markup
  kind: skill
  origin: Requisito 2026-07-31 (assistente na tela); reescrito 07-08-2026 (plugável + threadId, ver assistente-chat-plugavel)
---

# Assistente na UI (widget plugável, multi-turn)

Ajuda o usuário a esclarecer dúvidas sobre formação de preço, cruzando com o
catálogo real da empresa ativa. Só consome o backend e exibe
([[FR08-assistente-consome-backend]]) — guardrail, RAG e memória da conversa
vivem no servidor.

Spec completa: `.claude/specs/assistente-chat-plugavel/`.

## Peças

- **`plugins/assistente.ts`** — `AssistentePlugin.install(app, opções)`,
  instalado **uma vez** em `main.ts` (`posicao`, `maxMensagens: 10`).
  `provide`/`inject` (`ASSISTENTE_OPCOES`) em vez de props — é o que torna o
  widget plugável em vez de acoplado a uma tela.
- **`components/ui/AssistenteWidget.vue`** — botão flutuante + painel.
  Montado **uma única vez**, dentro de `AppLayout.vue` (fora de
  `.app-content`, que tem `overflow-y: auto`; fora de `.app-main`, que
  remonta com o `RouterView`). Herda o escopo de tema por módulo (F10) de
  graça, por estar dentro de `.app-layout`.
- **`stores/assistente.ts`** — setup store de **sessão** (não de domínio —
  não filtra por empresa ativa, só lê `empresaStore.empresaAtivaId` para
  mandar em cada pergunta). Guarda `mensagens` (janela deslizante de
  `maxMensagens`), `threadId` (memória multi-turn — só o id, o conteúdo fica
  no backend) e faz a própria chamada Apollo (`perguntar()`), no mesmo padrão
  de `stores/produtos.ts`/`stores/empresa.ts` — **sem** composable separado.

## Store (estado + chamada Apollo)

```ts
export const useAssistenteStore = defineStore('assistente', () => {
  const mensagens = ref<MensagemAssistente[]>([])
  const threadId = ref<string | null>(null)
  const carregando = ref(false)

  async function perguntar(pergunta: string) {
    adicionar({ autor: 'usuario', texto: pergunta, criadaEm: new Date().toISOString() })
    carregando.value = true
    try {
      const { data } = await apolloClient.query({
        query: PERGUNTAR_ASSISTENTE,
        variables: { pergunta, empresaId: empresaStore.empresaAtivaId || null, threadId: threadId.value },
        fetchPolicy: 'network-only', // pergunta tem efeito no servidor — nunca vem do cache
      })
      threadId.value = data.perguntarAssistente.threadId
      adicionar({ autor: 'assistente', texto: data.perguntarAssistente.texto,
                  status: data.perguntarAssistente.status, fontes: data.perguntarAssistente.fontes,
                  criadaEm: new Date().toISOString() })
    } catch (e) {
      erro.value = mensagemDeErro(e, 'perguntarAssistente')
    } finally {
      carregando.value = false
    }
  }

  registrarResetDeSessao(limpar) // logout esvazia mensagens E threadId
  return { mensagens, threadId, carregando, erro, perguntar, limpar, /* ... */ }
})
```

## Memória multi-turn (`threadId`)

O backend guarda a conversa (últimas 10 trocas, TTL de 10min de ociosidade —
`markup-back/.claude/specs/conversa-assistente-multi-turn/`). O front:

- Reenvia o `threadId` que a **última resposta** devolveu — nunca inventa um,
  nunca reenvia o texto do histórico em si.
- `threadId` ausente, expirado ou de outra sessão é tratado pelo backend como
  ausente — começa conversa nova, sem erro. O front não precisa detectar isso.
- `threadId: ID!` vem em **toda** resposta, inclusive recusas — a store
  atualiza sempre.

## Comportamento por `status` (do backend)

`RespostaAssistente.status` tem 7 valores — o front só exibe `resposta.texto`
(o backend já escreve a mensagem cordial certa para cada um) e usa o status
só para **estilo** (balão de recusa vs. balão normal):

| status | UI |
|--------|----|
| `OK` | balão normal, com `fontes` disponíveis |
| `FORA_DE_ESCOPO` / `RECUSADO` / `SEM_FONTE` / `DADOS_INSUFICIENTES` / `NAO_ENCONTRADO` / `AMBIGUO` | balão de recusa (itálico, `msg--recusa`) — texto já vem pronto do backend |

Erro de **rede** (backend fora do ar) é outra coisa: `classificarErro`/
`mensagemDeErro` (`graphql/erros.ts`) — exibido como banner separado
(`assistente__erro`), nunca confundido com uma recusa do backend.

## Integração

Contrato real (`markup-back/src/main/resources/graphql/schema.graphqls`):

```graphql
perguntarAssistente(pergunta: String!, empresaId: ID, threadId: ID): RespostaAssistente!
type RespostaAssistente { status: StatusResposta! texto: String! origem: OrigemResposta! fontes: [FonteTrecho!]! threadId: ID! }
```

Apollo real (`MOCK_MODE` não existe mais no código — foi desligado nas fatias
de integração anteriores). Backend: [[assistente-rag-precificacao]].
