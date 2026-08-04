# Spec — Integração com o backend: catálogo, usuários e perfis

> Preenchido por `/specify`. Descreve **o quê** e **por quê** — nunca o **como**
> (isso é o `plan.md`). Deve obedecer a [constitution.md](../../constitution.md).

- **Slug:** integracao-backend-catalogo
- **Status:** aprovada
- **Data:** 2026-08-03

## Problema / Objetivo

A [fatia 1](../integracao-backend-sessao-empresas/spec.md) ligou sessão e
empresas ao backend. O que o usuário faz o dia inteiro — cadastrar material,
montar ficha técnica, ajustar alíquota, lançar despesa — continua gravando em
`src/mock/data.ts`, que vive na memória do navegador: **recarregar a página
desfaz tudo**.

Há um segundo problema, mais silencioso. O mock e o banco são hoje duas cópias
do mesmo dado, e já divergem: o mock guarda `empresaId` em cada registro para
filtrar no cliente, enquanto o servidor filtra por autorização. Enquanto as duas
existirem, cada correção precisa ser feita duas vezes — e a que for esquecida
vira um número errado na tela.

Esta é a **fatia 2 de 3**. Ela liga o catálogo (produtos, materiais, impostos,
despesas fixas) e as telas de usuários e perfis. A fatia 3 fecha com
precificação, Gestão do Site, assistente e relatórios — e só então
`useMarkupCalculator` e `src/mock/` são apagados.

## Histórias de usuário

- Como **usuário**, quero que o que eu cadastrar continue lá amanhã.
- Como **proprietário**, quero que o custo de um produto reflita a ficha técnica
  que o servidor calculou, não uma conta que o navegador refez por conta própria.
- Como **usuário de duas empresas**, quero que trocar de empresa troque o
  catálogo inteiro, sem sobra da anterior.
- Como **proprietário**, quero convidar alguém para minha empresa e entregar a
  senha provisória.

## Requisitos

> Testáveis, com MUST/SHOULD. IDs `REQ-01`, `REQ-02`…

### Leitura do catálogo

- **REQ-01 (MUST):** Produtos, materiais, impostos e despesas fixas vêm do
  servidor, consultados **pela empresa ativa**. Nenhuma tela filtra a lista por
  empresa no cliente — o servidor já devolve o conjunto certo (B2/B9).
- **REQ-02 (MUST):** Trocar de empresa recarrega o catálogo. Nenhum registro da
  empresa anterior pode permanecer visível durante ou depois da troca.
- **REQ-03 (MUST):** `custoBase` e `percentualImpostos` de um produto são
  **lidos do servidor** (C1/C3), nunca recalculados no front (B1). O cálculo
  local correspondente sai do `useMarkup`.
- **REQ-04 (MUST):** A ficha técnica exibe o material com nome e unidade vindos
  do servidor, sem o front cruzar id contra a lista de materiais em memória.
  *Motivo:* hoje o front ignora em silêncio material órfão e subestima o custo;
  no backend isso é erro explícito (guarda V6).

### Escrita

- **REQ-05 (MUST):** Criar e editar produto grava no servidor, com ficha técnica
  e impostos vinculados. Falha do servidor mantém o formulário aberto com a
  mensagem, sem fingir que salvou.
- **REQ-06 (MUST):** Criar e editar material, imposto e despesa fixa gravam no
  servidor.
- **REQ-07 (MUST):** Ajustar a margem de lucro de um produto grava no servidor.
- **REQ-08 (MUST):** Ativar/inativar despesa fixa grava no servidor, e o rateio
  exibido reflete o novo estado.
- **REQ-09 (MUST):** A ação **"Remover" da despesa fixa vira "Inativar"**.
  *Motivo:* o contrato não tem exclusão, e não deve ter — despesa fixa entra no
  rateio que formou preços já praticados; apagá-la destrói a explicação daqueles
  preços. Inativar produz o mesmo efeito no cálculo (a despesa sai do rateio)
  preservando o histórico.
- **REQ-10 (MUST):** Some do código a remoção de produto e material — funções
  `remover()` que **nenhuma tela chama** e que o contrato não suporta.

### Estado que o contrato não permite mudar

- **REQ-11 (MUST):** `Produto.ativo` é exibido como **somente leitura**: o badge
  Ativo/Inativo continua, alimentado pelo servidor, e o formulário deixa de
  oferecer o campo. `ProdutoInput` não tem `ativo` e não existe mutation de
  alternância — oferecer o controle seria prometer o que o servidor recusa.
  Fica registrada a **pendência para o markup-back** (ver "Pendências").
- **REQ-12 (MUST):** A tela de Perfis vira **somente leitura**. Não existe
  mutation de perfil, por decisão do contrato: `perfil` é dado de sistema, nasce
  no Flyway, e PROPRIETARIO tem `PERFIL_WRITE` — escrita de perfil seria escalada
  para administrador global de toda a base.

### Usuários

