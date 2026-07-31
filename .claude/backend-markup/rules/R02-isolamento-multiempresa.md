# Rule R02 — Isolamento multi-empresa por JWT

**Categoria:** Segurança / Multi-tenant
**Origem:** IniciandoBackEndMarkup.md §3, §7

## Regra

**Toda consulta deve restringir-se às empresas autorizadas ao usuário** do JWT.
Nenhuma operação retorna dados de empresa fora do escopo autorizado.

- Os claims do JWT trazem `id` (usuário) e `role`; as empresas visíveis são
  derivadas do usuário (empresas próprias + compartilhadas, ou **todas** se
  `role = ADMIN`) — ver [[R09-ownership-multiempresa]].
- Em Spring: obter o usuário autenticado do `SecurityContext` e aplicar o filtro
  no `service`/`repository`; **nunca** confiar em `empresaId` vindo do cliente
  sem checar autorização.
- Um usuário pode operar várias empresas (N:M em `USUARIO_EMPRESA`), com perfil
  distinto por empresa.

## Por quê

Sem esse filtro, um usuário autenticado poderia ler/alterar dados de outra
empresa. É a fronteira de isolamento do sistema multi-tenant. Ver
[[R05-autorizacao-rbac]], [[R09-ownership-multiempresa]] e [[auth-jwt-spring]].
