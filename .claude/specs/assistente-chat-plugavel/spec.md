# Spec — Assistente de chat plugável

> Preenchido por `/specify`. Descreve **o quê** e **por quê** — nunca o **como**
> (isso é o `plan.md`). Deve obedecer a [constitution.md](../../constitution.md).

- **Slug:** assistente-chat-plugavel
- **Status:** implementada e verificada ao vivo (07-08-2026) — ver `tasks.md`
- **Data:** 2026-08-07

> **Nota de revisão (07-08-2026):** ao planejar a implementação, a
> investigação do contrato real (`markup-back`, repo irmão) revelou que ele é
> mais rico do que o assumido no rascunho original desta spec — já expõe
> `empresaId` (cruza com o cadastro/catálogo real da empresa ativa),
> `origem` (banco/RAG/os dois) e mais três status
> (`DADOS_INSUFICIENTES`/`NAO_ENCONTRADO`/`AMBIGUO`), e — a pedido do usuário
> nesta mesma sessão — ganhou `threadId` com memória multi-turn (TTL de
> 10min, ver `markup-back/.claude/specs/conversa-assistente-multi-turn/`).
> REQ-01, REQ-04 e "Fora de escopo" abaixo foram atualizados para refletir
> isso; o resto da spec (plugável, janela de 10 mensagens, store de sessão,
> montagem global) não mudou.

## Problema / Objetivo

O backend já expõe `perguntarAssistente` (GraphQL, com guardrail de escopo e
RAG sobre o vault de precificação — B8/R08), mas o front ainda não tem a
interface que faz essa pergunta e mostra a resposta. O esboço existente
([[assistente-ui]]) descreve o composable e o contrato, mas não resolve dois
pontos que o usuário levantou agora: **(1)** o componente precisa ser
**plugável** — instalável em qualquer módulo/tela sem duplicar código — e
**(2)** o histórico da conversa, guardado em Pinia, **não pode crescer sem
limite** numa sessão longa.

Resolve para: qualquer usuário autenticado do sistema, em qualquer tela onde
esteja preenchendo dados de precificação e tenha uma dúvida sobre o domínio.

## Histórias de usuário

- Como usuário do sistema, quero perguntar em linguagem natural sobre formação
  de preço enquanto preencho uma tela, para tirar dúvidas sem sair do fluxo.
- Como usuário, quero ver minhas perguntas e respostas recentes durante a
  sessão, para acompanhar a conversa sem repetir contexto na pergunta seguinte.
- Como usuário, quero saber quando o assistente não pode responder (fora de
  escopo, recusado, sem fonte) com uma mensagem clara, em vez de um erro
  genérico ou uma resposta inventada.
- Como time de frontend, quero um componente de assistente plugável (um
  `app.use` + slots), para instalar em qualquer módulo — inclusive futuros, com
  escopo de tema próprio (F10) — sem fork nem duplicação.

## Requisitos

> Testáveis, com MUST/SHOULD. IDs `REQ-01`, `REQ-02`…

- **REQ-01 (MUST):** O componente envia a pergunta via `perguntarAssistente`
  (GraphQL), com `empresaId` da empresa ativa quando houver uma, e exibe a
  resposta conforme o `status` retornado (`OK`, `FORA_DE_ESCOPO`, `RECUSADO`,
  `SEM_FONTE`, `DADOS_INSUFICIENTES`, `NAO_ENCONTRADO`, `AMBIGUO`) — nenhuma
  lógica de guardrail, RAG ou consulta a catálogo roda no front (F8); o front
  só decide a mensagem/estilo por `status`, nunca decide o `status` em si.
- **REQ-02 (MUST):** O histórico da conversa fica numa Pinia store de sessão,
  visível apenas durante a sessão do usuário no navegador — sem persistência em
  `localStorage`/`sessionStorage`.
- **REQ-03 (MUST):** O histórico é limitado por uma janela deslizante (número
  máximo de mensagens); ao ultrapassar o limite, as mensagens mais antigas
  saem da store. O histórico **não** cresce sem limite numa sessão longa.
- **REQ-04 (MUST):** O front guarda o `threadId` devolvido pelo backend
  (memória multi-turn, TTL de 10min de ociosidade — decisão do usuário,
  07-08-2026) e o reenvia em toda pergunta seguinte da mesma conversa, para o
  assistente lembrar do que foi perguntado antes. O front **nunca** reenvia o
  texto do histórico em si — só o id; o conteúdo da memória fica só no
  backend, apagado por ociosidade, sem o front replicá-lo.
- **REQ-05 (MUST):** O componente é plugável — instalável/reaproveitável em
  qualquer tela ou módulo sem alterar o código interno dele, respeitando
  escopo de tema por módulo (F10) e cores só via tokens (F3).
- **REQ-06 (MUST):** O histórico visual **e** o `threadId` são esvaziados no
  logout, junto com as demais stores de sessão — a próxima sessão começa uma
  conversa nova, nunca continua a de quem logou antes na mesma aba.