- **REQ-13 (MUST):** A lista de usuários e a de perfis vêm do servidor.
- **REQ-14 (MUST):** Cadastro de usuário acontece **por convite**: informar nome,
  e-mail, empresa e perfil devolve uma **senha provisória**, exibida **uma única
  vez** e com aviso explícito de que não é recuperável depois.
- **REQ-15 (MUST):** Some a criação direta de usuário que existia no protótipo —
  não há auto-cadastro no contrato.

### Transversais

- **REQ-16 (MUST):** Cada tela distingue *sem registros* de *falha ao carregar*,
  reaproveitando a classificação de erro da fatia 1. Lista vazia por erro de rede
  é proibida.
- **REQ-17 (SHOULD):** A paginação por rolagem infinita continua no cliente
  (FR04): o contrato devolve lista simples, sem paginação de servidor. Se o
  volume exigir, vira spec própria — não se resolve improvisando aqui.
- **REQ-18 (MUST):** Os stores desta fatia deixam de importar `src/mock/`.
  Ao fim dela, o mock só serve às telas da fatia 3 e às fixtures de teste.
- **REQ-19 (MUST):** Os tipos do front espelham o schema:
  | Front hoje | Schema (fonte de verdade) |
  |---|---|
  | `Produto.materiais: ProdutoMaterial[]` | `ficha: [ItemFichaTecnica!]!`, com o `Material` completo embutido |
  | `Produto.impostos: ProdutoImposto[]` (com alíquota própria) | `impostos: [Imposto!]!` |
  | `Produto.empresaId`, `Produto.createdAt` | não existem |
  | `Produto.tipo` opcional | obrigatório |
  | `Produto` sem `custoBase`/`percentualImpostos` | ambos existem, calculados |
  | `Material.empresaId`, `DespesaFixa.empresaId` | não existem |
  | `Material.tipo` opcional | obrigatório na leitura, opcional na escrita |
  | `Empresa` sem `despesasFixas` | existe como campo aninhado (pendente da fatia 1) |

## Critérios de aceite

- [ ] Cadastrar um material, recarregar a página e ele continua lá.
- [ ] Montar produto com ficha técnica e impostos, salvar, e o `custoBase`
      exibido é o que o servidor devolveu — não um número recalculado no front.
- [ ] Trocar de empresa troca o catálogo inteiro; nenhum item da anterior sobra.
- [ ] Inativar despesa fixa muda o percentual de rateio exibido.
- [ ] Convidar usuário mostra a senha provisória uma vez, com aviso.
- [ ] Perfis abre em modo leitura, sem ação de edição.
- [ ] Produto exibe Ativo/Inativo, e o formulário não oferece o campo.
- [ ] Backend derrubado ⇒ cada tela mostra indisponibilidade, não lista vazia.
- [ ] Usuário sem permissão de escrita não vê a ação (e o servidor a recusaria).
- [ ] Nenhum store desta fatia importa `src/mock/`.
- [ ] `npm run build` e `npm test` passam.

## Fora de escopo

- `precificarProduto` / `precificarTodos`, faixa de negociação e o breakdown —
  fatia 3.
- Remoção do `useMarkupCalculator` — sai com a precificação, na fatia 3.
  Nesta fatia ele **encolhe**: perde `calcularCustoBase` e a soma de alíquotas.
- Gestão do Site, assistente e relatórios — fatia 3.
- Paginação de servidor e busca no servidor.
- Exclusão de qualquer registro (o contrato não tem, e REQ-09 explica por quê).

## Conformidade com a Constituição

- **Artigos aplicáveis:** B1 (cálculo no backend — REQ-03), B2/B9 (isolamento por
  empresa — REQ-01), B5 (RBAC por operação), B6 (contrato-first — REQ-19),
  B11 (guardas de cálculo — REQ-04), F2 (stores por domínio), F4 (paginação),
  F5 (formatação no front), F6 (camada GraphQL isolada), F9 (teste por perfil),
  Artigo III (números crus do backend).
- **Emenda necessária?** Não. A emenda ao **F6** já está registrada na fatia 1 e
  se conclui na fatia 3, quando `MOCK_MODE` e `src/mock/` desaparecem.

## Pendências abertas para o markup-back

Nenhuma bloqueia esta fatia; ambas mudam o contrato e são decisão do outro repo.

1. **`Produto.ativo` não é editável.** O tipo expõe o campo para leitura, mas
   `ProdutoInput` não o tem e não há mutation de alternância. Decidir entre
   acrescentar `ativo` ao input ou criar `toggleProduto` — hoje um produto nasce
   ativo e não há como inativá-lo por nenhuma via da API.
2. **Sem exclusão em todo o contrato.** Aceito e deliberado para despesa fixa
   (REQ-09). Se algum dia surgir necessidade real de excluir cadastro, é spec
   própria, com a pergunta do histórico respondida antes.

## Pontos a clarificar

- Nenhum em aberto.

---
**Próximo passo:** `/plan`
