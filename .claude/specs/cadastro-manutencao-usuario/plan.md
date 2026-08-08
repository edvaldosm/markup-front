# Plano técnico — Cadastro e manutenção de usuário (CPF, data de nascimento, dono da empresa)

> Preenchido por `/plan` a partir do `spec.md`. Descreve **como** construir.
> Nenhuma decisão pode violar [constitution.md](../../constitution.md).

- **Slug:** cadastro-manutencao-usuario • **Baseado em:** spec.md • **Data:** 2026-08-07

## Abordagem

Estender os dois pontos de convite já existentes (por-empresa em
`UsuariosView.vue`/`usuarios.ts`, global em `AdminUsuariosView.vue`/
`admin.ts`) em vez de criar telas novas do zero — o padrão visual e de
estado (modal + senha provisória uma vez) já é bom e é o que o backend
continua entregando. O trabalho novo de verdade é: (1) os dois campos
(CPF/nascimento) nos dois formulários, (2) a checagem de "sou dono" para
mostrar/esconder a ação de cadastro por-empresa, e (3) um modal de edição
que reaproveita o mesmo form em modo "editar" (populate + `atualizarUsuario`
em vez de `convidar`).

## Camadas afetadas

- **Frontend:** `src/types/index.ts` (tipos), `src/auth/autorizacao.ts`
  (`souDonoDaEmpresa`), `src/graphql/operations/usuarios.ts` e `admin.ts`
  (mutations), `src/stores/usuarios.ts` e `admin.ts` (actions
  `atualizar`/`atualizarGlobal`), `src/views/UsuariosView.vue` e
  `src/views/admin/AdminUsuariosView.vue` (UI), utilitário novo
  `src/composables/useCpf.ts` (máscara + validação de dígito verificador) —
  templates: `frontend-markup` (padrão de store/rota já documentado em
  `.claude/frontend-markup/rules/`).
- **Backend (repo markup-back):** já especificado e implementado em
  `markup-back/.claude/specs/cadastro-manutencao-usuario/` — pré-requisito
  desta fatia. O contrato (schema, autorização de dono) é do outro repo;
  aqui só se consome.

## Mudanças de modelo / contrato

- **Schema GraphQL (consumido, não definido aqui):**
  ```graphql
  type Usuario { ...; cpf: String!; dataNascimento: DateTime! }
  convidarUsuario(nome, email, cpf: String!, dataNascimento: DateTime!, empresaId, perfilId): Convidado!
  convidarUsuarioGlobal(nome, email, cpf: String!, dataNascimento: DateTime!, perfilId): Convidado!
  atualizarUsuario(usuarioId: ID!, nome: String!, cpf: String!, dataNascimento: DateTime!, email: String!): Usuario!
  ```
- **Tipos do front** (`src/types/index.ts`, seção "Usuários / RBAC"):
  ```ts
  export interface Usuario {
    id: string; nome: string; email: string; cpf: string; dataNascimento: string
    ativo: boolean; empresas: VinculoEmpresa[]; perfilGlobal?: Perfil
  }
  ```
- **Migração de dados:** nenhuma no front (estado é sempre buscado do
  servidor via Apollo, sem persistência local além do cache).

## Decisões de design (requisito → decisão)

| Requisito | Decisão |
|-----------|---------|
| REQ-01/02 | `CAMPOS_USUARIO` (fragment GraphQL em `acesso.ts`) ganha `cpf dataNascimento` — propaga para todo consumidor do fragment automaticamente, sem editar cada query. `ATUALIZAR_USUARIO` fica em `usuarios.ts` (é operação de dado de pessoa, não de vínculo — `admin.ts` importa de lá em vez de duplicar, mesmo padrão já usado para `CAMPOS_PERFIL`). |
| REQ-03/04 | `souDonoDaEmpresa(usuario: Usuario, empresa: Empresa): boolean` em `autorizacao.ts`, função pura sem dependência de store (mesmo estilo de `isAdminGlobal`/`temPermissao`). `UsuariosView.vue` computa `podeCadastrar = computed(() =&gt; souDonoDaEmpresa(auth.usuario, empresaStore.empresaAtiva) \|\| auth.adminGlobal)` e usa isso para `v-if` do botão — **não** troca a checagem de `USUARIO_WRITE` que já protege a rota/menu (F9: escopo é além de permissão, não em vez dela). |
| REQ-05/11 | `useCpf.ts` expõe `formatarCpf(v: string): string` (máscara ao digitar) e `validarCpf(v: string): boolean` (dígito verificador, mesmo algoritmo do backend `Cpf` value object — duas implementações do mesmo cálculo simples, não vale a pena compartilhar pacote entre repos por isso). Formulário desabilita o submit enquanto `!validarCpf(form.cpf)`. |
| REQ-08/09 | Modal de form vira `UsuarioFormModal.vue` **novo** componente (hoje é inline dentro de `UsuariosView.vue`/`AdminUsuariosView.vue`) — mesmo padrão estrutural de `ProdutoFormModal`/`EmpresaFormModal` (`props.entidade?: Usuario`, `undefined` = criar, `watch(immediate)` popula em modo editar). Reaproveitado pelos dois consumidores (por-empresa e global) via prop `modoGlobal: boolean` que esconde o campo de perfil-por-empresa e usa o seletor de `perfisGlobais` quando `true`. |
| REQ-06/10 | Fluxo de senha provisória (exibição única + copiar) fica **só** no modo criar; modo editar não tem essa etapa — `emit('salvo', usuario)` fecha direto (sem segredo a mostrar). Erro do servidor populado em `erros: string[]` local do modal, igual ao padrão de `ProdutoFormModal`. |

## Rules aplicáveis

B6 (contrato-first), B9/F10 (ownership/escopo — REQ-03/04), F2 (stores por
domínio), F9 (teste de navegação por perfil — precisa cobrir dono vs.
não-dono vs. admin global), Artigo III (CPF é validação de formato local,
não cálculo de domínio — a mutation do servidor é quem decide de fato).

## Riscos e alternativas

- **Risco:** o backend torna `cpf`/`dataNascimento` obrigatórios nas
  mutations de convite; se o front for atualizado antes do backend estar no
  ar, `npm run build` passa mas toda chamada real quebra em runtime.
  → **Mitigação:** ordem de entrega é backend primeiro (já implementado e
  testado antes desta fatia começar, ver handoff no `tasks.md` do backend);
  `servidor-falso.ts` (mock de teste) é atualizado junto para os testes do
  front não mascararem a dependência.
- **Alternativa descartada — duplicar o formulário inteiro para
  "empresa" e "global":** rejeitada porque os campos são 90% os mesmos; a
  única diferença real é a origem do perfil (perfis por-empresa vs.
  `perfisGlobais`) e a ausência de `empresaId` — resolvido com uma prop,
  não dois componentes.
- **Alternativa descartada — checar "sou dono" só no servidor, sem
  esconder o botão no front:** rejeitada porque deixaria um não-dono ver o
  botão, clicar, preencher o formulário inteiro e só então tomar erro — pior
  experiência sem ganho de segurança (o servidor já é a autoridade real de
  qualquer forma, REQ-04 é só sobre o que a tela oferece).

---
**Próximo passo:** `/tasks`