- **REQ-07 (SHOULD):** Indicador de carregamento/"digitando" enquanto aguarda
  a resposta do backend.
- **REQ-08 (SHOULD):** Lista de mensagens acessível — navegável por teclado e
  anunciada a leitores de tela (região `aria-live`) quando chega resposta nova.
- **REQ-09 (SHOULD):** Erro de rede/servidor inacessível é exibido de forma
  distinta de uma recusa do backend (`FORA_DE_ESCOPO`/`RECUSADO`/`SEM_FONTE`) —
  o usuário não pode confundir "o assistente recusou" com "o servidor caiu".
- **REQ-10 (MUST):** O widget é instalado **globalmente, uma única vez**, no
  layout raiz das rotas autenticadas (`AppLayout.vue`) — visível em todo o
  site, em qualquer módulo/tela, sem precisar ser plugado tela a tela.
- **REQ-11 (MUST, adicionado 07-08-2026):** O usuário consegue limpar a
  conversa manualmente (botão no cabeçalho do painel) sem precisar deslogar.
  Limpar apaga o histórico visual **e** o `threadId` — a próxima pergunta
  começa uma conversa nova no backend, nunca continua a anterior. Botão
  desabilitado quando não há histórico (nada para limpar).

## Critérios de aceite

- [ ] Em qualquer tela autenticada onde o widget está plugado, o usuário
      consegue abrir o chat, perguntar e ver a resposta (ou o aviso adequado
      por status) sem sair da tela.
- [ ] Perguntar mais mensagens do que o limite da janela não deixa o array de
      histórico crescer além do teto configurado.
- [ ] Fazer logout limpa o histórico da conversa.
- [ ] O mesmo componente/plugin funciona em pelo menos duas telas de módulos
      diferentes sem alteração de código, só de instalação.
- [ ] Um erro de rede (backend fora do ar) mostra mensagem diferente de uma
      resposta `RECUSADO`/`FORA_DE_ESCOPO` do backend.
- [x] A segunda pergunta de uma conversa chega ao backend com o `threadId`
      devolvido pela primeira resposta — confirmável na aba de rede
      (variável `threadId` na query). **Verificado ao vivo 07-08-2026.**
- [x] Botão "Limpar conversa": desabilitado sem histórico; após uma pergunta,
      habilita; ao clicar, esvazia a lista e a pergunta seguinte recebe um
      `threadId` novo (não reaproveita o anterior). **Verificado ao vivo
      07-08-2026.**

## Fora de escopo

- Streaming token-a-token da resposta — o backend hoje devolve a resposta
  pronta, não incremental.
- UI de "conversas anteriores" (listar/retomar threads antigas) — a memória
  multi-turn é efêmera por desenho (10min de ociosidade no backend); não
  existe tela de histórico permanente.
- Configurar o TTL da memória multi-turn pelo front — é parâmetro do backend
  (`markup-back`), fora do alcance desta spec.
- Histórico persistente entre sessões/dispositivos (ex.: retomar conversa de
  ontem) — contradiz REQ-02/REQ-06.
- Edição ou exclusão de mensagens individuais pelo usuário.
- Upload de arquivo/imagem no chat.
- Qualquer alteração no guardrail, no RAG ou no schema do backend — esta spec é
  só a UI que já consome o contrato existente.

## Conformidade com a Constituição

- Artigos aplicáveis: **F1** (Composition API), **F2** (Pinia por domínio — com
  a exceção explícita descrita nesta spec: a store do assistente não filtra
  por empresa ativa, ver REQ-06), **F3** (tokens de design), **F6** (GraphQL
  isolado), **F8** (assistente só consome o backend), **F10** (escopo de tema
  por módulo, se o widget for plugado em módulo com tema próprio).
- Emenda necessária? **Não.** Nenhum requisito contraria um artigo — F2 já é
  descrito como padrão "por domínio filtrado por empresa"; a store do
  assistente é uma store de **sessão**, não de domínio de negócio, categoria
  que já tem precedente (`stores/reset.ts` cobre limpeza de qualquer store de
  sessão, não só as filtradas por empresa).

## Pontos a clarificar

**Resolvidos em 2026-08-07 (decisão do usuário):**

- ~~Tamanho da janela deslizante~~ → **10 mensagens** (5 pares
  pergunta/resposta). Ver REQ-03 e `plan.md`.
- ~~Widget global ou por tela~~ → **global**, uma única instalação em
  `AppLayout.vue`, visível em qualquer rota autenticada. Ver REQ-10.

**Resolvido em 07-08-2026 (mesma sessão, decisão do usuário):**

- ~~Evolução para multi-turn no backend~~ → implementada em
  `markup-back` (`threadId`, TTL 10min — ver
  `markup-back/.claude/specs/conversa-assistente-multi-turn/`). REQ-04 e
  REQ-06 desta spec foram atualizados de acordo.

---
**Próximo passo:** `/plan`
