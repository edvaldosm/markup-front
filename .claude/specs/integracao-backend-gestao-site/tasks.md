# Tarefas — Integração com o backend: Gestão do Site e remoção do mock

> Preenchido por `/tasks` a partir do `plan.md`. Lista ordenada, pequena e
> rastreável. Cada tarefa referencia o requisito (`REQ-xx`) e o arquivo/skill alvo.

- **Slug:** integracao-backend-gestao-site  •  **Baseado em:** plan.md  •  **Data:** 2026-08-04

## Legenda

`[ ]` pendente · `[~]` em andamento · `[x]` concluída · **dep:** depende de

## Backend

Nenhuma tarefa: as 8 operações já existem no `markup-back`.

## Frontend

### Tipos e contrato

- [ ] **T-F1** (REQ-10) — `VinculoEmpresa` sem `perfilId`/`empresa?`, `perfil`
  obrigatório; novos `EmpresaAdmin`, `MembroEquipe`, `MetricasBase` alinhados
  ao schema · alvo: `src/types/index.ts` · done: bate campo a campo.

### Documentos gql

- [ ] **T-F2** (REQ-01…REQ-08) — `TODAS_EMPRESAS`, `EMPRESA_ADMIN`,
  `TODOS_USUARIOS`, `METRICAS_DA_BASE`, `VINCULAR_USUARIO`,
  `DESVINCULAR_USUARIO`, `DEFINIR_PERFIL_NO_VINCULO`, `DEFINIR_USUARIO_ATIVO` ·
  alvo: `src/graphql/operations/admin.ts` · dep: T-F1.

### Mover a massa de teste (antes de tocar em admin.ts)

- [ ] **T-F3** (REQ-11) — Criar `src/test/fixtures.ts` com o conteúdo de
  `src/mock/data.ts`, cabeçalho novo explicando o papel (massa de teste, banco
  do servidor falso) · alvo: `src/test/fixtures.ts`.
- [ ] **T-F4** (REQ-12) — Trocar todo `from '@/mock/data'` para
  `from '@/test/fixtures'` nos arquivos de teste · alvo: `src/test/servidor-falso.ts`
  e os demais `*.spec.ts` que importam mock (conferir lista completa por
  `grep -rl "from '@/mock" src`) · dep: T-F3 · done: `npm test` verde **sem**
  `admin.ts` migrado ainda — prova que a troca de endereço não quebrou nada
  por si só.

### Servidor falso — operações de admin

- [ ] **T-F5** (REQ-01, REQ-02) — `todasEmpresas`/`empresaAdmin`: compõe
  `EmpresaAdmin` (empresa + dono + equipe + totalUsuarios) a partir das
  fixtures, só para quem tem escopo global · alvo: `src/test/servidor-falso.ts` ·
  dep: T-F4.
- [ ] **T-F6** (REQ-03) — `todosUsuarios`: escopo global vê todos · dep: T-F5.
- [ ] **T-F7** (REQ-04) — `metricasDaBase`: soma real sobre as fixtures (é
  servidor, pode calcular — a regra de zero cálculo é do front) · dep: T-F5.
- [ ] **T-F8** (REQ-08, REQ-09) — `vincularUsuario`, `desvincularUsuario`
  (recusa dono — `NaoEncontrado`/regra própria, `BAD_REQUEST` ou `FORBIDDEN`,
  conferir classificação plausível), `definirPerfilNoVinculo`,
  `definirUsuarioAtivo` · dep: T-F5.

### Store

- [ ] **T-F9** (REQ-01, REQ-04) — `admin.ts`: `fetchTudo` chama
  `todasEmpresas` + `todosUsuarios` + `metricasDaBase` em paralelo; some
  `empresasAdmin` (a junção que o backend já faz); `usuariosAdmin` continua,
  cruzando por `empresaId` · alvo: `src/stores/admin.ts` · dep: T-F2, T-F5,
  T-F6, T-F7 · skill: `store-pinia-dominio`.
- [ ] **T-F10** (REQ-02) — `buscarEmpresaAdmin(id)` via `empresaAdmin` ·
  dep: T-F9.
- [ ] **T-F11** (REQ-08) — As 4 ações de escrita chamam as mutations reais;
  cada uma recarrega `todasEmpresas` + `metricasDaBase` (não `todosUsuarios`,
  que não muda) · dep: T-F9.
- [ ] **T-F12** (REQ-05) — `metricas` não inclui mais `porSegmento`; expõe
  `usuariosInativos: null` ou omite o campo, para a tela saber que é ausência
  de dado, não zero · dep: T-F9.

### Telas

- [ ] **T-F13** (REQ-10) — `AdminEmpresaDetalheView`, `UsuariosView`: trocar
  `.perfilId` por `.perfil.id` onde se refere a `VinculoEmpresa` · dep: T-F1.
- [ ] **T-F14** (REQ-06) — `AdminEmpresaDetalheView`: Fator R vira
  `IndisponivelBackend` · dep: T-F1.
- [ ] **T-F15** (REQ-05) — Painel de métricas: `porSegmento`/`usuariosInativos`
  como `IndisponivelBackend` · alvo: `src/views/admin/AdminVisaoGeralView.vue` ·
  dep: T-F12.

### Remoção do mock

- [ ] **T-F16** (REQ-13) — Apagar `src/mock/` · dep: T-F4 concluída em todo
  arquivo, T-F9…T-F15 (nenhum código de app aponta mais para lá) · done:
  `grep -rn "from '@/mock" src/` vazio; diretório não existe.
- [ ] **T-F17** — Reescrever a Rule `FR06-camada-graphql-isolada.md` sem
  menção a `MOCK_MODE`/mock — é o gatilho que a nota de emenda pendente (desde
  a fatia 1) esperava · alvo:
  `.claude/frontend-markup/rules/FR06-camada-graphql-isolada.md` · dep: T-F16.
- [ ] **T-F18** — `MOCK_MODE`/`mockQuery` em `src/graphql/client.ts`: se
  `relatorios.ts` for o único consumidor restante (relatórios seguem
  bloqueados), manter — não é mock de dado do front, é o stopgap de PDF já
  documentado como pendente do módulo Jasper. Conferir e documentar a decisão,
  não remover às cegas · dep: T-F16.

### Testes

- [ ] **T-F19** (REQ-08, REQ-09) — Testes de escrita: vincular, desvincular
  (inclusive tentar desvincular o dono e ver a recusa), trocar perfil, ativar
  usuário · alvo: `src/test/admin-gestao-site.spec.ts` (reaproveitar/ajustar o
  que já existe) · dep: T-F11.
- [ ] **T-F20** (REQ-01, REQ-04) — Teste confirmando que `empresas` do store
  vem de `EmpresaAdmin` do servidor (não junção local) e que `metricas` bate
  com `metricasDaBase` · dep: T-F9.

## Verificação

- [ ] `npm run build` (inclui `vue-tsc`) sem erro
- [ ] `npm test` verde
- [ ] `grep -rn "from '@/mock" src/` vazio
- [ ] `ls src/mock` falha
- [ ] Verificação manual contra o backend em `dev`: Gestão do Site com empresas
      e usuários reais; vincular/desvincular/ativar sobrevive ao F5; tentar
      desvincular o dono é recusado

---
**Próximo passo:** implementar, começando por T-F1.
