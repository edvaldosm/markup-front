# Tarefas — Integração com o backend: catálogo, usuários e perfis

> Preenchido por `/tasks` a partir do `plan.md`. Lista ordenada, pequena e
> rastreável. Cada tarefa referencia o requisito (`REQ-xx`) e o arquivo/skill alvo.

- **Slug:** integracao-backend-catalogo  •  **Baseado em:** plan.md  •  **Data:** 2026-08-03

## Legenda

`[ ]` pendente · `[~]` em andamento · `[x]` concluída · **dep:** depende de

## Backend

Nenhuma tarefa: todas as operações desta fatia já existem no `markup-back`.
Pré-requisito de ambiente: backend no ar com perfil `dev` (seed `V900`).

Duas **pendências registradas** para o outro repo, que não bloqueiam nada aqui —
`Produto.ativo` não é editável por nenhuma via da API, e o contrato não tem
exclusão (ver `spec.md`, seção Pendências).

## Frontend

### Fundação (ordem obrigatória — tudo depende)

- [x] **T-F1** (REQ-19) — Espelhar os tipos: `Produto` (`ficha`, `impostos:
  Imposto[]`, `custoBase`, `percentualImpostos`, `tipo` obrigatório, sem
  `empresaId`/`createdAt`), `Material` e `DespesaFixa` sem `empresaId`,
  `Material.tipo` obrigatório; novos `ProdutoEntrada`, `MaterialEntrada`,
  `ImpostoEntrada`, `DespesaFixaEntrada` · alvo: `src/types/index.ts` · skill:
  `modelo-de-dados-front` · done: batem campo a campo com o `.graphqls`.
  **Quebra o build de propósito** — as tarefas seguintes são o conserto (11
  arquivos). **Decisão adicional:** `src/mock/data.ts` passa a declarar seus
  próprios tipos de **linha** (`ProdutoRegistro`, `MaterialRegistro`,
  `DespesaFixaRegistro`, `ImpostoRegistro`) — ele virou o banco do servidor
  falso, e compor o objeto do contrato (ficha resolvida, `custoBase`) é trabalho
  de servidor, feito em T-F5.
- [x] **T-F2** (REQ-01, REQ-06) — Documentos gql do catálogo · alvo:
  `src/graphql/operations/catalogo.ts` · dep: T-F1 · done: `produtos`, `produto`,
  `materiais`, `impostos`, `despesasFixas`, `salvarProduto`, `ajustarMargem`,
  `salvarMaterial`, `salvarImposto`, `salvarDespesaFixa`, `toggleDespesaFixa`,
  cada um pedindo só os campos usados.
- [x] **T-F3** (REQ-13, REQ-14) — Documentos gql de acesso · alvo:
  `src/graphql/operations/usuarios.ts` · dep: T-F1 · done: `usuarios`, `perfis`,
  `convidarUsuario`.
- [x] **T-F4** (REQ-02) — `recursoDaEmpresaAtiva(fetch)`: observa
  `empresaAtivaId`, refaz a busca e **descarta resposta cujo `empresaId` não é
  mais o ativo** · alvo: `src/composables/recursoDaEmpresaAtiva.ts` · done: teste
  de unidade cobre troca rápida com resposta fora de ordem — a lista final é a da
  empresa ativa, nunca a da anterior. **Feito:** o composable **aplica** o
  resultado em vez de devolvê-lo, então o descarte não é convenção que um store
  possa esquecer. 6 testes; as duas guardas (descarte e esvaziar-antes-de-buscar)
  validadas por mutação.
- [x] **T-F5** (REQ-01, REQ-06, REQ-16) — Servidor falso ganha as operações desta
  fatia, com filtragem por `empresaId` no servidor · alvo:
  `src/test/servidor-falso.ts` · dep: T-F2, T-F3 · done: 5 testes proprios
  (`servidor-falso.spec.ts`) fixam C1, C3 e a recusa por alcance. **Copia o
  backend onde importa:** C1 = soma de quantidade x custo unitario, C3 = soma
  simples das aliquotas vinculadas **sem filtrar por `ativo`** (conferido em
  `Produto.java`/`FichaTecnica.java`), material orfao e erro (V6), empresa fora
  do alcance e `FORBIDDEN` — nunca lista vazia. **Efeito colateral esperado:** a
  tabela `aliquotaEfetivaPorEmpresa` do mock virou codigo morto e foi removida.

