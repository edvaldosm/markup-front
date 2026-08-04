# Plano técnico — Integração com o backend: precificação e auditoria de cálculo zero

> Preenchido por `/plan` a partir do `spec.md`. Descreve **como** construir.
> Nenhuma decisão pode violar [constitution.md](../../constitution.md).

- **Slug:** integracao-backend-precificacao  •  **Baseado em:** spec.md  •  **Data:** 2026-08-04

## Abordagem

Duas frentes independentes, que só compartilham o composable `useMarkup.ts`:

1. **Ligar o que o backend já entrega.** `precificarProduto`/`precificarTodos`
   existem e nunca foram consumidos. Isso não é trabalho novo de backend — é
   dívida de conexão. Vira store próprio (`precificacao.ts`), porque
   precificação não é dado de catálogo: é derivado, muda quando o catálogo muda,
   e não faz sentido cachear do mesmo jeito que produto ou material.

2. **Desligar o que o backend não entrega.** Fator R por empresa e simulação
   "e se" não têm capacidade equivalente hoje. A escolha (REQ-05) não é
   reimplementar mais fraco nem manter calando — é **desativar com aviso**,
   deixando o componente pronto para religar assim que a pendência (REQ-06)
   for atendida do outro lado. Mesmo padrão para as agregações (REQ-07/08).

`useMarkupCalculator` sai quase inteiro: sobra só o que **não é fórmula de
domínio** — se sobrar algo, é utilitário de formatação, que já mora em
`useCurrency` mesmo. A expectativa é o arquivo encolher para praticamente nada,
e a existência dele deixar de fazer sentido — mas a remoção do arquivo inteiro
só acontece se nenhum resquício válido restar, verificado ao final.

### Por que um store novo, e não estender `produtos.ts`

`ResultadoPrecificacao` referencia `Produto`, mas não é o mesmo tipo de dado:
produto é cadastro (muda por ação do usuário no formulário), precificação é
saída de uma consulta (muda quando *qualquer* insumo do custo muda — material,
imposto, despesa, margem). Misturar no store de produtos criaria uma reatividade
implícita difícil de rastrear: quem depende de precificação teria que saber
"invalidar" um campo dentro do store errado. Separado, fica explícito: quem
precisa do preço chama `precificacao.buscarProduto(id)` ou
`precificacao.buscarTodos()`.

## Camadas afetadas

- **Frontend:**
  - `src/graphql/operations/precificacao.ts` — `PRECIFICAR_PRODUTO`,
    `PRECIFICAR_TODOS`.
  - `src/stores/precificacao.ts` — novo, template `store-pinia-dominio`.
  - `src/composables/useMarkup.ts` — poda até sobrar praticamente nada.
  - `src/views/DashboardView.vue`, `PrecificacaoView.vue`,
    `ProdutoDetalheView.vue`, `RelatoriosView.vue` — trocam
    `calcularPrecificacao`/`calcularFaixaNegociacao` por dado do store novo.
  - `src/views/EmpresaView.vue`, `FatorRView.vue`,
    `src/components/ui/EmpresaFormModal.vue` — Fator R local **desativado**,
    com componente de aviso reutilizável.
  - `src/stores/despesas.ts` (some `totalMensal`), `src/views/DespesasFixasView.vue`,
    `src/views/RelatoriosView.vue` (some `custoTotalMateriais`).
  - `src/test/servidor-falso.ts` — `precificarProduto`/`precificarTodos`,
    replicando a fórmula do backend (mesma disciplina da T-F5 da fatia 2: o
    servidor falso mente como o `CalculadoraDeMarkup.java` mente).
- **Backend (repo markup-back):** nenhuma mudança nesta fatia — as cinco
  pendências do `spec.md` são para depois, noutro repo.

## Mudanças de modelo / contrato

- **Schema GraphQL:** nenhuma (consumo de operações existentes).
- **Tipos do front:**
  - `ResultadoPrecificacao` ganha `produto: Produto` e `faixaNegociacao:
    FaixaNegociacao` aninhado (hoje `calcularFaixaNegociacao` é chamada à
    parte; no contrato já vem dentro do resultado — a chamada extra desaparece
    junto com a função).
  - Novo `ResultadoPrecificacaoEntrada`? Não — não há input aqui, só query.
