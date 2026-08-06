# Spec — Integração com o backend: precificação e auditoria de cálculo zero

> Preenchido por `/specify`. Descreve **o quê** e **por quê** — nunca o **como**
> (isso é o `plan.md`). Deve obedecer a [constitution.md](../../constitution.md).

- **Slug:** integracao-backend-precificacao
- **Status:** aprovada · **parcialmente concluída 06-08-2026** (ver abaixo)
- **Data:** 2026-08-04

> **Atualização 06-08-2026 — pendências 1 e 2 (Fator R) resolvidas no
> markup-back.** `Empresa.fatorR`/`Empresa.anexoAplicado` (estado salvo, C8/C9)
> e `simularFatorR(empresaId, faturamentoMedioMensal, folhaPagamentoMensal)`
> (simulação stateless, "e se") existem no contrato e foram testados ao vivo.
> Documentado em `markup-back/.claude/specs/contrato-graphql-pendencias-frontend/spec.md`
> (REQ-02/REQ-03). Reflexo aqui, no `markup-front`:
> - `DashboardView`, `EmpresaView` e `FatorRView` **não usam mais**
>   `IndisponivelBackend` para Fator R — REQ-05 (as quatro superfícies
>   desativadas) fica **parcialmente atendido**: as três leem/simulam de
>   verdade agora.
> - `EmpresaFormModal` **continua** desativada — REQ-06 pede exatamente esta
>   capacidade, mas `simularFatorR` exige uma empresa já existente (`empresaId`),
>   e o formulário de criação ainda não tem uma. Sem solução ainda.
> - Pendência 2 do REQ-06 (`Empresa.fatorR`/`anexoAplicado` para o estado
>   salvo) está **fechada**. A parte de "simulação de markup completo" da
>   mesma pendência (custo, impostos, margem, desconto — não só Fator R)
>   **continua aberta**: `PrecificacaoView` modo manual segue desativada.
> - **Extensão pedida na mesma revisão:** `FatorRView` ganhou também o card
>   "Impacto no preço" (mesmo produto sob a alíquota efetiva de Anexo III vs
>   V), via `simularImpactoAnexo` — capacidade nova no backend, não coberta
>   pelas pendências originais desta spec. Comparação **didática**: usa a
>   alíquota da 1ª faixa do Simples (6%/15,5%), não modela as faixas
>   seguintes — documentado em `SimularImpactoAnexo.java` e na própria tela.

## Problema / Objetivo

O usuário pediu uma varredura completa: **nenhum cálculo no frontend, tudo vindo
do backend** — e registrou isso como emenda formal (Artigo III, v2.5.0), porque a
regra existente ("cálculo tem uma sede só") vinha sendo lida como "fórmula de
preço", deixando passar duas categorias que também são cálculo:

1. **Fórmula de domínio rodando sobre dado real**, em telas já ligadas ao
   backend pelas fatias 1 e 2. `useMarkupCalculator` continuava calculando
   preço de venda, faixa de negociação e Fator R inteiramente no cliente —
   não porque a fatia 2 tivesse decidido isso, mas porque `precificarProduto` e
   `precificarTodos`, embora **já implementados no backend**, nunca tinham sido
   consumidos.
2. **Agregação simples tratada como apresentação**: soma de despesas mensais,
   contagem de empresas por segmento, custo médio de materiais. São números que
   *parecem* só reorganizar dado já visível — mas nascem no front, e o Artigo
   III agora os trata como cálculo, não como formatação.

Esta é a **fatia 3**, e muda de forma em relação ao que as specs anteriores
previam: em vez de "precificação + Gestão do Site + relatórios + assistente"
como um bloco, ela cobre **só a auditoria e a precificação** — o que dá para
fechar com o backend que já existe. Gestão do Site, relatórios e assistente
viram specs próprias (ver "Fora de escopo"), porque cada uma tem uma
dependência que esta fatia não tem: relatórios não tem módulo no backend,
Gestão do Site é reescrita grande sobre dado ainda 100% mock, assistente é
tela nova.

## Histórias de usuário

