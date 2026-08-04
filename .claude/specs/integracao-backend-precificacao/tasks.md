# Tarefas — Integração com o backend: precificação e auditoria de cálculo zero

> Preenchido por `/tasks` a partir do `plan.md`. Lista ordenada, pequena e
> rastreável. Cada tarefa referencia o requisito (`REQ-xx`) e o arquivo/skill alvo.

- **Slug:** integracao-backend-precificacao  •  **Baseado em:** plan.md  •  **Data:** 2026-08-04

## Legenda

`[ ]` pendente · `[~]` em andamento · `[x]` concluída · **dep:** depende de

## Backend

Nenhuma tarefa: `precificarProduto`/`precificarTodos` já existem e estão no ar.
Pré-requisito de ambiente: backend com perfil `dev` (seed `V900`).

**5 pendências registradas** no `spec.md` para o outro repo — nenhuma bloqueia
esta fatia; todas bloqueiam as 4 superfícies desativadas na T-F6.

## Frontend

### Precificação real

- [x] **T-F1** (REQ-01, REQ-02) — Tipos: `ResultadoPrecificacao` ganha
  `produto: Produto` e `faixaNegociacao: FaixaNegociacao` aninhado · alvo:
  `src/types/index.ts` · done: espelha `.graphqls` exatamente.
- [x] **T-F2** (REQ-01, REQ-02) — Documentos gql `PRECIFICAR_PRODUTO`,
  `PRECIFICAR_TODOS` · alvo: `src/graphql/operations/precificacao.ts` ·
  dep: T-F1 · done: cada um pede exatamente os campos usados pelas telas.
- [x] **T-F3** (REQ-01, REQ-02, REQ-04) — Servidor falso implementa as duas
  operações, replicando `CalculadoraDeMarkup.java` (ler o arquivo antes de
  escrever, não deduzir do schema) · alvo: `src/test/servidor-falso.ts` ·
  dep: T-F2 · done: teste próprio confere `precoVenda`/`divisorMarkup` contra
  um cálculo de referência, e que `DivisorInviavel` vira erro, não preço zero.
- [x] **T-F4** (REQ-01, REQ-02, REQ-04) — Store `precificacao.ts`:
  `buscarProduto(id)` (mapa por id), `buscarTodos()` (reativo à empresa ativa
  via `recursoDaEmpresaAtiva`), `erro` · alvo: `src/stores/precificacao.ts` ·
  dep: T-F3 · skill: `store-pinia-dominio` · done: `buscarTodos` faz **uma**
  consulta, não N.
- [x] **T-F5** (REQ-01, REQ-02, REQ-03) — Views trocam `useMarkupCalculator`
  pelo store novo: `DashboardView`, `PrecificacaoView` (modo real, não o
  manual), `ProdutoDetalheView`, `RelatoriosView` · dep: T-F4 · done: nenhuma
  dessas telas chama `calcularPrecificacao`/`calcularFaixaNegociacao`.
  **Achado durante a implementação:** `PrecificacaoView` calculava
  `custoRecuperado / precoVenda * 100` para a barra/label de "Custo de
  Produção" — trocado por `100 - resultado.somaTotalPercentuais`, complemento
  de um campo que o próprio backend devolve (não é fórmula nova; verificado ao
  vivo: 100 − 59,14% = 40,86%, bate exato).

### Auditoria — fórmula de domínio desativada

- [x] **T-F6** (REQ-05, REQ-11) — Componente `IndisponivelBackend.vue`: texto
  do motivo + estilo padronizado · alvo: `src/components/ui/IndisponivelBackend.vue` ·
  done: usado por toda tela das próximas 4 tarefas, sempre com motivo.
- [x] **T-F7** (REQ-05) — `EmpresaView`: remove o `computed` de Fator R do
  formulário, substitui pela exibição de indisponibilidade · alvo:
  `src/views/EmpresaView.vue` · dep: T-F6.
- [x] **T-F8** (REQ-05) — `EmpresaFormModal`: idem · alvo:
  `src/components/ui/EmpresaFormModal.vue` · dep: T-F6.
- [x] **T-F9** (REQ-05) — `FatorRView`: remove a exibição principal calculada
  e o simulador "e se"; toda a tela vira aviso de indisponibilidade (é a tela
  inteira que depende da capacidade que falta) · alvo:
  `src/views/FatorRView.vue` · dep: T-F6.
- [x] **T-F10** (REQ-05) — `PrecificacaoView`: remove o modo "simulação
  manual"; o modo real (produto existente) segue via T-F5 · alvo:
  `src/views/PrecificacaoView.vue` · dep: T-F6, T-F5.

### Auditoria — agregação desativada

- [x] **T-F11** (REQ-07) — `despesas.ts` perde `totalMensal` · alvo:
  `src/stores/despesas.ts` · done: nenhum `reduce` de soma no store.