- **Migração de dados:** nenhuma.

## Decisões de design (requisito → decisão)

| Requisito | Decisão |
|-----------|---------|
| REQ-01 | `precificacao.buscarProduto(produtoId)` chama `PRECIFICAR_PRODUTO`, guarda em `Map<produtoId, ResultadoPrecificacao>`. `ProdutoDetalheView` e `PrecificacaoView` leem daí. |
| REQ-02 | `precificacao.buscarTodos()` chama `PRECIFICAR_TODOS(empresaId)`, guarda a lista inteira; reage à troca de empresa via `recursoDaEmpresaAtiva`, igual aos stores da fatia 2. `DashboardView` e `RelatoriosView` leem daí — **uma consulta**, não uma por produto. |
| REQ-03 | `calcularPrecificacao` e `calcularFaixaNegociacao` removidas de `useMarkup.ts`. |
| REQ-04 | Erro de `precificarProduto`/`precificarTodos` (ex. `DivisorInviavel`, BAD_REQUEST) vira `erro` no store, classificado por `mensagemDeErro`; a tela mostra a mensagem, não `precoVenda: 0`. |
| REQ-05 | Componente `IndisponivelBackend.vue`: recebe o texto do motivo, renderiza um aviso padronizado. As quatro superfícies o usam no lugar do número calculado; o JS que fazia a conta é removido, não comentado — código morto que "pode vir a ser religado" é código que ninguém audita depois. |
| REQ-06 | Pendências redigidas no `spec.md`, prontas para virar issue — nenhuma ação de código aqui. |
| REQ-07 | `despesas.ts` perde `totalMensal`. `DespesasFixasView` usa `IndisponivelBackend` no card de total. |
| REQ-08 | `RelatoriosView` idem para `custoTotalMateriais`. |
| REQ-09 | Pendência no `spec.md`. |
| REQ-10 | Nenhuma mudança de código (`admin.ts` fora de escopo) — o requisito é sobre a *próxima* spec, registrado aqui para não se perder. |
| REQ-11 | `IndisponivelBackend` sempre recebe um motivo textual — não existe uso do componente sem explicação. |
| REQ-12 | As 5 pendências do `spec.md` seguem o formato: o que falta, por que falta, quem usa. |

## Rules aplicáveis

- **B1** + **Artigo III v2.5.0** — o ponto inteiro desta fatia.
- **F6** — a emenda pendente desde a fatia 1 se conclui aqui: `useMarkup.ts`
  deixa de ter fórmula de precificação, e a nota na Rule FR06 pode ser
  atualizada para refletir isso (ver Riscos).
- **B11** — erro de guarda (V1, divisor inviável) chega como erro do servidor,
  não como número absurdo.

## Riscos e alternativas

- **`useMarkup.ts` pode não ficar totalmente vazio** — `useCurrency` mora no
  mesmo arquivo hoje. Se sobrar só isso, o arquivo é renomeado/movido para
  refletir que não é mais "calculadora", só formatação — decisão tomada na
  hora, documentada no `tasks.md` quando acontecer.
- **`FR06-camada-graphql-isolada.md` tem uma nota de emenda pendente desde a
  fatia 1**, dizendo que a reescrita acontece "ao fim da fatia 3". Esta fatia
  não é mais "a fatia 3 completa" (virou só precificação + auditoria) — a nota
  precisa ser ajustada para apontar a conclusão real: quando `src/mock/` for
  apagado, o que só acontece depois de Gestão do Site também migrar. Ajustar o
  texto agora para não prometer algo que esta fatia sozinha não entrega.
- **Servidor falso replicando `CalculadoraDeMarkup.java`** — mesmo risco da
  fatia 2 (T-F5): se a fórmula divergir da real, os testes provam o
  comportamento errado. Mitigação igual: ler o `.java` antes de escrever,
  não deduzir do schema.
- **Desativar 4 superfícies de UI é regressão de funcionalidade visível** — não
  há forma de evitar dado o que a REQ-05 pede e o que o backend não tem. O
  aviso precisa deixar claro que é temporário e por quê, para não parecer bug.

---
**Próximo passo:** `/tasks`
