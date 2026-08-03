# Tarefas — Integração com o backend: sessão e empresas

> Preenchido por `/tasks` a partir do `plan.md`. Lista ordenada, pequena e
> rastreável. Cada tarefa referencia o requisito (`REQ-xx`) e o arquivo/skill alvo.

- **Slug:** integracao-backend-sessao-empresas  •  **Baseado em:** plan.md  •  **Data:** 2026-08-03

## Legenda

`[ ]` pendente · `[~]` em andamento · `[x]` concluída · **dep:** depende de

## Backend

Nenhuma tarefa: o contrato consumido nesta fatia já está implementado e no ar no
repo `markup-back` (verificado em `http://localhost:8080/graphql`). Pré-requisito
de ambiente, não tarefa: backend rodando com o perfil `dev` (seed `V900`).

## Frontend

### Contrato e tipos (base de tudo)

- [x] **T-F1** (REQ-11) — Alinhar `SegmentoNegocio` (+`COMERCIO`), `Empresa`
  (`anexoCadastrado`, sem `createdAt`, com `percentualDespesasFixas` e
  sem `despesasFixas` — ver plan.md), `Usuario` (sem `createdAt`/`avatarUrl`), `Perfil.escopoGlobal`
  obrigatório · alvo: `src/types/index.ts` · skill: `modelo-de-dados-front` ·
  done: os tipos batem campo a campo com `markup-back/src/main/resources/graphql/schema.graphqls`.
- [x] **T-F2** (REQ-11) — Entrada `COMERCIO` no registro de segmentos (ícone,
  cores, gradiente, rótulos) · alvo: `src/config/segmentos.ts` · dep: T-F1 ·
  skill: `design-tokens-tema` · done: `Record<SegmentoNegocio, SegmentoConfig>`
  completo; `vue-tsc` sem erro.
- [x] **T-F3** (REQ-11) — Remover `avatarUrl` · alvo: `src/types/index.ts` ·
  dep: T-F1 · done: nenhuma referência a `avatarUrl` em `src/`. **Nada a fazer nos
  componentes:** todas as telas já derivavam as iniciais do nome; o campo estava no
  tipo sem nenhum consumidor.

### Camada GraphQL

- [x] **T-F4** (REQ-14) — `.env.development` com
  `VITE_GQL_ENDPOINT=http://localhost:8080/graphql`; `strictPort: true` no Vite ·
  alvo: `.env.development`, `vite.config.ts`, `.gitignore` · done: `npm run dev`
  falha explicitamente se a 5173 estiver ocupada, em vez de migrar de porta.
  **`.env.development` saiu do `.gitignore`**: não guarda segredo (só o endereço
  local) e mantê-lo fora obrigaria cada dev a recriá-lo. `.env`, `.env.local` e
  `.env.production` seguem ignorados.
- [x] **T-F5** (REQ-02) — Cofre de sessão: access em memória de módulo, refresh em
  `localStorage['markup.refreshToken']`, com `limparSessao()` · alvo:
  `src/graphql/sessao.ts` · done: recarregar a página preserva só o refresh.
- [x] **T-F6** (REQ-13) — Classificação de erro: `extensions.classification` e
  `networkError` → mensagem de UI · alvo: `src/graphql/erros.ts` · done: as cinco
  situações (credencial, sessão, sem autorização, entrada inválida, servidor
  inacessível) têm mensagem própria e testes de unidade.
- [x] **T-F7** (REQ-01, REQ-02) — Apollo Client com `authLink` + `httpLink` ·
  alvo: `src/graphql/client.ts` · dep: T-F4, T-F5 · skill: `camada-graphql-mock`
  (reescrita) · done: cadeia `errorLink → authLink → httpLink` montada, com
  `fetchPolicy: network-only` (cache serviria dado de outra empresa após a troca).
  **`MOCK_MODE`/`mockQuery` sobrevivem marcados como `@deprecated`**: 6 stores e
  `relatorios.ts` ainda dependem deles até as fatias 2–3. Não são mais uma flag
  de alternância — sessão e empresas não passam por eles.
- [~] **T-F8** (REQ-03) — `errorLink` com renovação **single-flight** e repetição
  única da operação; filtra `login`/`renovarSessao`; falha ⇒ limpa sessão e
  redireciona ao login com aviso · alvo: `src/graphql/client.ts`, `src/main.ts` · dep: T-F7 ·
  done: teste com token expirado conclui a operação sem erro visível; teste com
  refresh inválido cai no login com aviso; senha errada **não** dispara renovação.
  **Implementado** (single-flight + `jaRenovou` + filtro por `operationName`);
  falta só a prova automatizada, que depende do servidor falso — vem em T-F22.
- [x] **T-F9** (REQ-01, REQ-06) — Documentos gql: `login`, `renovarSessao`,
  `encerrarSessao`, `me`, `minhasEmpresas` · alvo: `src/graphql/operations/acesso.ts` ·
  dep: T-F1 · done: cada documento pede exatamente os campos que o front usa.

### Autorização e stores

- [x] **T-F10** (REQ-06, REQ-09) — Podar `autorizacao.ts` (remover
  `empresasAutorizadas`, `isDono`, `isCompartilhada`, `podeAcessarEmpresa`) e
  acrescentar `perfilEfetivo(usuario, empresaAtivaId)` · alvo:
  `src/auth/autorizacao.ts` + `autorizacao.spec.ts` · dep: T-F1 · done: nenhuma
  decisão de *quais empresas* o usuário vê sobra no front; `perfilEfetivo` coberto
  por teste, inclusive o caso ADMIN global.