### Stores (o primeiro é o modelo; os outros seguem)

- [x] **T-F6** (REQ-01, REQ-02, REQ-16, REQ-18) — Store de **materiais** sobre
  `materiais(empresaId)`, com `erro`, `reset()` e `recursoDaEmpresaAtiva`; some o
  `computed` de filtro por empresa e o `remover()` · alvo: `src/stores/materiais.ts` ·
  dep: T-F4, T-F5 · skill: `store-pinia-dominio` · done: sem import de `@/mock`;
  é o **modelo revisado** que os próximos quatro seguem. 5 testes em
  `catalogo.spec.ts`, incluindo troca de empresa sem sobra e queda de servidor.
  `MateriaisView` acompanhou: `empresaId` saiu do formulário, erro do servidor
  mantém a modal aberta e a tabela distingue falha de lista vazia.
- [x] **T-F7** (REQ-01, REQ-06) — Store de **impostos** · alvo:
  `src/stores/impostos.ts` · dep: T-F6 · done: idem, com `salvarImposto`.
- [x] **T-F8** (REQ-01, REQ-08, REQ-09) — Store de **despesas**, com
  `toggleDespesaFixa` e sem `remover()`; após alternar, **recarrega a empresa**
  para o rateio (C2) vir do servidor · alvo: `src/stores/despesas.ts` · dep: T-F6 ·
  done: inativar despesa muda `empresa.percentualDespesasFixas`. **O teste desta
  tarefa flagrou um defeito de fidelidade no servidor falso:** ele devolvia o
  rateio pré-calculado no mock, enquanto o backend calcula C2 **na leitura** —
  uma despesa recém-inativada continuava contando. Corrigido nos dois lados: o
  servidor falso calcula na leitura e o pré-cálculo do mock foi removido.
- [x] **T-F9** (REQ-01, REQ-05, REQ-07, REQ-10) — Store de **produtos**, com
  `salvarProduto` (ficha + impostoIds), `ajustarMargem` e sem `remover()` · alvo:
  `src/stores/produtos.ts` · dep: T-F6 · done: sem import de `@/mock`.
- [x] **T-F10** (REQ-12, REQ-13, REQ-15) — Store de **usuários**: `usuarios` e
  `perfis` do servidor, `convidarUsuario`; saem `salvarUsuario` e `salvarPerfil` ·
  alvo: `src/stores/usuarios.ts` · dep: T-F6, T-F3 · done: sem criação direta nem
  escrita de perfil.

### Poda do cálculo local

- [x] **T-F11** (REQ-03) — Remover `calcularCustoBase` e `calcularPercentualDF`;
  `calcularPrecificacao` passa a ler `produto.custoBase`,
  `produto.percentualImpostos` e `empresa.percentualDespesasFixas` · alvo:
  `src/composables/useMarkup.ts` · dep: T-F1 · done: nenhum custo, imposto ou
  rateio é recalculado no front.
- [x] **T-F12** (REQ-03) — Telas que chamavam `calcularPercentualDF` passam a ler
  `empresa.percentualDespesasFixas` — **dívida da fatia 1** · alvo:
  `DashboardView`, `DespesasFixasView`, `EmpresaView`, `FatorRView`,
  `RelatoriosView` · dep: T-F11 · done: `grep -rn "calcularPercentualDF" src/`
  não retorna nada.
- [x] **T-F13** (REQ-04) — `FatorRView` usa `servico.custoBase` do servidor em vez
  de `calcularCustoBase` · alvo: `src/views/FatorRView.vue` · dep: T-F11 · done:
  a tela não cruza material por id.

### Telas

