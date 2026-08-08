# Spec — Cadastro e manutenção de usuário (CPF, data de nascimento, dono da empresa)

> Preenchido por `/specify`, a partir de pedido direto do usuário: a tela
> "Gestão do Site" (Empresa → Usuários com acesso) só vincula um usuário
> **já cadastrado** — não existe caminho, em nenhuma tela, para cadastrar
> uma pessoa nova com CPF e data de nascimento. Descreve **o quê** e
> **por quê** — nunca o **como** (isso é `plan.md`). Deve obedecer
> [constitution.md](../../constitution.md).

Espelha o contrato definido em
`markup-back/.claude/specs/cadastro-manutencao-usuario/spec.md` — este
documento cobre só o lado front.

- **Slug:** cadastro-manutencao-usuario
- **Status:** aprovada
- **Data:** 2026-08-07

## Problema / Objetivo

Hoje o front tem dois pontos de convite de usuário:

- `UsuariosView.vue` — modal "Convidar Usuário", campos `nome`/`email`/
  `perfilId`, visível a quem tem `USUARIO_WRITE` (na prática, qualquer
  PROPRIETARIO vinculado à empresa ativa — não necessariamente o dono).
- `AdminUsuariosView.vue` — modal "Convidar Usuário Global", mesmos três
  campos, visível só a quem já é usuário global.

Nenhum dos dois pede **CPF** ou **data de nascimento**, e nenhuma tela do
sistema permite **editar** os dados cadastrais de um usuário já criado — só
existe manutenção de vínculo (perfil por empresa, ativo/inativo,
`AdminEmpresaDetalheView.vue`). "Conceder acesso", no screenshot que
motivou este pedido, só oferece um `<select>` de usuários **já existentes**
na base.

O backend (`cadastro-manutencao-usuario`, markup-back) passa a expor:
CPF e data de nascimento em `Usuario`; `convidarUsuario`/
`convidarUsuarioGlobal` exigindo os dois campos novos; mutation nova
`atualizarUsuario` para editar nome/CPF/nascimento/e-mail; e autorização
**estreitada** em `convidarUsuario` — deixa de bastar `USUARIO_WRITE`, passa
a exigir ser **o dono da empresa** (`Empresa.donoUsuarioId`) ou ter escopo
global. Este documento cobre a UI que consome esse contrato.

## Histórias de usuário

- Como **dono de uma empresa**, quero abrir "Cadastrar usuário" na tela de
  Usuários, preencher nome, CPF, data de nascimento, e-mail e perfil, e
  receber a senha provisória — do jeito que já funciona hoje, só que com os
  campos novos.
- Como **usuário de qualquer perfil que não seja o dono**, ao entrar na
  minha empresa eu **não vejo** a ação de cadastrar usuário — mesmo que meu
  perfil (ex.: outro PROPRIETARIO vinculado) já tivesse a permissão RBAC
  antes.
- Como **usuário de escopo global**, vejo "Cadastrar usuário" em qualquer
  empresa que eu administre pela Gestão do Site, e "Cadastrar usuário
  global" em `AdminUsuariosView`, ambos com os campos novos.
- Como **dono da empresa ou usuário global**, quero editar nome, CPF, data
  de nascimento ou e-mail de um usuário que já cadastrei, sem reenviar
  convite.
- Como **qualquer usuário preenchendo o formulário**, quero saber na hora
  se digitei um CPF inválido — não só depois de o servidor recusar.

## Requisitos

> Testáveis, com MUST/SHOULD. IDs `REQ-01`, `REQ-02`…

### Tipos e contrato

- **REQ-01 (MUST):** `Usuario` (tipo do front) ganha `cpf: string` e
  `dataNascimento: string` (ISO), espelhando o schema. `CONVIDAR_USUARIO` e
  `CONVIDAR_USUARIO_GLOBAL` ganham os argumentos `cpf`/`dataNascimento`,
  ambos obrigatórios.
