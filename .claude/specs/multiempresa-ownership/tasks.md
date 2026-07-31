# Tarefas — Multi-empresa por dono + ADMIN global

- **Slug:** multiempresa-ownership  •  **Baseado em:** plan.md  •  **Data:** 2026-07-31

## Backend

- [ ] **T-B1** (REQ-01) — Flyway: coluna `dono_usuario_id` em `empresa` (FK) + backfill
- [ ] **T-B2** (REQ-01) — entidade `Empresa` com `@ManyToOne dono`; setar dono no cadastro
- [ ] **T-B3** (REQ-02/03) — `EmpresaRepository`: buscar por dono ∪ compartilhadas; ADMIN ⇒ todas
- [ ] **T-B4** (REQ-04) — `UsuarioContext.empresasAutorizadas()` + validação nos services · rules R02/R09
- [ ] **T-B5** (REQ-05) — query `minhasEmpresas` + `Empresa.dono` no controller/schema

## Frontend

- [ ] **T-F1** (REQ-06) — `stores/empresa` consome `minhasEmpresas`
- [ ] **T-F2** (REQ-06) — `CompanySwitcher` lista só o autorizado · skill: `roteamento-e-layout`

## Verificação

- [ ] Cenário E1..E6 + ADMIN (aceite do `spec.md`)
- [ ] Operação em empresa não autorizada é negada
- [ ] `npm run build` + `./mvnw compile`

---
**Próximo passo:** implementar.