- Como **usuário**, quero que o preço de venda exibido seja o que o backend
  calculou — o mesmo número que qualquer outro cliente da API veria.
- Como **usuário**, quero negociar dentro de uma faixa de desconto que o
  backend definiu, não uma que o navegador estimou.
- Como **usuário**, quero que uma tela que não pode mostrar um número certo diga
  isso claramente, em vez de inventar uma conta para não ficar vazia.

## Requisitos

> Testáveis, com MUST/SHOULD. IDs `REQ-01`, `REQ-02`…

### Precificação real

- **REQ-01 (MUST):** O preço de venda, o divisor de markup, o breakdown e a
  faixa de negociação de um produto vêm de `precificarProduto`. Nenhum desses
  números é recalculado no cliente.
- **REQ-02 (MUST):** A lista de precificação de uma empresa (Dashboard,
  Relatórios) vem de `precificarTodos(empresaId)`, numa única consulta —
  não em N chamadas de `precificarProduto`.
- **REQ-03 (MUST):** `useMarkupCalculator` perde `calcularPrecificacao` e
  `calcularFaixaNegociacao`. O que resta do arquivo, se restar algo, não
  implementa fórmula de precificação nenhuma.
- **REQ-04 (MUST):** Erro do servidor ao precificar (ex.: divisor inviável —
  guarda V1) aparece como mensagem, nunca como preço zerado silencioso.

### Auditoria — fórmula de domínio sem backend equivalente

- **REQ-05 (MUST):** As quatro superfícies que hoje calculam Fator R
  localmente sobre dado real ou hipotético (`EmpresaView` no formulário,
  `EmpresaFormModal`, `FatorRView` — exibição principal e simulador "e se",
  `PrecificacaoView` — modo "simulação manual") são **desativadas**, com aviso
  explicando que a funcionalidade aguarda capacidade do backend. Não recebem
  fórmula reimplementada como substituto.
- **REQ-06 (MUST):** Fica registrada pendência para o markup-back: `Empresa`
  precisa expor `fatorR` e `anexoAplicado` calculados (para exibir o estado
  **salvo** da empresa) e uma consulta ou mutation **stateless** que receba
  entradas hipotéticas (folha, faturamento; ou custo, impostos, margem,
  desconto) e devolva o resultado da mesma fórmula — para os simuladores "e se"
  voltarem a existir sem duplicar C5/C6/C8 no front.

### Auditoria — agregação tratada como apresentação

- **REQ-07 (MUST):** `despesas.totalMensal` (soma de `valorMensal` das
  despesas ativas) sai do store. A tela mostra o total como indisponível, com
  nota, até o backend expor o agregado.
- **REQ-08 (MUST):** `RelatoriosView.custoTotalMateriais` (soma de
  `custoUnitario`) sai da tela pela mesma razão.
- **REQ-09 (MUST):** Fica registrada pendência para o markup-back: um agregado
  de despesas fixas por empresa (ex. `Empresa.valorDespesasFixasMensal`, par
  de `percentualDespesasFixas`) para REQ-07 voltar a funcionar.
- **REQ-10 (MUST):** `admin.ts` (Gestão do Site, ainda 100% mock) **não é
  migrado nesta fatia** — mas ao ser migrado, deve consumir `metricasDaBase`
  em vez de recalcular `totalUsuarios`, `usuariosAtivos`, `totalVinculos` e
  `faturamentoTotal` localmente, porque o backend já expõe exatamente isso.
  `porSegmento` e `usuariosInativos` não têm campo no contrato — pendência
  registrada, não implementados enquanto isso.

### Transversal

- **REQ-11 (MUST):** Toda tela desativada por esta spec (REQ-05, REQ-07,
  REQ-08) explica **por quê** — não desaparece em silêncio nem vira um "0"
  ou "—" sem contexto. O usuário sabe que é limitação temporária, não bug.
- **REQ-12 (SHOULD):** Cada pendência de contrato desta spec é redigida de
  forma que possa ser colada, sem edição, como issue no repositório
  `markup-back`.

