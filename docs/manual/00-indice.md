---
title: "Índice — Manual de Utilização do Sistema Markup"
ordem: 0
tags: [indice, catalogo, markup, precificacao]
resumo: "Catálogo de todos os documentos do manual de utilização do sistema Markup, com resumo e palavras-chave de cada um, para navegação humana e para roteamento em pipelines de RAG."
---

# Índice — Manual de Utilização do Sistema Markup

> Este manual foi dividido em documentos independentes, um por procedimento/tela do sistema. Cada arquivo é autocontido (traz contexto suficiente para ser entendido isoladamente) e possui front-matter com `título`, `tags` e `resumo` para facilitar indexação em pipelines de busca (RAG).

O sistema Markup é uma ferramenta de **precificação estratégica por Markup Divisor**: `PV = CP / [1 − (Impostos% + Despesas Fixas% + Margem de Lucro% + Desconto Máximo%)/100]`. Toda a integração com o backend é via **GraphQL**, com autenticação real (e-mail + senha) e sessão renovável — ver [`17-sessao-e-mensagens-de-erro.md`](./17-sessao-e-mensagens-de-erro.md).

## Catálogo de documentos

| # | Arquivo | Título | Resumo | Palavras-chave |
|---|---|---|---|---|
| 1 | [`01-visao-geral-e-formula.md`](./01-visao-geral-e-formula.md) | Visão geral e fórmula do Markup Divisor | Explica a fórmula PV = CP/Divisor, os quatro segmentos de negócio (Confeitaria, Indústria, Serviços, Comércio) e o fluxo de trabalho recomendado do sistema. | markup divisor, fórmula, PV, CP, segmento de negócio, comércio, fluxo de trabalho |
| 2 | [`02-login.md`](./02-login.md) | Acesso ao sistema (login) | Login com e-mail e senha reais, mensagens de erro (credencial inválida, servidor inacessível), a renovação automática de sessão via access/refresh token e os atalhos de e-mail em ambiente de desenvolvimento. | login, autenticação, senha, e-mail, sessão, token, usuário inativo |
| 3 | [`03-navegacao-e-troca-de-empresa.md`](./03-navegacao-e-troca-de-empresa.md) | Navegação e troca de empresa | Estrutura do menu lateral, como alternar entre empresas (multiempresa) e o redirecionamento automático quando a troca de empresa muda o perfil ativo. | navegação, sidebar, seletor de empresa, multiempresa, company switcher |
| 4 | [`04-cadastro-empresa.md`](./04-cadastro-empresa.md) | Cadastro da Empresa | Como editar a empresa ativa e cadastrar uma nova empresa (segmento — incluindo Comércio —, regime tributário, faturamento), e a diferença entre Anexo Cadastrado e Anexo Aplicado. | empresa, CNPJ, razão social, regime tributário, anexo simples, comércio, faturamento médio |
| 5 | [`05-impostos.md`](./05-impostos.md) | Configuração de Impostos | Cadastro e edição de alíquotas de impostos vinculadas aos produtos. | impostos, alíquota, simples nacional, anexo II, DAS |
| 6 | [`06-despesas-fixas.md`](./06-despesas-fixas.md) | Cadastro de Despesas Fixas | Lançamento de despesas fixas, cálculo do percentual de rateio (% DF) pelo backend, e como inativar/reativar (não há exclusão). | despesas fixas, rateio, aluguel, pró-labore, % DF, inativar |
| 7 | [`07-materiais-insumos.md`](./07-materiais-insumos.md) | Cadastro de Materiais / Insumos | Cadastro dos itens que compõem o custo base (CP) dos produtos; só criação e edição, sem exclusão. | materiais, insumos, matéria-prima, hora técnica, custo unitário, estoque |
| 8 | [`08-produtos-ficha-tecnica.md`](./08-produtos-ficha-tecnica.md) | Cadastro de Produtos (Ficha Técnica) | Montagem da ficha técnica: tipo (produto/serviço), insumos, margem de lucro e desconto máximo; o status ativo/inativo é somente leitura. | produto, ficha técnica, margem de lucro, desconto máximo, serviço, tipo |
| 9 | [`09-precificacao.md`](./09-precificacao.md) | Formatação do Preço — Precificação | Calculadora de preço por produto (calculado pelo backend) e simulação de margem/desconto sobre um produto real, com opção de salvar como nova versão. | precificação, calculadora, divisor markup, simulação, versionamento |
| 10 | [`10-detalhe-produto-faixa-negociacao.md`](./10-detalhe-produto-faixa-negociacao.md) | Detalhe do Produto, Faixa de Negociação, Histórico e Relatório | Página de detalhe do produto, faixa de desconto negociável, histórico de versões de margem (reativar/excluir) e geração de PDF/XLSX da ficha técnica. | faixa de negociação, desconto, piso de preço, PDF, XLSX, histórico, versionamento |
| 11 | [`11-fator-r.md`](./11-fator-r.md) | Fator R (empresas de Serviços) | Cálculo do Fator R via backend, simulador com máscara monetária e debounce, e comparativo de impacto no preço de um produto real entre Anexo III e Anexo V. | fator r, anexo iii, anexo v, simples nacional, serviços, simulador |
| 12 | [`12-relatorios.md`](./12-relatorios.md) | Relatórios | Relatórios de precificação, despesas fixas e custo de materiais, com pré-visualização em PDF (modal) e download direto em XLSX. | relatórios, exportar pdf, xlsx, precificação completa |
| 13 | [`13-usuarios.md`](./13-usuarios.md) | Configuração de Usuários | Não há cadastro/edição direta: acesso nasce por convite, com senha provisória exibida uma única vez. Ativação/desativação fica na Gestão do Site. | usuários, convite, senha provisória, ativo, inativo |
| 14 | [`14-perfis-rbac.md`](./14-perfis-rbac.md) | Perfis de Acesso e Permissões (RBAC) | Perfis padrão (ADMIN, PROPRIETARIO, GERENTE, VENDEDOR, CONTADOR), matriz de permissões (somente leitura) e guarda de navegação. | rbac, perfil, permissão, matriz de permissões, controle de acesso |
| 15 | [`15-gestao-do-site.md`](./15-gestao-do-site.md) | Gestão do Site (módulo ADMIN global) | Painel do gestor: relatório da base inteira, gestão de acessos por empresa (trocar perfil, ativar/desativar, desvincular, conceder acesso) e convite de usuário de escopo global. | admin global, gestão do site, escopo global, convite global |
| 16 | [`16-glossario.md`](./16-glossario.md) | Glossário rápido | Definição curta de todas as siglas e termos usados no manual, incluindo Anexo Cadastrado/Aplicado, Convite, Senha Provisória, Versão de Produto e tokens de sessão. | glossário, siglas, cp, ml, df, pv, fator r, rbac, convite |
| 17 | [`17-sessao-e-mensagens-de-erro.md`](./17-sessao-e-mensagens-de-erro.md) | Sessão, conectividade e mensagens de erro | Como o sistema classifica erros do backend (credencial, sessão expirada, autorização, não encontrado, entrada inválida, servidor inacessível) e por que erro de rede nunca vira "lista vazia". | erro, sessão expirada, servidor inacessível, conectividade, token |

