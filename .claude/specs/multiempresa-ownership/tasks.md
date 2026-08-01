# Tarefas — Multi-empresa por dono + ADMIN global

- **Slug:** multiempresa-ownership  •  **Baseado em:** plan.md  •  **Data:** 2026-07-31

## Backend

- [ ] **T-B1** (REQ-01) — Flyway: coluna `dono_usuario_id` em `empresa` (FK) + backfill
- [ ] **T-B2** (REQ-01) — entidade `Empresa` com `@ManyToOne dono`; setar dono no cadastro
- [ ] **T-B3** (REQ-02/03) — `EmpresaRepository`: buscar por dono ∪ compartilhadas; ADMIN ⇒ todas
- [ ] **T-B4** (REQ-04) — `UsuarioContext.empresasAutorizadas()` + validação nos services · rules R02/R09
- [ ] **T-B5** (REQ-05) — query `minhasEmpresas` + `Empresa.dono` no controller/schema

## Frontend

- [x] **T-F1** (REQ-06) — `stores/empresa` consome `minhasEmpresas` (mock: `empresasAutorizadas`)
- [x] **T-F2** (REQ-06) — `CompanySwitcher` lista só o autorizado · skill: `roteamento-e-layout`
- [x] **T-F3** — `src/auth/autorizacao.ts`: espelho puro da R09 (dono ∪ compartilhada; ADMIN ⇒ todas)
- [x] **T-F4** — navegação por RBAC: `meta.permissao` nas rotas + guard + sidebar filtrada
- [x] **T-F5** — testes unitários (vitest): autorização, store e navegação
- [x] **T-F6** (FR09) — testes de aceite navegando como cada perfil · skill: `testes-navegacao-multiusuario`

## Verificação

- [x] Cenário multi-usuário + ADMIN no mock (4 empresas / 4 donos / 1 compartilhamento)
- [x] Seleção de empresa não autorizada é recusada (`selecionarEmpresa` ⇒ `false`)
- [x] 6 personas × 5 provas: seletor, menu, telas permitidas, telas negadas, zero vazamento
- [x] Isolamento validado por **mutação** (remover o filtro derruba 13 testes)
- [x] `npm run build` (vue-tsc OK) + `npm test` (74 testes)
- [ ] Cenário E1..E6 literal do `spec.md` — depende do backend
- [ ] Operação (`precificarProduto`) em empresa não autorizada negada — depende do backend
- [ ] `./mvnw compile` — depende do backend

> **Nota:** o front aplica a R09 sobre dados mock. A autoridade continua sendo o
> backend (`backend-java-spring`); aqui garantimos que a UI nunca oferece
> navegação para algo que o servidor negaria.

---
**Próximo passo:** implementar.