- **REQ-02 (MUST):** Mutation nova `ATUALIZAR_USUARIO` (`usuarios.ts` e/ou
  `admin.ts`, conforme o consumidor) espelhando
  `atualizarUsuario(usuarioId, nome, cpf, dataNascimento, email): Usuario!`.

### Cadastro por empresa — restrito ao dono

- **REQ-03 (MUST):** Nova função `souDonoDaEmpresa(usuario, empresa):
  boolean` em `src/auth/autorizacao.ts` — `empresa.donoUsuarioId ===
  usuario.id`. Não existe hoje (a checagem de dono só existe inline em
  `admin.ts`, para desvincular).
- **REQ-04 (MUST):** `UsuariosView.vue` só mostra a ação "Cadastrar
  Usuário" se `souDonoDaEmpresa(usuarioLogado, empresaAtiva) ||
  auth.adminGlobal`. `USUARIO_WRITE` sozinho deixa de ser suficiente para
  **mostrar** o botão — se o servidor recusar mesmo assim (dado
  desatualizado no cliente), a tela trata como qualquer erro de mutation
  (REQ-10).
- **REQ-05 (MUST):** O modal de cadastro (renomeado de "Convidar Usuário"
  para refletir o formulário maior, ex. "Cadastrar Usuário") ganha campos
  `cpf` (com máscara `000.000.000-00` e validação de dígito verificador
  antes de habilitar o envio) e `dataNascimento` (`<input type="date">`,
  não pode ser data futura). `nome`/`email`/`perfil` continuam como hoje.
- **REQ-06 (MUST):** Resposta do cadastro continua sendo a senha
  provisória exibida **uma única vez**, com aviso e botão copiar — nenhuma
  mudança nesse fluxo (backend mantém o modelo de convite).

### Cadastro global — restrito a usuário global

- **REQ-07 (MUST):** `AdminUsuariosView.vue` — modal "Cadastrar Usuário
  Global" ganha os mesmos dois campos novos (`cpf`, `dataNascimento`). A
  restrição de acesso (só usuário global chega nessa tela) já existe via
  `meta.adminGlobal` no guard de rota — não muda.

### Manutenção (edição)

- **REQ-08 (MUST):** Cartão de usuário em `UsuariosView.vue` ganha ação
  "Editar" quando `souDonoDaEmpresa(usuarioLogado, empresaAtiva) ||
  auth.adminGlobal` — abre o mesmo formulário do cadastro, populado
  (`nome`/`cpf`/`dataNascimento`/`email`), sem campo de perfil (perfil
  continua sendo mudado só pelo fluxo de vínculo existente) e sem senha.
  Salvar chama `atualizarUsuario`.
- **REQ-09 (MUST):** `AdminUsuariosView.vue` ganha a mesma ação "Editar"
  para qualquer usuário da base (empresa ou global) — usuário global só
  edita quem já está autorizado a ver ali (a tela inteira já exige escopo
  global).
- **REQ-10 (MUST):** Falha do servidor (CPF/e-mail duplicado, sem
  autorização, CPF inválido) mantém o formulário aberto com a mensagem do
  servidor — nunca fecha silenciosamente nem finge que salvou (mesmo
  padrão de `ProdutoFormModal`/`EmpresaFormModal`).

### Validação client-side

- **REQ-11 (SHOULD):** Novo utilitário `validarCpf(cpf: string): boolean`
  (dígito verificador, mesmo algoritmo do backend) evita viagem de rede
  para o erro mais comum — mas o servidor continua sendo quem decide (a
  validação do front é atalho de UX, não a autoridade).

## Critérios de aceite

- [x] Logada como dona da empresa ativa, "Cadastrar Usuário" aparece e
      funciona com CPF/nascimento/nome/e-mail/perfil; senha provisória
      exibida uma vez.
- [x] Logada como usuário com perfil PROPRIETARIO vinculado, mas que
      **não** é `donoUsuarioId` da empresa ativa, "Cadastrar Usuário"
      **não aparece**.
- [x] Logado como usuário global, "Cadastrar Usuário" aparece em qualquer
      empresa (via Gestão do Site) e "Cadastrar Usuário Global" aparece em
      `AdminUsuariosView`.
- [x] CPF com dígito verificador inválido bloqueia o envio, com mensagem
      no formulário, sem chamar o servidor. (`UsuarioFormModal.salvar()`
      retorna antes de chamar qualquer store se `!validarCpf(form.cpf)`;
      `validarCpf` coberto por teste unitário exaustivo em `useCpf.spec.ts`.)
- [x] Data de nascimento no futuro é recusada no cliente antes de enviar.
      (mesma guarda em `salvar()`, mais `:max="hojeISO"` no `<input
      type="date">`.)
- [x] Editar um usuário existente (nome/CPF/nascimento/e-mail) salva,
      sobrevive ao F5, e não mexe no perfil/vínculo dele.
- [x] CPF/e-mail já usado por outro usuário, ao editar ou cadastrar, mostra
      a mensagem do servidor no formulário (não fecha, não finge sucesso).
- [x] `npm run build` e `npm test` passam.

## Fora de escopo

- **Trocar o modelo de senha.** Continua convite + senha provisória —
  nenhum campo "senha" em nenhum formulário desta feature.
- **Editar perfil, vínculo, escopo global ou ativo/inativo** a partir do
  formulário de cadastro/edição — continuam nas telas/ações já existentes
  (`AdminEmpresaDetalheView`, `definirPerfilNoVinculo`,
  `definirUsuarioAtivo`).
- **Excluir usuário** — o contrato não tem, ponto já assentado em specs
  anteriores.
- **Auto-cadastro / tela de registro pública** — cadastro continua sendo
  feito por quem já tem acesso (dono ou global), nunca pelo próprio
  usuário se registrando.
- **Promover usuário de empresa a usuário global** (ou o inverso) — fora
  de escopo também no backend (`convite-usuario-global/spec.md`).

## Conformidade com a Constituição

- **Artigos aplicáveis:** B6 (contrato-first — REQ-01/02 espelham o schema
  novo), B9/F10 (ownership e escopo — REQ-03/04 são a UI da regra de dono
  já existente no backend), F2 (stores por domínio: `usuarios.ts` para o
  fluxo por-empresa, `admin.ts` para o global), F9 (teste de navegação por
  perfil: precisa provar que o não-dono não vê o botão, e que o dono/global
  veem), Artigo III (zero cálculo no front — validação de CPF é regra de
  formato, não cálculo de domínio; a autoridade final continua sendo o
  servidor).
- **Emenda necessária?** Não.

## Pontos a clarificar

- Nenhum em aberto — modelo de senha confirmado pelo usuário ("senha
  conforme já vem funcionando" = mantém convite + senha provisória, sem
  campo de senha no formulário).

---
**Próximo passo:** `/plan`

## Implementação 2026-08-07

Implementado no front, contra o contrato já descrito no `plan.md` (backend em
paralelo, outro repo). Todos os critérios de aceite cobertos.

**Arquivos tocados:**
- `src/types/index.ts` — `Usuario` ganha `cpf`/`dataNascimento`.
- `src/graphql/operations/acesso.ts` — `CAMPOS_USUARIO` ganha os dois campos.
- `src/graphql/operations/usuarios.ts` — `CONVIDAR_USUARIO` ganha
  `cpf`/`dataNascimento`; mutation nova `ATUALIZAR_USUARIO`; `USUARIOS` ganha
  os dois campos na seleção.
- `src/graphql/operations/admin.ts` — `CONVIDAR_USUARIO_GLOBAL` ganha os
  mesmos campos; `CAMPOS_USUARIO_ADMIN` ganha os dois campos.
- `src/composables/useCpf.ts` (novo) + `useCpf.spec.ts` (novo) —
  `formatarCpf`/`validarCpf`.
- `src/auth/autorizacao.ts` — `souDonoDaEmpresa(usuario, empresa)`; testes
  novos em `autorizacao.spec.ts`.
- `src/stores/usuarios.ts` — `convidar(...)` recebe `cpf`/`dataNascimento`;
  action nova `atualizar(...)`.
- `src/stores/admin.ts` — `convidarGlobal(...)` ganha os campos novos; action
  nova `atualizarUsuarioAdmin(...)` (importa `ATUALIZAR_USUARIO` de
  `usuarios.ts`, não duplica).
- `src/components/ui/UsuarioFormModal.vue` (novo) — cadastro/edição
  reaproveitado por-empresa e global via prop `modoGlobal`.
- `src/views/UsuariosView.vue` — botão "Cadastrar Usuário" e ação "Editar"
  por card, ambos restritos a `souDonoDaEmpresa(...) || auth.adminGlobal`;
  modal inline antigo removido.
- `src/views/admin/AdminUsuariosView.vue` — modal "Cadastrar Usuário Global"
  migrado para `UsuarioFormModal`; ação "Editar" por linha da tabela.
- `src/test/fixtures.ts` — `cpf`/`dataNascimento` nos 8 usuários existentes;
  usuário novo **Fernando Costa** (PROPRIETARIO vinculado a emp-001, **não**
  o dono) — fixture dedicada ao critério de aceite do não-dono.
- `src/test/servidor-falso.ts` — `usuarioGql` devolve os campos novos;
  `convidarUsuario` estreita a autorização (dono ou escopo global) e recusa
  CPF duplicado; `convidarUsuarioGlobal` recusa CPF duplicado; mutation nova
  `atualizarUsuario` (autorização de dono/global, recusa CPF/e-mail
  duplicado).
- `src/test/cadastro-usuario.spec.ts` (novo) — teste de navegação por perfil
  (F9): dono vê e cadastra, PROPRIETARIO não-dono não vê, admin global vê em
  qualquer empresa e na tela global; edição persiste e sobrevive a novo
  fetch; e-mail duplicado e não-dono recusados ao editar.
- `src/test/catalogo.spec.ts` — assinatura nova de `convidar(...)` nos testes
  existentes; casos novos de CPF duplicado e de não-dono/não-global recusado.
- `src/test/admin-gestao-site.spec.ts` — contagem de equipe de emp-001
  ajustada de 4 para 5 membros (Fernando entrou na fixture).

**Resultado dos testes:** `npm run build` (vue-tsc + vite build) passou sem
erros. `npx vitest run` — 191 testes, 16 arquivos, todos passando.

**Decisões não 100% cobertas pela spec/plan, tomadas durante a implementação:**
- `souDonoDaEmpresa` aceita `Usuario | null` e `Empresa | null` (não só os
  tipos não-nulos do REQ-03) porque os valores reais em `UsuariosView.vue`
  são `auth.user` (`Usuario | null`) e `empresaStore.empresa` (`Empresa |
  null`) — os nomes exatos dos stores, conferidos em `auth.ts`/`empresa.ts`.
- `UsuarioFormModal` filtra a lista de perfis internamente
  (`perfis.filter(p => p.escopoGlobal)` quando `modoGlobal`) em vez de cada
  consumidor filtrar antes de passar a prop — os dois lugares agora sempre
  passam `store.perfis` cru, e o componente decide, como o `plan.md` descreve
  a prop `modoGlobal`.
- O servidor falso precisou de uma fixture nova (Fernando Costa) porque
  nenhum usuário existente representava "PROPRIETARIO vinculado que não é o
  dono" — cenário central do critério de aceite 2, mas que não existia antes
  desta feature. Isso alterou a contagem de equipe de emp-001 num teste
  pré-existente (`admin-gestao-site.spec.ts`), corrigido para 5.
- `atualizarUsuario` no servidor falso autoriza edição a quem é dono de
  **qualquer** empresa em que o alvo tem vínculo (não só a empresa ativa) —
  não estava 100% explícito no `plan.md`, mas é a leitura mais direta do
  REQ-09 ("usuário global só edita quem já está autorizado a ver ali").