## Critérios de aceite

- [ ] Abrir o detalhe de um produto: preço de venda, breakdown e faixa de
      negociação batem com uma chamada direta a `precificarProduto` no
      GraphiQL/Postman do backend.
- [ ] Dashboard e Relatórios exibem a mesma precificação, vinda de
      `precificarTodos`, sem N chamadas individuais (checável pela aba de rede).
- [ ] `EmpresaView`, `EmpresaFormModal`, `FatorRView`, `PrecificacaoView` (modo
      manual) mostram aviso de indisponibilidade, não um número calculado.
- [ ] `DespesasFixasView` e `RelatoriosView` não exibem total consolidado
      inventado; mostram indisponibilidade com nota.
- [ ] `grep -rn "calcularPrecificacao\|calcularFaixaNegociacao\|calcularFatorR\|resolverAnexo" src/` só aponta para os arquivos legados que a spec explicitamente lista como fora deste corte (nenhum em `views/` ativo).
- [ ] `npm run build` e `npm test` passam.
- [ ] Lista de pendências do markup-back pronta para virar issue (REQ-12).

## Fora de escopo

- **Gestão do Site real** (`admin.ts` ainda mock) — spec própria
  (`integracao-backend-gestao-site`), porque é reescrita grande de uma store
  inteira, independente da auditoria de cálculo.
- **Relatórios em PDF** — bloqueada: o backend não tem o módulo
  `com.markup.reports` nem `POST /api/relatorios/{tipo}` implementado
  (verificado: nenhum arquivo sob esse caminho). A spec `modulo-relatorios-jasper`
  já existe no markup-back; esta fatia não a antecipa.
- **Assistente (RAG)** — tela nova, não remoção de mock. Spec própria, como já
  decidido na fatia 1.
- **Simuladores "e se" de Fator R e de markup manual** — ficam desativados até
  o backend entregar a capacidade stateless (REQ-06). Não reimplementados aqui
  de nenhuma forma, nem "só para não perder a UX".

## Conformidade com a Constituição

- **Artigos aplicáveis:** B1 (cálculo no backend), a nova linha do **Artigo
  III** ("zero cálculo no front, sem exceção de tamanho", v2.5.0 — esta spec é
  a aplicação prática dela), F6 (camada GraphQL isolada — conclui a emenda
  pendente desde a fatia 1), F11 (relatório do backend — motivo do "fora de
  escopo" de PDF).
- **Emenda necessária?** Não nova — a emenda que esta spec **aplica** já foi
  feita na Constituição (v2.5.0) como pré-requisito para escrever esta spec.

## Pendências para o markup-back

Prontas para virar issue (REQ-12):

1. **`Empresa.fatorR: BigDecimal` e `Empresa.anexoAplicado: AnexoSimples`** —
   estado calculado e persistente da empresa (hoje só existe por produto, em
   `ResultadoPrecificacao`). Sem isso, `EmpresaView`/`FatorRView` não têm como
   mostrar "qual é o Fator R desta empresa agora" sem calcular no front.
2. **Consulta ou mutation stateless de simulação** — recebe entradas
   hipotéticas (não persistidas) e devolve o resultado da fórmula de domínio
   correspondente (Fator R, ou markup completo). Usada pelos simuladores "e se"
   de `FatorRView` e pelo modo manual de `PrecificacaoView`.
3. **Agregado de despesas fixas por empresa** (`Empresa.valorDespesasFixasMensal`
   ou equivalente) — par do já existente `percentualDespesasFixas`, para exibir
   o total em reais sem somar no front.
4. **`MetricasBase.porSegmento`** (contagem de empresas por segmento) e
   **`MetricasBase.usuariosInativos`** — para a Gestão do Site não recalcular
   sobre a lista completa quando migrar.
5. *(Já registrada na fatia 2, repetida aqui por completude)* Módulo de
   relatórios (JasperReports) — `com.markup.reports`, `POST /api/relatorios/{tipo}`.

## Pontos a clarificar

- Nenhum em aberto.

---
**Próximo passo:** `/plan`
