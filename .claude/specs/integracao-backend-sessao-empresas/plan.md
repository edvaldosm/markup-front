# Plano técnico — Integração com o backend: sessão e empresas

> Preenchido por `/plan` a partir do `spec.md`. Descreve **como** construir.
> Nenhuma decisão pode violar [constitution.md](../../constitution.md).

- **Slug:** integracao-backend-sessao-empresas  •  **Baseado em:** spec.md  •  **Data:** 2026-08-03

## Abordagem

Apollo Client real substituindo `mockQuery`, com a cadeia de links carregando
sozinha as três responsabilidades transversais da sessão: **anexar o token**,
**renovar e repetir** quando ele expira, e **classificar o erro** para a UI.
Nenhuma tela sabe que isso existe.

Três escolhas estruturais sustentam o resto:

1. **Os tokens não moram no Pinia.** Ficam num módulo `sessao.ts`: o *access* em
   variável de módulo (morre com a aba), o *refresh* em `localStorage`. O motivo
   é ordem de execução — os links do Apollo rodam fora de qualquer contexto de
   componente e precisam do token antes de qualquer store existir. Guardar o
   access em estado reativo também o exporia nas devtools sem ganho nenhum.

2. **A autorização de empresa sai do cliente.** `empresasAutorizadas`,
   `isDono`, `isCompartilhada` e `podeAcessarEmpresa` são **removidas** de
   `autorizacao.ts` — quem decide é `minhasEmpresas` (B9). Ficam só as funções
   que descrevem o que a *UI oferece*: `isAdminGlobal`, `temPermissao`,
   `podeAcessarModuloAdmin`, mais a nova `perfilEfetivo`.

3. **O perfil da sessão passa a ser derivado, não fixado.** `perfilDaSessao()`
   (que pegava `empresas[0]`) morre junto com o mock. No lugar,
   `perfilEfetivo(usuario, empresaAtivaId)` — pura, testável, e recomputada
   sempre que a empresa ativa muda.

O que **não** muda nesta fatia: o cálculo local (`useMarkup.ts`) e as telas de
catálogo continuam no mock até as fatias 2 e 3.

## Camadas afetadas

- **Frontend:**
  - `src/graphql/` — `client.ts` (Apollo + links), `sessao.ts` (cofre de tokens),
    `operations/acesso.ts` (documentos gql), `erros.ts` (classificação).
    Templates: `camada-graphql-mock` (reescrita), `modelo-de-dados-front`.
  - `src/stores/auth.ts`, `src/stores/empresa.ts` — template `store-pinia-dominio`.
  - `src/auth/autorizacao.ts` — poda + `perfilEfetivo`.
  - `src/types/index.ts`, `src/config/segmentos.ts` — espelho do schema.
  - `src/views/LoginView.vue`, `src/components/layout/AppLayout.vue`,
    `src/main.ts` — templates `roteamento-e-layout`, `design-tokens-tema`.
  - `src/test/` — template `testes-navegacao-multiusuario`.
- **Backend (repo markup-back):** **nenhuma mudança**. O contrato já está
  implementado e no ar; esta fatia consome o que existe.

## Mudanças de modelo / contrato

- **Schema GraphQL:** nenhuma. Operações consumidas nesta fatia — `login`,
  `renovarSessao`, `encerrarSessao`, `me`, `minhasEmpresas`.
- **Tipos do front** (`src/types/index.ts`), alinhando ao `.graphqls` (REQ-11):
  - `SegmentoNegocio` ganha `'COMERCIO'` ⇒ `segmentos.ts` ganha a entrada
    correspondente (ícone, cores, rótulos), senão o `Record` fica incompleto e o
    build de tipos falha — que é o comportamento desejado, falha cedo.
  - `Empresa`: `anexoSimples` → `anexoCadastrado`; remove `createdAt`; adiciona
    `percentualDespesasFixas: number` (vem calculado, C2/B1) e
    `despesasFixas: DespesaFixa[]`.
  - `Usuario`: remove `createdAt` e `avatarUrl`. O avatar passa a ser derivado
    das iniciais do nome no componente que o exibe — dado de apresentação não
    vem do backend (B7).
  - `Perfil.escopoGlobal` vira obrigatório.
  - `AuthUser.perfil` deixa de ser campo fixo: o perfil efetivo é computado.
