# Plano técnico — Multi-empresa por dono + ADMIN global

- **Slug:** multiempresa-ownership  •  **Baseado em:** spec.md  •  **Data:** 2026-07-31
- **Depende de:** `backend-java-spring`

## Abordagem

Adicionar ownership no modelo e um **filtro de autorização de empresa** central
no backend, aplicado por todos os services; ADMIN faz bypass. Front lista só o
conjunto autorizado.

## Camadas afetadas

- **Backend:** `domain/Empresa` (+`dono_usuario_id`), `EmpresaRepository`
  (consultas por dono/compartilhamento), `UsuarioContext.empresasAutorizadas()`,
  aplicação do filtro nos services — rules R02/R09.
- **Frontend:** `stores/empresa` + `CompanySwitcher` consumindo `minhasEmpresas`.

## Mudanças de modelo / contrato

- **DER:** coluna `dono_usuario_id` em `EMPRESA` (FK → USUARIO); Flyway migration.
- **Schema:** `Empresa.dono: Usuario!` e query `minhasEmpresas: [Empresa!]!`.
- **Tipos do front:** `Empresa.dono`; store usa `minhasEmpresas`.

## Decisões de design (requisito → decisão)

| Requisito | Decisão |
|-----------|---------|
| REQ-02/03 | `empresasAutorizadas()` = donas ∪ compartilhadas; se ADMIN ⇒ todas |
| REQ-04 | services recebem `empresaId` e validam contra `empresasAutorizadas()` |
| REQ-01 | ao criar empresa, setar `dono = usuário autenticado` |

## Rules aplicáveis

R09 (ownership + ADMIN), R02 (isolamento), R05 (RBAC).

## Riscos e alternativas

- Esquecer o filtro em algum service → centralizar em um helper/aspect e cobrir com teste.
- Dados legados sem dono → migration define dono default/admin.

---
**Próximo passo:** `/tasks`
