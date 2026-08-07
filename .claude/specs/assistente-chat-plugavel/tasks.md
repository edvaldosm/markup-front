# Tarefas — Assistente de chat plugável

> Preenchido por `/tasks` a partir do `plan.md`. Lista ordenada, pequena e
> rastreável. Cada tarefa referencia o requisito (`REQ-xx`) e o arquivo/skill alvo.

- **Slug:** assistente-chat-plugavel  •  **Baseado em:** plan.md  •  **Data:** 2026-08-07

## Legenda

`[ ]` pendente · `[~]` em andamento · `[x]` concluída · **dep:** depende de

## Backend

Nenhuma tarefa neste repo: o contrato (`empresaId`, `origem`, 7 status,
`threadId`) já está implementado em `markup-back` — o `threadId` foi
adicionado na mesma sessão, ver
`markup-back/.claude/specs/conversa-assistente-multi-turn/`.

## Frontend

### Camada de dados

- [x] **T-F1** (REQ-01, REQ-04) — `graphql/operations/assistente.ts`: `gql`
  da query `PerguntarAssistente($pergunta, $empresaId, $threadId)` retornando
  `status`, `texto`, `origem`, `fontes { documento trecho }`, `threadId` ·
  alvo: `src/graphql/operations/assistente.ts`.
- [x] **T-F2** (REQ-01) — Tipos `StatusRespostaAssistente` (7 valores),
  `OrigemRespostaAssistente`, `FonteAssistente`, `RespostaAssistente`,
  `MensagemAssistente` (`autor`, `texto`, `status?`, `fontes?`, `criadaEm`) ·
  alvo: `src/types/index.ts` (seção "Assistente") · dep: T-F1.

### Estado/lógica

- [x] **T-F3** (REQ-01, REQ-02, REQ-03, REQ-04, REQ-06, REQ-09) —
  `stores/assistente.ts` (Pinia setup store): `mensagens` (janela deslizante,
  `slice(-maxMensagens)`), `threadId`, `carregando`, `erro`, `perguntar()`
  (chama Apollo direto — `fetchPolicy: 'network-only'`, envia
  `empresaId`/`threadId`, atualiza `threadId` com o da resposta), `limpar()`
  (esvazia mensagens **e** `threadId`); `registrarResetDeSessao(limpar)` no
  `setup()`; **sem** `persist` · alvo: `src/stores/assistente.ts` · dep: T-F2.
  **Revisão:** sem `composables/useAssistente.ts` separado — a chamada Apollo
  entrou na própria store, no padrão real de `produtos.ts`/`empresa.ts`
  (descoberto ao implementar; o plano original previa um composable à parte).

### Plugin e apresentação

- [x] **T-F5** (REQ-05) — `plugins/assistente.ts`: `AssistenteOptions`
  (`posicao`, `maxMensagens`), `ASSISTENTE_OPCOES` (`InjectionKey`),
  `AssistentePlugin.install(app, opcoes)` com `app.provide` e defaults
  (`posicao: 'bottom-right'`, `maxMensagens: 10`) · alvo: `src/plugins/assistente.ts`.
- [x] **T-F6** (REQ-05, REQ-07, REQ-08) — `components/ui/AssistenteWidget.vue`:
  botão flutuante + painel; lê config via `inject(ASSISTENTE_OPCOES)`; usa
  `useAssistenteStore()`; indicador "Digitando…" enquanto `carregando`; lista
  de mensagens com `role="log"` + `aria-live="polite"`; `Esc` fecha o painel;
  auto-scroll ao chegar mensagem nova · alvo:
  `src/components/ui/AssistenteWidget.vue` · dep: T-F3, T-F5.
- [x] **T-F7** (REQ-01, REQ-09) — Estados visuais por `status`: `OK` balão
  normal; os outros 6 status em balão `msg--recusa` (texto já vem pronto do
  backend, front só estiliza); erro de rede em banner `assistente__erro`
  separado (`role="alert"`, `aria-live="assertive"`) · alvo:
  `src/components/ui/AssistenteWidget.vue` · dep: T-F6.

### Integração global

- [x] **T-F8** (REQ-05) — `main.ts`: `app.use(AssistentePlugin, { posicao:
  'bottom-right', maxMensagens: 10 })`, antes do `mount()` · alvo:
  `src/main.ts` · dep: T-F5.