- [x] **T-F12** (REQ-07) — `DespesasFixasView`: card de total usa
  `IndisponivelBackend` · alvo: `src/views/DespesasFixasView.vue` ·
  dep: T-F11, T-F6.
- [x] **T-F13** (REQ-08) — `RelatoriosView` perde `custoTotalMateriais`,
  substituído por `IndisponivelBackend` · alvo: `src/views/RelatoriosView.vue` ·
  dep: T-F6. **Achados na mesma varredura, corrigidos junto:** o "% do
  Faturamento" por despesa (linha a linha) em `RelatoriosView` **e** em
  `DespesasFixasView` (duplicado, tabelas diferentes) fazia
  `valorMensal / faturamento * 100` sem campo equivalente no contrato — gateado
  nas duas telas. **Fora de escopo, registrado para depois:**
  `AdminEmpresaDetalheView.vue` (Gestão do Site, ainda 100% mock) tem a mesma
  conta de Fator R que `EmpresaView`/`FatorRView` — não corrigido aqui porque o
  resto de `admin.ts` não migrou nesta fatia; anotado em
  `integracao-backend-gestao-site/spec.md`, REQ-03.

### Poda final e documentação

- [x] **T-F14** (REQ-03) — `useMarkup.ts` só tinha `useCurrency` sobrando →
  renomeado para `src/composables/useCurrency.ts`; os 13 arquivos que
  importavam `useCurrency` dali foram atualizados · dep: T-F5, T-F7…T-F10 ·
  done: `grep -rn "calcularPrecificacao\|calcularFaixaNegociacao\|calcularFatorR\|resolverAnexo" src/`
  vazio; `src/composables/useMarkup.ts` não existe mais.
- [x] **T-F15** — Ajustar a nota de emenda pendente em
  `frontend-markup/rules/FR06-camada-graphql-isolada.md`: não promete mais
  "reescrita ao fim da fatia 3" (esta fatia não é mais o fim) — aponta para
  quando `src/mock/` for de fato apagado (depende da Gestão do Site migrar) ·
  alvo: `.claude/frontend-markup/rules/FR06-camada-graphql-isolada.md`.
- [x] **T-F16** — Criar o esqueleto da próxima spec,
  `integracao-backend-gestao-site` (`spec.md` só com título, histórias e o
  requisito de usar `metricasDaBase` em vez de recalcular — REQ-10 desta spec
  vive lá) · alvo: `.claude/specs/integracao-backend-gestao-site/spec.md`.

### Testes

- [x] **T-F17** (REQ-01, REQ-02) — Teste do store de precificação: uma
  consulta para `buscarTodos`, erro do servidor não vira preço zero · alvo:
  `src/test/precificacao.spec.ts` · dep: T-F4.
- [x] **T-F18** (REQ-11) — Teste de `IndisponivelBackend`: sempre renderiza o
  motivo passado, nunca aparece sem texto · alvo:
  `src/components/ui/IndisponivelBackend.spec.ts` · dep: T-F6.
- [x] **T-F19** — `faixa-negociacao.spec.ts` reescrito para testar
  `faixaNegociacaoGql`/`precificarGql`, exportados de `servidor-falso.ts` ·
  dep: T-F3, T-F14 · done: mesmas 9 asserções de antes, agora contra a réplica
  da fórmula real (que por sua vez é o que toda a suíte usa para responder
  `precificarProduto`/`precificarTodos` — um erro aqui seria erro silencioso em
  todo o resto dos testes).

## Verificação

- [x] `npm run build` (inclui `vue-tsc`) sem erro
- [x] `npm test` verde — 164 testes
- [x] `grep -rn "calcularPrecificacao\|calcularFaixaNegociacao\|calcularFatorR\|resolverAnexo" src/` vazio
- [x] `grep -rn "totalMensal\|custoTotalMateriais" src/stores src/views` só
      aponta para o comentário explicativo em `despesas.ts`; nenhum `reduce`
      de soma restante em código de aplicação
- [x] Verificação manual contra o backend em `dev`: Dashboard, detalhe de
      produto e a calculadora de precificação mostram **R$ 27,68** consistente
      nos três lugares (Bolo de Cenoura, Doces da Ana); ficha com 8 ingredientes
      resolvidos; faixa de negociação com 5 degraus vinda do backend; Fator R
      da NexaTech confirmado como 32,91% na fatia 1 continua não recalculado
- [x] As telas desativadas (`FatorRView` inteira; `EmpresaView`,
      `EmpresaFormModal`, `PrecificacaoView` parcialmente) mostram aviso com
      motivo — nenhuma tela em branco
- [x] Lista de pendências do `spec.md` (5 itens) revisada e pronta para virar
      issue no `markup-back`

---
**Próximo passo:** implementar, começando por T-F1.
