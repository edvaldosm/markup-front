# Rule R02 — Isolamento multi-empresa por JWT

**Categoria:** Segurança / Multi-tenant
**Origem:** IniciandoBackEndMarkup.md §3, §7

## Regra

**Toda query deve filtrar por `empresa_id`** obtido do JWT do usuário
autenticado (via a relação `USUARIO_EMPRESA`). Nenhum resolver retorna dados de
uma empresa diferente da do token.

- O `empresa_id` viaja como claim no JWT e é lido a cada request:
  `empresaID := claims["empresa_id"].(string)`.
- Um usuário pode pertencer a várias empresas (N:M em `USUARIO_EMPRESA`), cada
  uma com perfil diferente — o token vale para **uma** empresa por sessão.

## Por quê

Sem esse filtro, um usuário autenticado poderia ler/alterar dados de outra
empresa. É a fronteira de isolamento do sistema multi-tenant. Ver
[[R05-autorizacao-rbac]] e [[auth-jwt-gin]].
