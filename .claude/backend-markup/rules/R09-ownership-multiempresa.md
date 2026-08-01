# Rule R09 — Ownership multi-empresa + ADMIN global

**Categoria:** Segurança / Multi-tenant
**Origem:** Requisito do usuário (2026-07-31); refina [[R02-isolamento-multiempresa]]

## Regra

- Toda `EMPRESA` tem um **dono** (`dono_usuario_id` = quem a cadastrou).
- Um usuário comum enxerga **apenas** as empresas que:
  1. ele **possui** (é dono), ou
  2. foram **explicitamente compartilhadas** com ele (vínculo em `USUARIO_EMPRESA`).
- O perfil **ADMIN** tem **visão global** — vê e opera todas as empresas.
- O conjunto de empresas visíveis é derivado do usuário do JWT em **toda**
  consulta; nunca confiar em `empresa_id` vindo do cliente sem checar autorização.

### Exemplo (requisito literal)

Edvaldo cadastra Empresa 1 e 2; Santiago, Empresa 3 e 4; Matos, Empresa 5 e 6.
Cada um só vê as suas. Só o ADMIN vê as seis.

## Por quê

Isolamento por proprietário é a fronteira de privacidade entre clientes do
sistema; o ADMIN global é a exceção controlada para operação/suporte. Combina
com [[R02-isolamento-multiempresa]] e [[R05-autorizacao-rbac]]. Modelo de dados:
[[modelagem-der-markup]].
