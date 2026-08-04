# Plano técnico — Integração com o backend: catálogo, usuários e perfis

> Preenchido por `/plan` a partir do `spec.md`. Descreve **como** construir.
> Nenhuma decisão pode violar [constitution.md](../../constitution.md).

- **Slug:** integracao-backend-catalogo  •  **Baseado em:** spec.md  •  **Data:** 2026-08-03

## Abordagem

A infraestrutura já existe: a fatia 1 deixou pronto o cliente Apollo com
renovação de sessão, a classificação de erro, o registro de reset e o servidor
falso. Esta fatia é sobretudo **repetição disciplinada desse padrão** em seis
stores — e três decisões que não são repetição:

1. **Recarregar ao trocar de empresa, sem corrida.** Todo store de catálogo
   consulta pela empresa ativa e precisa reagir à troca. Duas armadilhas: (a)
   cinco cópias do mesmo `watch`, que divergem na primeira manutenção; (b)
   resposta atrasada da empresa anterior chegando **depois** da troca e
   sobrescrevendo a lista — o usuário veria produto de outra empresa, que é
   exatamente o que B2/B9 proíbem. Resolvido por um único composable
   `recursoDaEmpresaAtiva`, que centraliza o `watch` e **descarta resposta cujo
   `empresaId` não é mais o ativo**.

2. **O produto deixa de ser remontado no cliente.** Hoje `Produto.materiais`
   guarda `materialId` e a tela cruza contra a lista de materiais em memória;
   o contrato entrega `ficha` com o `Material` **embutido**. A troca não é
   cosmética: some o cruzamento por id, e com ele o bug de material órfão
   silenciosamente ignorado (guarda V6).

3. **`useMarkupCalculator` encolhe agora, não só na fatia 3.** `custoBase`,
   `percentualImpostos` (do produto) e `percentualDespesasFixas` (da empresa)
   passam a ser **lidos**. Sobra o preço de venda e a faixa, que saem na fatia 3.

### Dívida da fatia 1 que se paga aqui

O REQ-12 da fatia 1 dizia que `percentualDespesasFixas` viria do servidor.
Metade foi feita: `Empresa` carrega o valor calculado — mas **cinco telas**
(`Dashboard`, `DespesasFixas`, `Empresa`, `FatorR`, `Relatorios`) continuam
chamando `calcularPercentualDF` e refazendo a conta. Enquanto isso durar, são
duas fontes para o mesmo número. Esta fatia elimina a função.

## Camadas afetadas

- **Frontend:**
  - `src/graphql/operations/catalogo.ts` e `.../usuarios.ts` — documentos gql.
    Template: `modelo-de-dados-front`.
  - `src/composables/recursoDaEmpresaAtiva.ts` — recarga + descarte de resposta velha.
  - `src/stores/` — `produtos`, `materiais`, `impostos`, `despesas`, `usuarios`.
    Template: `store-pinia-dominio`.
  - `src/composables/useMarkup.ts` — poda.
  - `src/views/` — `Produtos`, `Materiais`, `Impostos`, `DespesasFixas`,
    `Usuarios`, `Perfis`, `FatorR`, `Empresa`, `Dashboard`, `Relatorios`,
    `ProdutoDetalhe`; `ProdutoFormModal`.
  - `src/types/index.ts` — espelho do schema.
  - `src/test/servidor-falso.ts` — as operações desta fatia.
- **Backend (repo markup-back):** **nenhuma mudança nesta fatia.** As duas
  pendências do `spec.md` (editar `Produto.ativo`; ausência de exclusão) são
  decisões do outro repo e não bloqueiam nada aqui.

## Mudanças de modelo / contrato

- **Schema GraphQL:** nenhuma. Operações consumidas: `produtos`, `produto`,
  `materiais`, `impostos`, `despesasFixas`, `usuarios`, `perfis`,
  `salvarProduto`, `ajustarMargem`, `salvarMaterial`, `salvarImposto`,
  `salvarDespesaFixa`, `toggleDespesaFixa`, `convidarUsuario`.
- **Tipos do front:**
  - `Produto`: sai `empresaId` e `createdAt`; `tipo` obrigatório;
    `materiais: ProdutoMaterial[]` → `ficha: ItemFichaTecnica[]` (com `Material`
    embutido); `impostos: ProdutoImposto[]` → `Imposto[]`; entram `custoBase` e
    `percentualImpostos`, **calculados** (C1/C3).
  - `Material` e `DespesaFixa`: sai `empresaId`. `Material.tipo` obrigatório.
  - Novos espelhos de input: `ProdutoEntrada` (com `ficha` + `impostoIds`),
    `MaterialEntrada`, `ImpostoEntrada`, `DespesaFixaEntrada`.
  - **`Empresa.despesasFixas` não será espelhado** — revendo a nota da fatia 1:
    existe a query dedicada `despesasFixas(empresaId)`, que é o que o store usa.
    Espelhar o campo aninhado criaria duas fontes para a mesma lista na mesma
    tela, e a que ficasse desatualizada apareceria no rateio.
- **Migração de dados:** nenhuma. Os ids do mock já foram realinhados ao seed na
  fatia 1.

## Decisões de design (requisito → decisão)