- **Migração de dados:** os ids do mock passam de `emp-001`/`usr-001` para os
  numéricos do seed (`1`…`4`). Razão: durante esta fatia a empresa ativa já vem
  do backend (`"1"`), mas o catálogo ainda filtra o mock por `empresaId`; sem o
  realinhamento, todas as telas de dados ficariam vazias entre a fatia 1 e a 2.
  O seed `V900__dados_do_mock_do_front.sql` já espelha o mock, então o
  realinhamento é de ids, não de conteúdo.

## Decisões de design (requisito → decisão)

| Requisito | Decisão |
|-----------|---------|
| REQ-01 | `LoginView` chama `auth.login(email, senha)` → mutation `login`. Erro com `classification: UNAUTHORIZED` vira "e-mail ou senha inválidos". |
| REQ-02 | `sessao.ts`: access em variável de módulo; refresh em `localStorage['markup.refreshToken']`. `authLink` (`setContext`) injeta `Authorization: Bearer`. |
| REQ-03 | `errorLink` (`onError`): erro com `classification === 'UNAUTHORIZED'` **e** operação diferente de `login`/`renovarSessao` **e** refresh presente ⇒ renova e reexecuta a operação uma única vez (`forward`). Renovação é **single-flight**: chamadas concorrentes compartilham a mesma promise, senão N requisições disparam N rotações de refresh e todas menos uma recebem token já invalidado. Falha ⇒ `encerrarSessaoLocal()` + redirect ao login com `?expirada=1`. |
| REQ-03 | O gatilho é o `classification`, não o status HTTP: o backend responde **200** com o erro no corpo (verificado). |
| REQ-04 | `logout()` = mutation `encerrarSessao` (best-effort, ignora falha de rede) → `apolloClient.clearStore()` → `resetarStoresDeSessao()` → limpa `sessao.ts` e as chaves de `localStorage`. Cada store de domínio expõe `reset()` e se registra em `src/stores/reset.ts`; o teste de aceite "logar como outro usuário" é o que prova a lista completa. |
| REQ-05 | Nada a fazer no front: o backend recusa usuário inativo. O front só precisa exibir a mensagem devolvida (REQ-13). |
| REQ-06 | `empresa.fetchEmpresas()` = query `minhasEmpresas`, sem filtro local. As quatro funções de autorização de empresa saem de `autorizacao.ts`. |
| REQ-07 | `empresaAtivaId` persiste em `localStorage['markup.empresaAtiva']`; após `fetchEmpresas`, se o id guardado não estiver na lista do servidor, cai em `empresas[0]`. |
| REQ-08 | Lista vazia ⇒ `AppLayout` renderiza estado vazio explicativo em vez do conteúdo da rota; o switcher some. |
| REQ-09 | `perfilEfetivo(usuario, empresaAtivaId)` em `autorizacao.ts`: `perfilGlobal ?? vínculo(empresaAtivaId)?.perfil ?? null`. O computed em `auth.ts` chama `useEmpresaStore()` **dentro** do computed (nunca no topo do setup) — `empresa.ts` já importa `auth.ts`, e a chamada tardia evita o ciclo. |
| REQ-09a | Watcher em `AppLayout` sobre `empresaAtivaId`: reexecuta `guardaNavegacao(rotaAtual)` e, se o resultado não for `true`, empurra para o dashboard. A lógica de permissão continua num lugar só. |
| REQ-10 | As queries desta fatia não recebem `empresaId` (`me`/`minhasEmpresas` derivam do token). O contrato passa a ser exercido na fatia 2; aqui a empresa ativa já fica exposta como a fonte única para elas. |
| REQ-11 | Tipos reescritos à mão espelhando o `.graphqls` (sem codegen: uma dependência de build a mais não se paga para ~8 operações). `vue-tsc` no `npm run build` é o verificador. |
| REQ-12 | `percentualDespesasFixas` passa a ser lido de `empresa.percentualDespesasFixas`; qualquer cálculo local desse número é removido. |
| REQ-13 | `erros.ts` traduz `classification` → mensagem: `UNAUTHORIZED` (credencial/sessão), `FORBIDDEN` (sem autorização), `NOT_FOUND`, `BAD_REQUEST` (mensagem do domínio, escrita para o usuário), e ausência de resposta (`networkError`) → "não foi possível falar com o servidor". Erro de rede **nunca** cai no estado vazio de lista. |
| REQ-14 | `VITE_GQL_ENDPOINT` em `.env.development` (`http://localhost:8080/graphql`). `vite.config.ts` passa a `strictPort: true`: com `false`, o Vite sobe na 5174 quando a 5173 está ocupada e o CORS do backend barra tudo — falhar no start é melhor que falhar no navegador. |
| REQ-15 | `auth.ts` e `empresa.ts` deixam de importar `src/mock/`. `perfilDaSessao` é removida. Sem flag `MOCK_MODE`. |
| REQ-16 | `src/test/servidor-falso.ts`: stub de `globalThis.fetch` que responde por `operationName`, com fixtures espelhando o seed. Testa a cadeia real de links (header, renovação, retry) sem dependência nova (msw fica de fora). `entrarComo()` do harness passa a autenticar por ele. |

