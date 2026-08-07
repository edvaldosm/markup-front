# Plano técnico — Assistente de chat plugável

> Preenchido por `/plan` a partir do `spec.md`. Descreve **como** construir.
> Nenhuma decisão pode violar [constitution.md](../../constitution.md).

- **Slug:** assistente-chat-plugavel  •  **Baseado em:** spec.md  •  **Data:** 2026-08-07 (revisado)

> **Revisão 07-08-2026:** a primeira versão deste plano assumia o contrato
> descrito em `assistente-ui`/`camada-graphql-mock` (desatualizados). Ao
> investigar o repo `markup-back` para desenhar a evolução multi-turn pedida
> pelo usuário, o contrato real apareceu: já tem `empresaId`, `origem` e mais
> status; e ganhou `threadId` nesta mesma sessão
> (`markup-back/.claude/specs/conversa-assistente-multi-turn/`). Este plano
> foi reescrito em cima do contrato real, já **implementado** (não é mais só
> plano — ver "Estado" em cada seção).

## Abordagem

Três camadas independentes, sem novidade de stack (o Apollo Client já está
ligado neste repo — a camada mock foi desligada nas fatias anteriores de
integração; [[camada-graphql-mock]] descreve o estado antigo, não o atual):

1. **Dados** — `graphql/operations/assistente.ts`, uma `query`
   `perguntarAssistente` nova, no mesmo padrão dos outros arquivos em
   `operations/`. `fetchPolicy: 'network-only'` — a pergunta é um comando com
   efeito no servidor (gasta um turno de RAG e atualiza a conversa), não uma
   leitura idempotente que deva vir do `InMemoryCache` do Apollo.
2. **Estado/lógica** — `stores/assistente.ts` (Pinia setup store) guarda o
   histórico visual como **janela deslizante de 10 mensagens** (corta as mais
   antigas ao ultrapassar `maxMensagens`) e o **`threadId`** devolvido pelo
   backend (memória de verdade, mantida no servidor — a store só guarda o id
   para reenviar, nunca o conteúdo da memória). Registra-se em
   `registrarResetDeSessao` — o mesmo mecanismo que já limpa as outras stores
   no logout.
3. **Apresentação** — `components/ui/AssistenteWidget.vue` (botão flutuante +
   painel) recebe configuração via `provide/inject` de um plugin instalado uma
   vez em `main.ts` (`app.use(AssistentePlugin, opções)`), com slots para
   customizar cabeçalho/bolha de mensagem sem fork — isso é o que resolve o
   requisito de "plugável" (REQ-05). A decisão de produto (REQ-10) é montá-lo
   **uma única vez, globalmente**, dentro de `AppLayout.vue` — o shell que já
   envolve toda rota autenticada (sidebar + header + `RouterView`). Montado
   ali, o widget herda de graça o escopo de tema por módulo (F10):
   `AppLayout.vue` já aplica `.theme-admin` e as variáveis `--seg-accent*` no
   elemento que o envolve.

Isso estende, não substitui, o desenho já registrado em [[assistente-ui]]: o
composable `useAssistente()` ali descrito continua existindo, mas passa a
delegar histórico e thread para a store. Detalhe de arquitetura de mercado
pesquisado e documentado em
`d:\ObsidianDocumentos\Conhecimento\programação\FrontEnd\vue\wiki\vue-assistente-chat-plugavel.md`.

**Estado: implementado nesta sessão** (código real, não só desenho) — ver
`tasks.md` para o checklist arquivo a arquivo.

## Camadas afetadas

