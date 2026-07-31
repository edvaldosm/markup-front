# Tarefas — <NOME DA FEATURE>

> Preenchido por `/tasks` a partir do `plan.md`. Lista ordenada, pequena e
> rastreável. Cada tarefa referencia o requisito (`REQ-xx`) e o arquivo/skill alvo.

- **Slug:** <slug>  •  **Baseado em:** plan.md  •  **Data:** <AAAA-MM-DD>

## Legenda

`[ ]` pendente · `[~]` em andamento · `[x]` concluída · **dep:** depende de

## Backend

- [ ] **T-B1** (REQ-01) — <ação> · alvo: `internal/service/…` · done: <critério>
- [ ] **T-B2** (REQ-02) — <ação> · alvo: `graph/schema.graphqls` · dep: T-B1

## Frontend

- [ ] **T-F1** (REQ-01) — <ação> · alvo: `src/views/…` · done: <critério>

## Verificação

- [ ] Backend: `go build ./...`
- [ ] Frontend: `npm run build`
- [ ] Critérios de aceite do `spec.md` satisfeitos

---
**Próximo passo:** implementar (ou `recriar-*` para scaffold total).