## Rules aplicáveis

- **B1/F6** — nenhum número calculado no front nesta fatia; `percentualDespesasFixas` vem pronto.
- **B2/B9** — filtragem de empresas é do servidor; o front só reflete.
- **B5** — permissão continua decidindo rota (`guardaNavegacao`), agora com perfil correto.
- **B6** — o `.graphqls` do markup-back é a fonte; os tipos do front seguem.
- **F2** — stores por domínio, reativas à empresa ativa.
- **F7** — guard de rota preservado; nada de tela renderizada antes da sessão restaurar.
- **F9** — todo teste de visibilidade continua navegando como cada perfil.
- **Artigo III** — números crus do backend; `Intl` continua no front (`useCurrency`).
- **Emenda pendente:** `FR06` descreve `MOCK_MODE` como flag de runtime. A regra
  deve ser reescrita ao fim da fatia 3, quando o mock desaparecer por completo.

## Riscos e alternativas

- **Rotação de refresh em corrida** → a renovação é single-flight, com a promise
  compartilhada; sem isso, duas queries simultâneas em token expirado derrubam a
  sessão de um usuário legítimo.
- **`login` com senha errada devolve `UNAUTHORIZED`, igual a token expirado** →
  o `errorLink` filtra por `operationName`; sem esse filtro, senha errada
  dispararia uma tentativa de renovação e mascararia a mensagem correta.
- **Restauração de sessão versus primeiro render** → `main.ts` aguarda
  `auth.restaurarSessao()` antes de `app.mount()`; senão o guard vê `user = null`
  no F5 e joga para o login todo mundo que tinha refresh válido.
- **Telas ainda no mock durante a fatia** → mitigado pelo realinhamento de ids do
  mock para os do seed. Alternativa descartada: deixar as telas vazias até a
  fatia 2 — quebraria os testes de navegação por perfil, que dependem de ver
  dados por empresa.
- **Porta do Vite fora da lista de CORS** → `strictPort: true` transforma um erro
  confuso de navegador em falha explícita no start.
- **`@vue/apollo-composable` fica sem uso** — as stores fazem chamada imperativa
  (`apolloClient.query/mutate`), que é o padrão FR02. Avaliar remoção da
  dependência na fatia 3, quando não restar tela mock que pudesse querer usá-la.

---
**Próximo passo:** `/tasks`