| Requisito | Decisão |
|-----------|---------|
| REQ-01 | Cada store consulta `<recurso>(empresaId: empresaAtivaId)`. O `computed` que filtrava `todos` por `empresaId` **desaparece** — não vira "reforço", porque filtro no cliente sobre lista já filtrada só serve para esconder erro do servidor. |
| REQ-02 | `recursoDaEmpresaAtiva(fetch)`: observa `empresaAtivaId`, refaz a busca e **ignora resposta de empresa que não é mais a ativa** (compara o id pedido com o ativo na volta). Sem isso, trocar de empresa duas vezes rápido pode deixar a lista da primeira na tela. |
| REQ-03 | `Produto.custoBase` e `Produto.percentualImpostos` lidos do servidor. `calcularCustoBase` é **removida**; `calcularPrecificacao` passa a receber esses valores prontos. |
| REQ-04 | A ficha renderiza `item.material.nome`/`.unidade` direto. Some o `materiais.find(...)` das telas — e o `if (!mat) return acc` que subestimava custo. |
| REQ-05 | `salvarProduto(input)` com `ficha: [{materialId, quantidadeUtilizada, unidade}]` e `impostoIds`. Erro mantém a modal aberta com a mensagem (mesmo padrão do `EmpresaFormModal` da fatia 1). |
| REQ-06 | `salvarMaterial`, `salvarImposto`, `salvarDespesaFixa`, todos com `empresaId` da empresa ativa no input. |
| REQ-07 | `ajustarMargem(produtoId, margemLucro)` — mutation própria, não `salvarProduto`: evita reenviar ficha inteira para mudar um número. |
| REQ-08 | `toggleDespesaFixa(id, ativa)`; a resposta substitui o item na lista e o rateio reexibido vem de `Empresa.percentualDespesasFixas` **refetchada** — o rateio é do servidor (C2), então mudar despesa exige recarregar a empresa. |
| REQ-09 | Botão "Remover" → "Inativar", chamando `toggleDespesaFixa(id, false)`. A confirmação muda de texto: some "Remover esta despesa?" (que prometia exclusão). |
| REQ-10 | `remover()` sai de `produtos` e `materiais` — código morto que o contrato não suporta. |
| REQ-11 | `ProdutoFormModal` perde o campo `ativo`; a listagem mantém o badge, alimentado pelo servidor. |
| REQ-12 | `PerfisView` vira leitura: some `salvarPerfil` do store e a ação da tela. A matriz de permissões continua — ela é a documentação viva do RBAC. |
| REQ-13 | `usuarios` e `perfis` do servidor. O store deixa de filtrar por empresa: `usuarios` já vem no escopo do token. |
| REQ-14 | `convidarUsuario` devolve `senhaProvisoria`; a UI a exibe **uma vez**, com aviso de não-recuperável e ação de copiar. Fechar o modal descarta — e o texto diz isso antes. |
| REQ-15 | Some a criação direta de usuário do store e da tela. |
| REQ-16 | Cada store ganha `erro`, alimentado por `mensagemDeErro` (fatia 1); as telas distinguem vazio de falha. |
| REQ-17 | `usePaginacao` + `InfiniteScrollSentinel` seguem sobre a lista completa em memória — sem mudança. |
| REQ-18 | Os seis stores param de importar `src/mock/`. Restam nele apenas as telas da fatia 3 e as fixtures. |
| REQ-19 | Tipos reescritos à mão, como na fatia 1; `vue-tsc` é o verificador. |

## Rules aplicáveis

- **B1** — o front não recalcula custo, imposto nem rateio; lê.
- **B2/B9** — filtragem por empresa é do servidor; o `computed` de filtro sai.
- **B5** — ação que o perfil não permite não aparece; o servidor recusa de todo jeito.
- **B6** — o `.graphqls` manda: `ficha`, `impostoIds` e a ausência de exclusão.
- **B11** — material órfão deixa de ser ignorado: a ficha vem resolvida do servidor.
- **F2/F4/F5/F6/F9** — stores por domínio, paginação, `Intl` no front, camada
  GraphQL isolada, teste navegando por perfil.
- **Emenda ao F6** — segue pendente, conclui na fatia 3.

## Riscos e alternativas

- **Resposta atrasada da empresa anterior** → descarte por comparação de
  `empresaId` na volta (REQ-02). É o risco mais provável desta fatia, e o de
  sintoma pior: dado de outra empresa na tela.
- **A alíquota por produto muda de origem** → hoje o mock guarda alíquota
  *por produto* (`ProdutoImposto.aliquotaPercentual`) e ainda a sobrescreve por
  empresa numa tabela de "alíquota efetiva". No contrato, o produto **referencia**
  impostos e a alíquota é a do cadastro. Números exibidos podem mudar ao migrar —
  e o valor do servidor é o certo. Vale conferir uma tela lado a lado antes de
  concluir que é regressão.
- **O preço de venda continua sendo calculado no front até a fatia 3** → agora
  com entradas do servidor (custo, impostos, rateio), então a divergência
  residual se limita à fórmula, que é a mesma dos dois lados. Ainda assim, o
  número exibido **não** é o de `precificarProduto` — não use esta fatia para
  validar preço.
- **`Material.tipo` é obrigatório na leitura e opcional na escrita** → material
  gravado sem tipo volta com um valor que o servidor escolheu. Conferir o que o
  backend assume antes de tratar como bug.
- **Seis stores no mesmo padrão** → risco de divergirem em detalhe (nome de
  campo de erro, quem chama `reset`). Mitigação: o primeiro store migrado é o
  modelo revisado; os outros cinco seguem, e a revisão olha a diferença entre eles.

---
**Próximo passo:** `/tasks`
