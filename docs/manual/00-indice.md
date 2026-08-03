---
title: "Índice — Manual de Utilização do Sistema Markup"
ordem: 0
tags: [indice, catalogo, markup, precificacao]
resumo: "Catálogo de todos os documentos do manual de utilização do sistema Markup, com resumo e palavras-chave de cada um, para navegação humana e para roteamento em pipelines de RAG."
---

# Índice — Manual de Utilização do Sistema Markup

> Este manual foi dividido em documentos independentes, um por procedimento/tela do sistema. Cada arquivo é autocontido (traz contexto suficiente para ser entendido isoladamente) e possui front-matter com `título`, `tags` e `resumo` para facilitar indexação em pipelines de busca (RAG).

O sistema Markup é uma ferramenta de **precificação estratégica por Markup Divisor**: `PV = CP / [1 − (Impostos% + Despesas Fixas% + Margem de Lucro% + Desconto Máximo%)/100]`.

## Catálogo de documentos

| # | Arquivo | Título | Resumo | Palavras-chave |
|---|---|---|---|---|
| 1 | [`01-visao-geral-e-formula.md`](./01-visao-geral-e-formula.md) | Visão geral e fórmula do Markup Divisor | Explica a fórmula PV = CP/Divisor, os segmentos de negócio e o fluxo de trabalho recomendado do sistema. | markup divisor, fórmula, PV, CP, segmento de negócio, fluxo de trabalho |
| 2 | [`02-login.md`](./02-login.md) | Acesso ao sistema (login) | Passo a passo de autenticação, mensagens de erro e atalhos de demonstração. | login, autenticação, senha, e-mail, usuário inativo |
| 3 | [`03-navegacao-e-troca-de-empresa.md`](./03-navegacao-e-troca-de-empresa.md) | Navegação e troca de empresa | Estrutura do menu lateral e como alternar entre empresas (multiempresa). | navegação, sidebar, seletor de empresa, multiempresa, company switcher |
| 4 | [`04-cadastro-empresa.md`](./04-cadastro-empresa.md) | Cadastro da Empresa | Como editar a empresa ativa e cadastrar uma nova empresa (segmento, regime tributário, faturamento). | empresa, CNPJ, razão social, regime tributário, anexo simples, faturamento médio |
| 5 | [`05-impostos.md`](./05-impostos.md) | Configuração de Impostos | Cadastro e edição de alíquotas de impostos vinculadas aos produtos. | impostos, alíquota, simples nacional, anexo II, DAS |
| 6 | [`06-despesas-fixas.md`](./06-despesas-fixas.md) | Cadastro de Despesas Fixas | Lançamento de despesas fixas e cálculo do percentual de rateio (% DF). | despesas fixas, rateio, aluguel, pró-labore, % DF |
| 7 | [`07-materiais-insumos.md`](./07-materiais-insumos.md) | Cadastro de Materiais / Insumos | Cadastro dos itens que compõem o custo base (CP) dos produtos. | materiais, insumos, matéria-prima, hora técnica, custo unitário, estoque |
| 8 | [`08-produtos-ficha-tecnica.md`](./08-produtos-ficha-tecnica.md) | Cadastro de Produtos (Ficha Técnica) | Montagem da ficha técnica: insumos, margem de lucro e desconto máximo. | produto, ficha técnica, margem de lucro, desconto máximo, serviço |
| 9 | [`09-precificacao.md`](./09-precificacao.md) | Formatação do Preço — Precificação | Calculadora de preço por produto e simulação manual da fórmula. | precificação, calculadora, divisor markup, simulação, composição do preço |
| 10 | [`10-detalhe-produto-faixa-negociacao.md`](./10-detalhe-produto-faixa-negociacao.md) | Detalhe do Produto, Faixa de Negociação e PDF | Página de detalhe do produto, faixa de desconto negociável e geração de PDF da ficha técnica. | faixa de negociação, desconto, piso de preço, PDF, ficha técnica |
| 11 | [`11-fator-r.md`](./11-fator-r.md) | Fator R (empresas de Serviços) | Cálculo do Fator R e decisão entre Anexo III e Anexo V do Simples Nacional. | fator r, anexo iii, anexo v, simples nacional, serviços, folha de pagamento |
| 12 | [`12-relatorios.md`](./12-relatorios.md) | Relatórios | Relatórios de precificação, despesas fixas e custo de materiais, com exportação em PDF. | relatórios, exportar pdf, precificação completa |
| 13 | [`13-usuarios.md`](./13-usuarios.md) | Configuração de Usuários | Cadastro, edição e ativação/desativação de usuários do sistema. | usuários, cadastro de usuário, ativo, inativo |
| 14 | [`14-perfis-rbac.md`](./14-perfis-rbac.md) | Perfis de Acesso e Permissões (RBAC) | Perfis padrão (ADMIN, PROPRIETARIO, GERENTE, VENDEDOR, CONTADOR), matriz de permissões e guarda de navegação. | rbac, perfil, permissão, matriz de permissões, controle de acesso |
| 15 | [`15-gestao-do-site.md`](./15-gestao-do-site.md) | Gestão do Site (módulo ADMIN global) | Painel do gestor com visão de todas as empresas e usuários da base. | admin global, gestão do site, escopo global |
| 16 | [`16-glossario.md`](./16-glossario.md) | Glossário rápido | Definição curta de todas as siglas e termos usados no manual. | glossário, siglas, cp, ml, df, pv, fator r |

## Ordem de leitura recomendada (fluxo operacional)

```mermaid
flowchart LR
    A["01. Visão geral"] --> B["04. Empresa"]
    B --> C["05. Impostos"]
    C --> D["06. Despesas Fixas"]
    D --> E["07. Materiais"]
    E --> F["08. Produtos"]
    F --> G["09. Precificação"]
    G --> H["13/14. Usuários e Perfis"]
```

## Nota sobre uso em RAG

- Cada documento é uma unidade semântica única — evite fragmentá-lo ainda mais ao configurar o chunking do pipeline (ou use um `chunk_size` grande o suficiente para conter o arquivo inteiro, já que cada um já está no tamanho ideal, ~150–350 linhas).
- O front-matter (`title`, `tags`, `resumo`) de cada arquivo pode ser extraído como metadata para busca híbrida (vetorial + filtro por tag) ou para popular o campo `source`/`section` nos resultados citados pelo assistente.
- Este índice pode servir como documento de "roteamento": uma consulta genérica ("como funciona o Fator R?") pode ser resolvida recuperando primeiro este índice para identificar `11-fator-r.md`, e então esse arquivo específico para a resposta detalhada.
