# Spec — Integração com o backend: módulo de relatórios (PDF/XLSX)

> Preenchido por `/specify`. Descreve **o quê** e **por quê** — nunca o **como**
> (isso é o `plan.md`). Deve obedecer a [constitution.md](../../constitution.md).

- **Slug:** integracao-backend-relatorios
- **Status:** aprovada
- **Data:** 2026-08-06

## Problema / Objetivo

O módulo de relatórios (`com.markup.reports`, Artigo B12) estava registrado como
**bloqueado** desde a fatia de precificação (`integracao-backend-precificacao/spec.md`,
"Fora de escopo"): nenhum arquivo sob `POST /api/relatorios/{tipo}` existia no
backend, então `src/graphql/relatorios.ts` (FR11) já tinha a porta pronta, mas
sem o outro lado da ligação — `gerarRelatorioPdf` só era exercitado por teste,
com `fetch` mockado, e o único uso real (`ProdutoDetalheView`) chamava sem
token, porque nunca houve um servidor de verdade para recusar a chamada.

O endpoint agora existe (confirmado no Swagger,
`http://localhost:8080/swagger-ui/index.html#/Relat%C3%B3rios/gerar`), com um
contrato mais rico do que o previsto quando FR11 foi escrita:

- **Catálogo fechado de 5 tipos** (a porta só previa 4 — faltava
  `CUSTO_MATERIAIS`).
- **Dois formatos** por tipo — `PDF` e `XLSX`, mesmo conteúdo, exportador
  diferente — onde a porta só sabia pedir PDF.
- **Dois modos** — `download` (força "Salvar Como") e `inline` (o backend
  devolve o PDF para renderização no navegador, **só aceito com
  `formato=PDF`** — XLSX não tem renderização inline).

Esta fatia (1) fecha a lacuna do token de sessão que nunca foi resolvida, (2)
liga o front ao contrato real e completo, e (3) muda a UX de "só baixa" para
"visualiza em tela e baixa", que é o que o backend já suporta e o produto quer.

## Histórias de usuário

- Como **usuário**, ao gerar um relatório em PDF, quero **ver o documento na
  tela**, numa janela sobre o conteúdo atual, antes de decidir se baixo.
- Como **usuário**, a partir dessa pré-visualização, quero **baixar o mesmo
  arquivo** sem esperar um novo carregamento.
- Como **usuário**, ao exportar em **XLSX**, quero que o arquivo vá direto para
  a pasta de downloads — não faz sentido "visualizar" uma planilha binária no
  navegador, e o próprio backend recusa esse par.
- Como **gestor** (ADMIN global), quero exportar o relatório de empresas e
  usuários da base inteira, do mesmo jeito que qualquer outro relatório.
- Como **usuário**, se o backend recusar o relatório (sem permissão, sem
  acesso à empresa, tipo inexistente), quero uma mensagem clara — nunca a tela
  travada ou um arquivo vazio.

## Requisitos

> Testáveis, com MUST/SHOULD. IDs `REQ-01`, `REQ-02`…

### Contrato

- **REQ-01 (MUST):** O catálogo de tipos no front espelha exatamente os 5
  valores do backend: `FICHA_TECNICA_PRODUTO`, `LISTA_PRECIFICACAO`,
  `DESPESAS_FIXAS`, `CUSTO_MATERIAIS` (escopo EMPRESA) e
  `GESTAO_EMPRESAS_USUARIOS` (escopo GLOBAL).
- **REQ-02 (MUST):** Toda chamada envia `formato` (`PDF` ou `XLSX`) e `modo`
  (`DOWNLOAD` ou `INLINE`) como query string, e o corpo com o parâmetro exigido
  pelo tipo (`produtoId` para ficha técnica; `empresaId` para os três de
  escopo EMPRESA; corpo vazio para `GESTAO_EMPRESAS_USUARIOS`).
- **REQ-03 (MUST):** A chamada leva o **JWT da sessão atual**
  (`tokenDeAcesso()`, o mesmo usado pelo Apollo) — não depende de quem chama
  passar o token manualmente. Sem sessão, vai sem `Authorization` e o backend
  responde 401, que a tela exibe como mensagem.

### Regra de apresentação (o pedido desta fatia)

- **REQ-04 (MUST):** Para **PDF**, a ação padrão é **pré-visualizar em uma
  modal** (`modo=inline`) — o binário é renderizado em tela, sem sair da
  página atual. A modal tem uma ação explícita de **baixar** o mesmo arquivo.
- **REQ-05 (MUST):** O download do PDF a partir da modal reaproveita o mesmo
  blob já recebido — não dispara uma segunda requisição ao backend.