- **Frontend:**
  - `src/graphql/operations/assistente.ts` — `query PerguntarAssistente`
    com `$pergunta`, `$empresaId`, `$threadId`; campos `status`, `texto`,
    `origem`, `fontes { documento trecho }`, `threadId`.
  - `src/types/index.ts` — seção **Assistente**: `StatusRespostaAssistente`,
    `OrigemRespostaAssistente`, `RespostaAssistente`, `FonteAssistente`,
    `MensagemAssistente` (só do front).
  - `src/stores/assistente.ts` — `mensagens` (janela deslizante de 10),
    `threadId`, `carregando`, `erro`, `perguntar()`, `limpar()`; registra
    reset de sessão. **Sem composable `useAssistente.ts` separado** —
    revisão desta implementação: `produtos.ts`/`empresa.ts` (o padrão real do
    repo) já colocam a chamada Apollo **dentro** da store, não num composable
    à parte; a store já É o "composable" do ponto de vista do componente
    (`useAssistenteStore()`). Manter os dois seria uma camada a mais sem um
    problema que ela resolvesse.
  - `src/plugins/assistente.ts` — `AssistentePlugin.install(app, opções)`,
    `provide` da config (`posicao`, `maxMensagens`).
  - `src/components/ui/AssistenteWidget.vue` — botão flutuante + painel,
    consome o composable, slots para customização.
  - `src/main.ts` — `app.use(AssistentePlugin, { posicao: 'bottom-right',
    maxMensagens: 10 })`.
  - `src/components/layout/AppLayout.vue` — `<AssistenteWidget />` como filho
    direto de `.app-layout` (fora de `.app-content`, que tem
    `overflow-y: auto` e cortaria um painel flutuante; fora de `.app-main`,
    que remonta com o `RouterView` a cada navegação). Único ponto de
    instalação do site.
  - `.claude/frontend-markup/skills/assistente-ui/SKILL.md` — atualizado:
    documenta o plugin, a store com janela deslizante + threadId, e o Apollo
    real (não mais `MOCK_MODE`/`mockQuery`, que não existe mais no código).
- **Backend (repo markup-back):** contrato estendido nesta mesma sessão —
  `threadId` no argumento e na resposta
  (`conversa-assistente-multi-turn/spec.md`); `empresaId`/`origem`/status
  extras já existiam antes desta spec (`assistente-consulta-catalogo`).

## Mudanças de modelo / contrato

- **Schema GraphQL (real, `markup-back/src/main/resources/graphql/schema.graphqls`):**

  ```graphql
  perguntarAssistente(pergunta: String!, empresaId: ID, threadId: ID): RespostaAssistente!

  type RespostaAssistente {
    status: StatusResposta!
    texto: String!
    origem: OrigemResposta!
    fontes: [FonteTrecho!]!
    threadId: ID!
  }
  type FonteTrecho { documento: String! trecho: String! }
  enum StatusResposta { OK FORA_DE_ESCOPO RECUSADO SEM_FONTE DADOS_INSUFICIENTES NAO_ENCONTRADO AMBIGUO }
  enum OrigemResposta { BANCO_DE_DADOS RAG BANCO_DE_DADOS_E_RAG NENHUMA }
  ```

- **Tipos do front (`src/types/index.ts`):**
  - `StatusRespostaAssistente` — union das 7 strings do enum acima.
  - `OrigemRespostaAssistente` — union das 4 strings.
  - `FonteAssistente { documento: string; trecho: string }`.
  - `RespostaAssistente { status; texto; origem; fontes; threadId: string }`.
  - `MensagemAssistente { autor: 'usuario' | 'assistente'; texto: string; fontes?: FonteAssistente[]; criadaEm: string }` — só do front, não existe no schema.
- **Migração de dados:** nenhuma.

## Decisões de design (requisito → decisão)

| Requisito | Decisão |
|-----------|---------|
| REQ-01 | `useAssistente().perguntar(texto)` chama `apolloClient.query({ query: PERGUNTAR_ASSISTENTE, variables: { pergunta: texto, empresaId: empresaStore.empresaAtivaId \|\| null, threadId: assistenteStore.threadId }, fetchPolicy: 'network-only' })`; mapa `status → mensagem` cobre as 7 variantes, não só as 4 originais. |
| REQ-02 | `stores/assistente.ts` não entra na lista de stores com `persist` — sem `pinia-plugin-persistedstate`, sem `localStorage`. |
| REQ-03 | `adicionar(msg)` faz `push` e, se `mensagens.value.length > maxMensagens`, corta com `slice(-maxMensagens)`. `maxMensagens` vem da config do plugin — **10**. |
| REQ-04 | `threadId` guardado em `ref<string \| null>` na store; toda chamada envia o valor atual; a store atualiza com o `threadId` que **toda** resposta devolve (mesmo recusas). O conteúdo da memória em si nunca trafega do front — só o id. |
| REQ-05 | `AssistentePlugin.install()` + `provide`/`inject` da config; `AssistenteWidget.vue` só usa props/slots — nenhuma tela precisa importar a store ou o composable diretamente para ligar o widget. |
| REQ-06 | `registrarResetDeSessao(limpar)` no `setup()` da store; `limpar()` esvazia `mensagens` **e** `threadId = null`. |
| REQ-07 | `carregando` (ref booleana) na store, exibido como indicador de "digitando" no painel enquanto a query está em voo. |
| REQ-08 | Lista de mensagens com `aria-live="polite"`; item de mensagem focável, painel fecha com `Esc`. |
| REQ-09 | Reaproveita `classificarErro`/`mensagemDeErro` (`graphql/erros.ts`) — erro de rede vira `SERVIDOR_INACESSIVEL`, mostrado num bloco visualmente distinto do balão de resposta com `status` de recusa. |
| REQ-10 | `<AssistenteWidget />` entra uma única vez em `AppLayout.vue`; nenhuma `View` individual o referencia. |

