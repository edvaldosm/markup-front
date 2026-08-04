# Rule FR06 — Camada GraphQL isolada, zero cálculo no front

**Categoria:** Integração / Fronteira
**Origem:** `src/graphql/client.ts`

> **Reescrita em 2026-08-04**, ao concluir `integracao-backend-gestao-site`:
> `src/mock/` foi apagada do repositório. Esta regra descrevia até então um
> protótipo com flag `MOCK_MODE` alternando entre mock e backend — essa
> alternativa não existe mais. O texto abaixo descreve o estado final.

## Regra

Todo acesso a dados passa pela camada `src/graphql/` (`client.ts`): Apollo
Client apontando para `GQL_ENDPOINT` (`VITE_GQL_ENDPOINT`, default
`http://localhost:8080/graphql`). Não existe caminho alternativo, não existe
flag de runtime, não existe cálculo de domínio no front — **cálculo tem uma
sede só, o backend** (B1, Artigo III v2.5.0).

"Zero cálculo" cobre mais do que fórmula de precificação: nenhum **número
derivado** nasce no front — soma, contagem monetária, percentual, diferença —
mesmo quando parece só reorganizar dado já visível na tela. Exceção explícita:
paginação, ordenação e formatação (`Intl`, [[FR05-formatacao-intl]]) continuam
do front, porque não produzem número nem decisão nova, só reorganizam ou
reescrevem o que já veio pronto do servidor.

**O que não é cálculo, mesmo parecendo:** resolver uma referência por id contra
uma lista já buscada (ex.: cruzar `Usuario.empresas[].empresaId` com
`todasEmpresas` para montar uma tabela) é o uso que o próprio contrato pede
quando declara um campo como id solto em vez de objeto embutido — não é uma
segunda fonte de verdade, é ler a resposta.

## O que ainda não existe no backend

Duas superfícies ficam **desativadas**, com aviso (`IndisponivelBackend.vue`),
até o contrato crescer — nunca com fórmula reimplementada como substituto:

- **Fator R por empresa** (estado salvo) e **simulação "e se"** — não há
  `Empresa.fatorR` nem endpoint de simulação stateless. Afeta `EmpresaView`,
  `EmpresaFormModal`, `FatorRView` (a tela inteira), o modo manual de
  `PrecificacaoView`, e `AdminEmpresaDetalheView`.
- **Agregados que a tela mostrava somando localmente**: total de despesas em
  reais, custo total de materiais, percentual de faturamento por despesa
  (linha a linha), contagem de empresas por segmento, contagem de usuários
  inativos. Pendências registradas em
  [integracao-backend-precificacao/spec.md](../../specs/integracao-backend-precificacao/spec.md#pendências-para-o-markup-back).
- **Relatório em PDF** — o backend não tem o módulo `com.markup.reports`
  (B12/F11). `gerarRelatorioPdf` cai num erro claro, não em `window.print()`.

## Por quê

Duas fontes de verdade para preço significam dois preços — e o mesmo vale para
qualquer número que o usuário decide algo em cima dele (Fator R decide o
anexo tributário; um total errado de despesas decide se o rateio parece alto
demais). A auditoria que motivou esta reescrita
(`integracao-backend-precificacao/spec.md`) achou fórmula de domínio rodando
sobre dado real em telas já ligadas ao backend — o risco não é teórico.

Ver também [[R01-calculo-no-backend]], [[R11-guardas-de-calculo]],
[[R12-relatorios-no-backend]].