- **REQ-06 (MUST):** Para **XLSX**, não existe pré-visualização: a única ação
  é baixar (`modo=download`), refletindo a recusa do próprio backend a
  `inline` fora de PDF.
- **REQ-07 (MUST):** O front **nunca** envia `modo=inline` com `formato=XLSX`
  — a combinação inválida é barrada antes da requisição, não descoberta pelo
  400 do servidor.
- **REQ-08 (MUST):** Erro do backend (400/401/403/404) aparece como mensagem
  legível perto da ação que falhou; nunca um documento local como consolo
  (mantém FR11).

### Superfícies

- **REQ-09 (MUST):** `ProdutoDetalheView` (ficha técnica) ganha as duas ações
  — visualizar/baixar PDF e baixar XLSX — usando `produtoId`.
- **REQ-10 (MUST):** `RelatoriosView` troca o botão único "Exportar PDF"
  (mock, `setTimeout` + `alert`) pelas mesmas duas ações em cada uma das 3 abas
  já existentes (`LISTA_PRECIFICACAO`, `DESPESAS_FIXAS`, `CUSTO_MATERIAIS`),
  usando `empresaId` da empresa ativa.
- **REQ-11 (MUST):** `GESTAO_EMPRESAS_USUARIOS` fica acessível em
  `AdminVisaoGeralView` (Gestão do Site), visível **apenas** para
  `authStore.adminGlobal` — é o único tipo de escopo GLOBAL do catálogo, e essa
  tela já é a home do gestor global.

## Critérios de aceite

- [ ] Na ficha de um produto, clicar em "Visualizar PDF" abre uma modal com o
      PDF renderizado; "Baixar" nessa modal salva o arquivo sem nova chamada de
      rede (checável pela aba de rede — uma única requisição).
- [ ] Em Relatórios, cada uma das 3 abas tem "Visualizar PDF" e "Baixar XLSX";
      nenhum botão de "visualizar XLSX" existe.
- [ ] Requisição de relatório sai com `Authorization: Bearer <token da sessão>`
      sem que a tela precise passar o token explicitamente.
- [ ] `grep -rn "modo=inline\|modo: 'INLINE'" src/` só aparece associado a
      `formato=PDF` — nenhum caminho de código monta a combinação inválida.
- [ ] Gestão do Site → Visão Geral mostra a ação de exportar
      `GESTAO_EMPRESAS_USUARIOS` só quando logado como ADMIN global (conferido
      navegando como perfil não-admin — F9).
- [ ] Backend recusando (403 sem `RELATORIO_READ`, por exemplo) aparece como
      texto de erro na tela, sem travar o botão nem deixar a modal em branco.
- [ ] `npm run build` e `npm test` passam.

## Fora de escopo

- **Novo tipo de relatório fora do catálogo fechado** — o catálogo é do
  backend (B12); o front não inventa parâmetro novo.
- **Biblioteca de PDF no bundle** (`jspdf`, `pdfmake`, `html2canvas`) — a
  pré-visualização usa o binário que o backend já manda (`<iframe>`/`<embed>`
  sobre o Object URL do blob), nunca um PDF montado no navegador (FR11).
- **Cache ou histórico de relatórios gerados** — cada clique é uma chamada
  nova; não há lista de "relatórios anteriores".
- **Pré-visualização de XLSX** — decisão do próprio backend (só aceita
  `inline` com `formato=PDF`); não é um corte arbitrário do front.
- **Mudança no backend** — o módulo já está implementado e no ar; esta fatia é
  só a ligação do front ao contrato existente.

## Conformidade com a Constituição

- **Artigos aplicáveis:** B12 (relatório é do backend, catálogo fechado),
  F11 (front pede e baixa — **emendada nesta fatia** para admitir
  pré-visualização inline do binário do backend, sem deixar de ser "pedir e
  baixar"), Artigo III (binário por REST com o mesmo JWT do GraphQL), F9
  (visibilidade de `GESTAO_EMPRESAS_USUARIOS` por perfil precisa de teste de
  navegação).
- **Emenda necessária?** Sim — **linha da F11**, não o artigo B12. Pré-
  visualizar o PDF que o backend gerou não é "montar documento": é mudar onde
  o binário é exibido (modal em vez de aba nova/download direto). Emenda
  registrada na Constituição como v2.6.0.

## Pontos a clarificar

- Nenhum em aberto — o contrato foi confirmado direto no Swagger do backend
  em execução, e a colocação de `GESTAO_EMPRESAS_USUARIOS` (REQ-11) segue o
  mesmo critério de escopo já usado por `AdminVisaoGeralView` (B9/F10).

---
**Próximo passo:** `/plan`