- [x] **T-F9** (REQ-10) — `AppLayout.vue`: `<AssistenteWidget />` como filho
  direto de `.app-layout`, depois de `.app-main` no template (fora de
  `.app-content`/`.app-main`) · alvo: `src/components/layout/AppLayout.vue` ·
  dep: T-F6, T-F8.

### Revisão 07-08-2026 — botão de limpar conversa

- [x] **T-F13** (REQ-11) — `AssistenteWidget.vue`: botão "Limpar conversa" no
  header do painel (ícone de lixeira), desabilitado quando
  `assistente.mensagens.length === 0`, chama `assistente.limpar()` (já
  existia na store desde T-F3 — esvazia `mensagens` e `threadId`) · alvo:
  `src/components/ui/AssistenteWidget.vue` · dep: T-F3, T-F6.
- [x] Verificado ao vivo: botão nasce desabilitado, habilita após a primeira
  pergunta, ao clicar esvazia a lista e a pergunta seguinte recebe
  `threadId` novo do backend (não reaproveita a conversa anterior) ·
  `npx vue-tsc --noEmit` e `npx vitest run` (173 testes) sem regressão.

### Documentação (SDD e vault)

- [x] **T-F10** — `assistente-ui/SKILL.md` reescrito: plugin, store com
  `threadId` + janela deslizante, Apollo real, contrato de 7 status · alvo:
  `.claude/frontend-markup/skills/assistente-ui/SKILL.md`.
- [x] **T-F11** — `specs/README.md`: linha "Assistente (RAG)" atualizada
  (spec + plan + tasks prontos, implementado e verificado ao vivo) · alvo:
  `.claude/specs/README.md`.
- [x] **T-F12** — vault `vue-assistente-chat-plugavel.md`: números ajustados
  de 30→10 mensagens (decisão do usuário) · já feito antes desta rodada de
  implementação.

## Verificação

- [x] `npx vue-tsc --noEmit` sem erro.
- [x] `npx vitest run`: 173 testes, 0 falhas (14 arquivos) — inclui
  `AppLayout` montando `AssistenteWidget` sem quebrar os testes de navegação
  multiusuário existentes.
- [x] Critérios de aceite do `spec.md`:
  - [x] Widget plugado uma única vez em `AppLayout.vue`, visível em qualquer
    rota autenticada (testado no Dashboard).
  - [x] `threadId` reenviado corretamente — verificado na aba de rede: 3
    perguntas seguidas na mesma sessão devolveram `threadId: "1"` nas 3
    respostas.
  - [x] A terceira pergunta ("esse percentual que você calculou é alto ou
    baixo?") foi respondida citando o número exato (19,9367%) da **primeira**
    resposta, sem repeti-lo na pergunta — prova viva de que o histórico
    chegou ao LLM (`ModeloDeLinguagem.responder` com `historico` não-vazio).
  - [ ] Logout esvazia `mensagens`/`threadId` — não testado nesta rodada
    (verificação manual coberta pela mesma `registrarResetDeSessao` já usada
    por todas as outras stores, testada em `sessao.spec.ts`).
  - [ ] Perguntar mais de 10 mensagens sem ultrapassar o teto — não testado
    manualmente nesta rodada (lógica idêntica à testada em `ConversaTest` do
    backend; sem teste unitário próprio no front ainda — ver pendência abaixo).
- [x] **Verificação ao vivo, contra Postgres real e Claude real** (backend
  `localhost:8080`, empresa "NexaTech Consultoria em Tecnologia LTDA"):
  pergunta dentro do escopo → `OK` com fontes de banco+RAG; pergunta fora do
  vocabulário do domínio → `FORA_DE_ESCOPO`, mesmo `threadId`; pergunta
  contextual → resposta correta usando a memória da primeira pergunta. Zero
  erros no console do navegador nas 3 chamadas.

## Pendências (não bloqueiam a feature, registradas para depois)

- [ ] Teste unitário de `stores/assistente.ts` (janela deslizante, reset de
  sessão, atualização de `threadId`) — a store foi verificada manualmente
  (ao vivo) e por tipo (`vue-tsc`), mas não tem `assistente.spec.ts` próprio.
- [ ] Verificação manual de erro de rede (backend desligado) — não testada
  nesta rodada porque o backend estava no ar; `classificarErro`/`mensagemDeErro`
  já são cobertos por `erros.spec.ts` existente, reaproveitados sem mudança.

---
**Próximo passo:** nenhum obrigatório — feature implementada e verificada ao
vivo. Pendências acima são melhorias de cobertura de teste, não bloqueio.