## Rules aplicáveis

- **F8** — o composable/store só chama o GraphQL do backend; guardrail e RAG
  continuam exclusivos do servidor (B8/R08).
- **F6** — toda chamada passa por `graphql/operations/`, isolada do
  componente, como já é o padrão do repo.
- **F2 (com exceção documentada)** — `stores/assistente.ts` é store de sessão,
  não de domínio filtrado por empresa; **lê** `empresaStore.empresaAtivaId`
  (só leitura, para mandar no argumento `empresaId` de cada pergunta), mas não
  filtra nem reseta por troca de empresa — o `threadId` sobrevive a trocar de
  empresa ativa (a conversa é do usuário, não da empresa; cada pergunta ainda
  carrega o `empresaId` correto no momento em que é feita). Precedente de
  store de sessão fora do filtro por empresa: `stores/reset.ts`.
- **F3/F10** — cores do painel só via variáveis CSS; se o widget for plugado
  num módulo com escopo de tema próprio (ex.: Gestão do Site), reusa o
  remapeamento de tokens do módulo em vez de estilo hardcoded.
- **F1** — `<script setup lang="ts">` no componente novo.

## Riscos e alternativas

- **Janela deslizante (front) vs. memória real (backend)** — são duas coisas
  diferentes agora, e a spec original não previa isso: a janela de 10
  mensagens no front é só o que a **tela mostra**; a memória que o LLM
  efetivamente usa mora no backend, indexada por `threadId`, com seu próprio
  teto (10 trocas) e TTL (10min) — o front não precisa (nem deve) replicar
  esse conteúdo, só guardar o id. Documentado explicitamente para não
  confundir os dois em manutenção futura.
- **`network-only` pode surpreender quem espera cache do Apollo** — decisão
  consciente: cachear por `(pergunta, threadId)` faria repetir a mesma
  pergunta na mesma conversa devolver uma resposta antiga sem novo turno de
  RAG. Custo: uma chamada de rede a mais por pergunta repetida — aceitável.
- **`threadId` sobrevive à troca de empresa ativa** — alternativa
  considerada: resetar a conversa ao trocar de empresa (mesmo padrão de
  stores de domínio, F2). Rejeitada: o assistente responde sobre formação de
  preço em geral e, com catálogo, sobre a empresa **daquela pergunta
  específica** (`empresaId` viaja por chamada, não é estado da conversa) —
  forçar reset perderia contexto útil ("qual a margem desse produto?" logo
  após trocar de empresa para conferir outra dúvida geral) sem ganho de
  correção, já que o backend nunca mistura dado de empresa errada (R02/R09
  aplicados por chamada).
- **Plugin (`app.use`) vs. componente global registrado direto** — mantido:
  plugin dá ponto único de configuração e injeção de contexto.
- **Tamanho da janela (10 mensagens) e TTL do backend (10min)** — o número 10
  se repete em dois lugares com significados diferentes (mensagens exibidas
  vs. minutos de ociosidade) por coincidência da escolha do usuário — não há
  relação de causa entre eles; documentado para não presumir acoplamento
  numa manutenção futura.

---
**Próximo passo:** `/tasks` (ver tasks.md).
