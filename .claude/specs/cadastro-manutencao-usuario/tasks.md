# Tarefas — Cadastro e manutenção de usuário (CPF, data de nascimento, dono da empresa)

> Preenchido por `/tasks` a partir do `plan.md`. Lista ordenada, pequena e
> rastreável. Cada tarefa referencia o requisito (`REQ-xx`) e o arquivo/skill alvo.

- **Slug:** cadastro-manutencao-usuario • **Baseado em:** plan.md • **Data:** 2026-08-07

## Legenda

`[ ]` pendente · `[~]` em andamento · `[x]` concluída · **dep:** depende de

## Backend

- [x] Especificado e implementado em
      `markup-back/.claude/specs/cadastro-manutencao-usuario/` — pré-requisito
      desta fatia (schema com `cpf`/`dataNascimento`, `atualizarUsuario`,
      autorização de dono em `convidarUsuario`).

## Frontend

- [x] **T-F1** (REQ-01) — `Usuario` ganha `cpf`/`dataNascimento`; fragment
      `CAMPOS_USUARIO` (`graphql/operations/acesso.ts`) ganha os dois campos
      · alvo: `src/types/index.ts`, `src/graphql/operations/acesso.ts`
- [x] **T-F2** (REQ-11) — `useCpf.ts`: `formatarCpf`/`validarCpf` (dígito
      verificador) · alvo: `src/composables/useCpf.ts` · done: teste unitário
      cobrindo CPF válido, dígito errado, tamanho errado, dígitos repetidos
- [x] **T-F3** (REQ-03) — `souDonoDaEmpresa(usuario, empresa): boolean` ·
      alvo: `src/auth/autorizacao.ts` · done: teste unitário puro (dono,
      não-dono, empresa sem dono definido não deveria ocorrer mas não deve
      lançar)
- [x] **T-F4** (REQ-01/02) — `CONVIDAR_USUARIO`/`CONVIDAR_USUARIO_GLOBAL`
      ganham `cpf`/`dataNascimento`; mutation nova `ATUALIZAR_USUARIO` ·
      alvo: `src/graphql/operations/usuarios.ts`
- [x] **T-F5** (REQ-02) — `usuarios.ts` (store): `convidar(...)` passa os
      dois campos novos; action nova `atualizar(usuarioId, nome, cpf,
      dataNascimento, email): Promise&lt;Usuario | null&gt;` · alvo:
      `src/stores/usuarios.ts` · dep: T-F4
- [x] **T-F6** (REQ-02) — `admin.ts` (store): `convidarGlobal(...)` ganha os
      dois campos novos; action `atualizarUsuarioAdmin(...)` reaproveitando
      `ATUALIZAR_USUARIO` de `usuarios.ts` (import, não duplicação) · alvo:
      `src/stores/admin.ts` · dep: T-F4
- [x] **T-F7** (REQ-05/08/09/10) — Componente novo `UsuarioFormModal.vue`
      (props `entidade?: Usuario`, `perfis: Perfil[]`, `modoGlobal?:
      boolean`; campos nome/cpf/dataNascimento/email/perfil — perfil some em
      modo editar; máscara de CPF via `useCpf`; `erros: string[]` local no
      padrão de `ProdutoFormModal`) · alvo:
      `src/components/ui/UsuarioFormModal.vue` · dep: T-F2, T-F3
- [x] **T-F8** (REQ-04/05/06) — `UsuariosView.vue`: botão "Cadastrar
      Usuário" só visível com `souDonoDaEmpresa(...) || auth.adminGlobal`;
      troca o modal inline por `UsuarioFormModal` em modo criar; mantém o
      fluxo de senha provisória única + copiar · alvo:
      `src/views/UsuariosView.vue` · dep: T-F5, T-F7
- [x] **T-F9** (REQ-08/10) — `UsuariosView.vue`: ação "Editar" por card de
      usuário (mesma visibilidade do REQ-04) abrindo `UsuarioFormModal` em
      modo editar, chamando `atualizar` · alvo: `src/views/UsuariosView.vue`
      · dep: T-F8
- [x] **T-F10** (REQ-07) — `AdminUsuariosView.vue`: modal "Cadastrar Usuário
      Global" migra para `UsuarioFormModal` (`modoGlobal=true`) com
      cpf/dataNascimento · alvo: `src/views/admin/AdminUsuariosView.vue` ·
      dep: T-F6, T-F7
- [x] **T-F11** (REQ-09) — `AdminUsuariosView.vue`: ação "Editar" por linha
      da tabela, mesmo modal em modo editar · alvo:
      `src/views/admin/AdminUsuariosView.vue` · dep: T-F10
- [x] **T-F12** — `servidor-falso.ts`/fixtures de teste: `cpf`/
      `dataNascimento` nos usuários de massa de teste; casos de
      `convidarUsuario`/`atualizarUsuario` recusados por CPF duplicado e por
      não-dono · alvo: `src/test/servidor-falso.ts`, `src/test/fixtures.ts`

## Verificação

- [x] F9 — teste de navegação por perfil: dono vê e usa "Cadastrar
      Usuário"; PROPRIETARIO vinculado que não é dono **não vê**; admin
      global vê em qualquer empresa (`src/test/navegacao-multiusuario.spec.ts`
      ou arquivo próprio da feature). Feito em `src/test/cadastro-usuario.spec.ts`
      (arquivo próprio da feature) — usa a fixture nova `Fernando Costa`
      (PROPRIETARIO vinculado a emp-001, não dono).
- [x] CPF inválido bloqueia envio sem chamar o servidor (teste de
      componente ou unitário de `useCpf`). Feito como unitário de `useCpf`
      em `src/composables/useCpf.spec.ts`.
- [x] Editar usuário persiste e sobrevive a novo fetch (mock do servidor
      falso devolvendo o registro atualizado). Feito em
      `src/test/cadastro-usuario.spec.ts`.
- [x] `npm run build`
- [x] `npm test`
- [x] Critérios de aceite do `spec.md` satisfeitos.

---
**Próximo passo:** implementar.