## Ordem de leitura recomendada (fluxo operacional)

```mermaid
flowchart LR
    A["01. Visão geral"] --> B["02. Login"]
    B --> C["04. Empresa"]
    C --> D["05. Impostos"]
    D --> E["06. Despesas Fixas"]
    E --> F["07. Materiais"]
    F --> G["08. Produtos"]
    G --> H["09. Precificação"]
    H --> I["13/14/15. Usuários, Perfis e Gestão do Site"]
```

## Nota sobre uso em RAG

- Cada documento é uma unidade semântica única — evite fragmentá-lo ainda mais ao configurar o chunking do pipeline (ou use um `chunk_size` grande o suficiente para conter o arquivo inteiro, já que cada um já está no tamanho ideal, ~150–350 linhas).
- O front-matter (`title`, `tags`, `resumo`) de cada arquivo pode ser extraído como metadata para busca híbrida (vetorial + filtro por tag) ou para popular o campo `source`/`section` nos resultados citados pelo assistente.
- Este índice pode servir como documento de "roteamento": uma consulta genérica ("como funciona o Fator R?") pode ser resolvida recuperando primeiro este índice para identificar `11-fator-r.md`, e então esse arquivo específico para a resposta detalhada.
- Perguntas sobre "por que fui desconectado" ou "o que significa essa mensagem de erro" roteiam melhor para [`17-sessao-e-mensagens-de-erro.md`](./17-sessao-e-mensagens-de-erro.md) do que para o documento da tela onde o erro apareceu.