- [x] **T-F14** (REQ-04) — Ficha técnica renderiza `item.material.nome`/`.unidade`
  direto · alvo: `ProdutoDetalheView`, `PrecificacaoView` · dep: T-F9 · done:
  nenhum `materiais.find(...)` sobra nas telas de produto.
- [x] **T-F15** (REQ-05, REQ-11) — `ProdutoFormModal` monta `ficha` +
  `impostoIds`, perde o campo `ativo`, e erro do servidor mantém a modal aberta ·
  alvo: `src/components/ui/ProdutoFormModal.vue` · dep: T-F9 · done: salvar
  produto inválido mostra a mensagem do domínio sem fechar.
- [x] **T-F16** (REQ-09) — "Remover" vira "Inativar" na despesa fixa, com o texto
  de confirmação correspondente · alvo: `src/views/DespesasFixasView.vue` ·
  dep: T-F8 · done: nenhuma tela promete exclusão.
- [x] **T-F17** (REQ-14) — Convite de usuário: modal exibe a **senha provisória
  uma única vez**, com aviso de não-recuperável e ação de copiar · alvo:
  `src/views/UsuariosView.vue` · dep: T-F10 · done: o aviso aparece **antes** de
  a senha poder ser perdida ao fechar.
- [x] **T-F18** (REQ-12) — `PerfisView` em leitura: some a ação de edição, fica a
  matriz de permissões · alvo: `src/views/PerfisView.vue` · dep: T-F10 · done:
  nenhuma ação de escrita de perfil na tela. A tela já era só leitura; o que
  mudou foi a **origem do catálogo de permissões**, que vinha de `mockPermissoes`
  e agora é derivado dos perfis do servidor — cópia no front ficaria velha sem
  ninguém perceber.
- [x] **T-F19** (REQ-16) — Estados de erro nas telas do catálogo: falha de
  carregamento distinta de lista vazia · alvo: `ProdutosView`, `MateriaisView`,
  `ImpostosView`, `DespesasFixasView`, `UsuariosView` · dep: T-F6…T-F10 · done:
  backend derrubado mostra indisponibilidade em cada uma.

### Testes

- [x] **T-F20** (REQ-02) — Teste da troca de empresa: catálogo recarrega e
  **resposta atrasada da empresa anterior é descartada** · alvo:
  `src/test/catalogo.spec.ts` · dep: T-F6…T-F9 · done: falha se o descarte for
  removido (validar por mutação).
- [x] **T-F21** (REQ-05, REQ-08) — Teste de escrita: salvar produto com ficha,
  ajustar margem, inativar despesa e ver o rateio mudar · alvo:
  `src/test/catalogo.spec.ts` · dep: T-F20 · done: cobre os critérios de aceite
  correspondentes.
- [x] **T-F22** (REQ-09, REQ-16) — Atualizar os testes de navegação por perfil
  para o catálogo vindo do servidor · alvo:
  `src/test/navegacao-multiusuario.spec.ts` · dep: T-F20 · done: as personas
  continuam provando o que veem e o que lhes é negado.
- [x] **T-F23** (REQ-14) — Teste do convite: senha provisória exibida uma vez ·
  alvo: `src/test/catalogo.spec.ts` · dep: T-F17 · done: falha se a senha passar a
  ser exibida de novo depois de fechada.

## Verificação

- [x] `npm run build` (inclui `vue-tsc`) sem erro
- [x] `npm test` verde — 153 testes
- [x] `grep -rn "from '@/mock" src/` fora de teste retorna **só** `stores/admin.ts`
      (Gestão do Site, fatia 3)
- [x] `grep -rn "calcularCustoBase\|calcularPercentualDF" src/` não retorna nada
- [x] Verificação manual contra o backend em `dev`: ficha técnica resolvida com
      nome/unidade/custo por item e **Custo Base R$ 11,31 calculado pelo servidor**;
      catálogo da empresa ativa; "Remover" não existe mais em nenhuma tela
- [x] Alíquota conferida: o produto exibe **7,8%** vindo do cadastro de impostos
      da empresa, não mais de uma cópia por produto

---
**Próximo passo:** implementar, começando por T-F1.