- [x] **T-F11** (REQ-01, REQ-02, REQ-04, REQ-09) — Reescrever o store de auth:
  `login` real, `restaurarSessao`, `logout` (mutation + limpeza), `perfil`
  computado via `perfilEfetivo` chamando `useEmpresaStore()` **dentro** do
  computed · alvo: `src/stores/auth.ts` · dep: T-F9, T-F10 · skill:
  `store-pinia-dominio` · done: sem import de `src/mock/`; `perfilDaSessao`
  extinta; trocar de empresa muda `auth.perfil`.
- [x] **T-F12** (REQ-04) — Registro central de reset de stores, chamado no logout
  junto de `apolloClient.clearStore()` · alvo: `src/stores/reset.ts` + `reset()`
  em cada store de domínio · dep: T-F11 · done: após logout, todo store de
  domínio está vazio.
- [x] **T-F13** (REQ-06, REQ-07, REQ-12) — Store de empresa sobre `minhasEmpresas`,
  com `empresaAtivaId` persistida e validada contra a lista do servidor;
  `percentualDespesasFixas` lido, nunca calculado · alvo: `src/stores/empresa.ts` ·
  dep: T-F9, T-F10 · done: sem import de `src/mock/`; id guardado fora do conjunto
  autorizado cai na primeira empresa.

### Telas e navegação

- [x] **T-F14** (REQ-01, REQ-13) — `LoginView` com senha real, estado de carregando
  e mensagem de erro; exibe aviso quando chega com `?expirada=1` · alvo:
  `src/views/LoginView.vue` · dep: T-F11 · done: senha errada mostra mensagem e não
  navega.
- [x] **T-F15** (REQ-02) — `main.ts` restaura a sessão **antes de instalar o
  router** e já carrega as empresas · alvo: `src/main.ts` · dep: T-F11 · done: F5
  em rota protegida não passa pelo login. **Duas correções descobertas no
  navegador:** (a) `app.use(router)` dispara a navegação inicial, então esperar
  só o `mount` não evitava a corrida — o guard avaliava com `user = null`;
  (b) sem as empresas carregadas no boot, o perfil efetivo é nulo e toda rota com
  permissão caía no dashboard.
- [x] **T-F16** (REQ-08, REQ-09a) — `AppLayout`: estado vazio para usuário sem
  empresa; watcher em `empresaAtivaId` que revalida a rota via `guardaNavegacao` e
  redireciona ao dashboard quando ela deixa de ser permitida · alvo:
  `src/components/layout/AppLayout.vue` · dep: T-F13 · skill: `roteamento-e-layout` ·
  done: trocar para empresa onde o perfil não tem a permissão da rota atual leva ao
  dashboard.

### Mock e testes

- [x] **T-F17** (migração de ids) — Realinhar os ids do mock aos do seed `V900`
  (`emp-001`→`1`, `usr-001`→`2`, …) · alvo: `src/mock/data.ts` · dep: T-F13 · done:
  com empresa ativa vinda do backend, as telas ainda no mock continuam mostrando
  dados.
- [ ] **T-F18** (REQ-15) — Remover de `src/mock/data.ts` o que a fatia 1 aposentou
  (`perfilDaSessao`, usuários/empresas usados só pelo login mock) · alvo:
  `src/mock/data.ts` · dep: T-F11, T-F13 · done: `grep -r "from '@/mock" src/`
  não retorna nada fora de `src/test/` e das telas das fatias 2–3.
- [x] **T-F19** (REQ-16) — Servidor falso: stub de `globalThis.fetch` respondendo
  por `operationName`, com fixtures espelhando o seed · alvo:
  `src/test/servidor-falso.ts` · dep: T-F7 · skill: `testes-navegacao-multiusuario` ·
  done: permite simular sucesso, `UNAUTHORIZED` e queda de rede.
- [x] **T-F20** (REQ-16) — Adaptar o harness (`entrarComo` autentica pelo servidor
  falso; some a dependência dos fake timers do `mockQuery`) · alvo:
  `src/test/app-harness.ts` · dep: T-F19 · done: harness monta o app sem tocar em
  `src/mock/`.
- [x] **T-F21** (REQ-09, REQ-16) — Atualizar os testes de navegação e de empresa
  para os ids do seed e para o perfil por empresa ativa; incluir o caso da Ana
  (`PROPRIETARIO` na empresa 1, `CONTADOR` na 3) · alvo:
  `src/test/navegacao-multiusuario.spec.ts`, `src/stores/empresa.spec.ts`,
  `src/test/admin-gestao-site.spec.ts` · dep: T-F20 · done: o teste falha se o
  perfil parar de acompanhar a empresa ativa.
- [ ] **T-F22** (REQ-03, REQ-04) — Testes de ciclo de sessão: renovação + repetição,
  refresh inválido ⇒ login, e logout sem resíduo do usuário anterior · alvo:
  `src/test/sessao.spec.ts` · dep: T-F19, T-F12 · done: cobre os três critérios de
  aceite correspondentes.

## Verificação

- [ ] `npm run build` (inclui `vue-tsc`) sem erro
- [ ] `npm test` verde
- [ ] `grep -rn "MOCK_MODE\|mockQuery\|perfilDaSessao" src/` não retorna nada
- [ ] Verificação manual contra o backend em `dev`, com os 11 critérios de aceite
      do `spec.md` — em especial: F5 mantém sessão, token expirado não gera erro
      visível, Ana troca de empresa e a navegação muda, backend derrubado exibe
      indisponibilidade
- [ ] `FR06` marcada com a emenda pendente (reescrita só ao fim da fatia 3)

---
**Próximo passo:** implementar, começando por T-F1.
