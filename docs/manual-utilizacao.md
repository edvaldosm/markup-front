# Manual de Utilização — Sistema Markup

**Precificação Estratégica por Markup Divisor**

> Manual de treinamento passo a passo. Cobre login, cadastro da empresa, parametrização (impostos, despesas fixas, materiais e produtos), o cálculo de precificação, a faixa de negociação, o Fator R (Simples Nacional — Serviços), relatórios e a configuração de usuários e perfis de acesso (RBAC).

---

## Sumário

1. [Visão geral do sistema](#1-visão-geral-do-sistema)
2. [Acesso ao sistema (login)](#2-acesso-ao-sistema-login)
3. [Navegação e troca de empresa](#3-navegação-e-troca-de-empresa)
4. [Cadastro da Empresa](#4-cadastro-da-empresa)
5. [Configuração de Impostos](#5-configuração-de-impostos)
6. [Cadastro de Despesas Fixas](#6-cadastro-de-despesas-fixas)
7. [Cadastro de Materiais / Insumos](#7-cadastro-de-materiais--insumos)
8. [Cadastro de Produtos (Ficha Técnica)](#8-cadastro-de-produtos-ficha-técnica)
9. [Formatação do Preço — Precificação](#9-formatação-do-preço--precificação)
10. [Detalhe do Produto, Faixa de Negociação e PDF](#10-detalhe-do-produto-faixa-de-negociação-e-pdf)
11. [Fator R (empresas de Serviços)](#11-fator-r-empresas-de-serviços)
12. [Relatórios](#12-relatórios)
13. [Configuração de Usuários](#13-configuração-de-usuários)
14. [Perfis de Acesso e Permissões (RBAC)](#14-perfis-de-acesso-e-permissões-rbac)
15. [Gestão do Site (módulo ADMIN global)](#15-gestão-do-site-módulo-admin-global)
16. [Glossário rápido](#16-glossário-rápido)

---

## 1. Visão geral do sistema

O Markup é um sistema de **precificação estratégica** baseado no método **Markup por Divisor**. Em vez de multiplicar o custo por um fator, o sistema **divide** o custo por um número menor que 1, calculado a partir da soma de todos os percentuais que o preço final precisa cobrir:

```
PV = CP / [1 − (Impostos% + Despesas Fixas% + Margem de Lucro% + Desconto Máximo%) / 100]
```

| Sigla | Significado |
|---|---|
| **PV** | Preço de Venda (o que o cliente paga) |
| **CP** | Custo de Produção (soma dos materiais/insumos usados no produto) |
| **Impostos** | Soma das alíquotas dos impostos vinculados ao produto |
| **DF** | Despesas Fixas rateadas — calculado automaticamente pelo sistema |
| **ML** | Margem de Lucro desejada, definida por produto |
| **D** | Desconto Máximo que a equipe de vendas pode conceder sem corroer a margem |

O sistema é organizado por **segmento de negócio** — Confeitaria 🧁, Indústria 🏭 ou Serviços 🛠️ — que muda apenas os rótulos das telas (ex.: "Ingrediente" vs "Matéria-prima" vs "Custo direto"), mas não a fórmula.

O fluxo de trabalho recomendado para colocar a empresa em produção é:

```
1. Cadastrar a Empresa  →  2. Configurar Impostos  →  3. Lançar Despesas Fixas
   →  4. Cadastrar Materiais  →  5. Cadastrar Produtos (ficha técnica)
   →  6. Consultar a Precificação  →  7. Configurar Usuários e Perfis
```

Este manual segue exatamente essa ordem.

---

## 2. Acesso ao sistema (login)

1. Acesse a URL do sistema. Você verá a tela **"Boas-vindas de volta"** com o logo **Markup**.
2. Preencha:
   - **E-mail**
   - **Senha**
3. Clique em **"Entrar no sistema"**.
4. Se as credenciais estiverem incorretas ou o usuário estiver **inativo**, aparece a mensagem: *"E-mail não encontrado ou usuário inativo."*
5. Ao autenticar com sucesso, você é redirecionado para o **Dashboard**.

> **Nota de treinamento (ambiente de demonstração):** a tela de login possui um painel **"Acesso rápido (demo)"** com atalhos que preenchem o e-mail automaticamente para simular diferentes perfis — por exemplo, um ADMIN global que vê todas as empresas, um proprietário que só vê a própria empresa, um gerente com menu reduzido e um vendedor com menu mínimo. Use esses atalhos para entender como o RBAC (seção 14) muda o que cada pessoa enxerga.

---

## 3. Navegação e troca de empresa

Depois do login você chega ao layout principal, composto por:

- **Menu lateral (sidebar)** à esquerda, agrupado em: *Principal*, *Cadastros*, *Análise*, *Configurações* e (se você for ADMIN global) *Gestão do Site*.
- **Cabeçalho** no topo, com o **seletor de empresa** (Company Switcher).
- **Rodapé da sidebar**, com seu avatar, nome, perfil atual e o botão de **Sair**.

O menu lateral só mostra os itens que o seu **perfil de acesso** permite — isso é o RBAC funcionando na prática (mais detalhes na seção 14).

### Trocando de empresa (multiempresa)

Se o seu usuário tem acesso a mais de uma empresa (por ser dono de várias, ou por ter sido convidado como colaborador em outra), use o seletor no topo:

1. Clique no card com o nome da empresa ativa (ícone do segmento + razão social + CNPJ).
2. Um menu suspenso lista todas as empresas às quais você tem acesso, com um ✓ na empresa ativa.
3. Clique em outra empresa para trocar o contexto — todos os dados das telas (produtos, materiais, despesas, etc.) passam a refletir a empresa selecionada.
4. No fim da lista há o botão **"+ Nova empresa"**, que abre o formulário de cadastro (ver seção 4.2).

> Usuários com perfil **ADMIN** (escopo global) enxergam todas as empresas cadastradas na base, independentemente de serem donos ou não. Os demais usuários só veem as empresas que **possuem** (cadastraram) ou que foram **compartilhadas** com eles.

---

## 4. Cadastro da Empresa

### 4.1 Editando a empresa ativa

Menu lateral → **Configurações → Empresa** (rota `/empresa`).

Campos do formulário **"Dados Cadastrais"**:

| Campo | Descrição |
|---|---|
| **Razão Social** | Nome jurídico da empresa (obrigatório) |
| **CNPJ** | Formato `00.000.000/0000-00` |
| **Segmento de Negócio** | 🧁 Confeitaria, 🏭 Indústria ou 🛠️ Serviços — define os rótulos usados nas demais telas |
| **Regime Tributário** | MEI, Simples Nacional, Lucro Presumido ou Lucro Real |
| **Anexo Simples** (só aparece se o regime for Simples Nacional) | Anexo I a V |
| **Faturamento Médio Mensal (R$)** | Base de cálculo do rateio das Despesas Fixas — **revisar mensalmente** |
| **Folha de Pagamento Mensal (R$)** (só aparece se o segmento for Serviços) | Salários + pró-labore + encargos — numerador do **Fator R** (ver seção 11) |

Passos:

1. Preencha ou ajuste os campos.
2. Se o segmento escolhido for **Serviços**, o campo de Folha de Pagamento aparece e o sistema calcula o **Fator R** em tempo real, exibindo qual Anexo do Simples será aplicado (Anexo III a 6% se Fator R ≥ 28%, ou Anexo V a 15,5% caso contrário).
3. Clique em **"Salvar Alterações"**.
4. Uma mensagem **"✓ Dados salvos com sucesso"** confirma a gravação.

Na coluna lateral direita, o card **"Indicadores"** mostra em tempo real:
- Faturamento Médio (por mês)
- **% Despesas Fixas** sobre o faturamento (fica em destaque/aviso se passar de 20%)
- Segmento e sua descrição
- Regime tributário e o Anexo (se Simples Nacional)
- Fator R e o Anexo aplicado (se Serviços)

> ⚠ **Importante para o treinamento:** o quadro de aviso na tela lembra que `% DF = Total de Despesas / Faturamento Médio × 100`. Se o faturamento mudar, **a precificação de todos os produtos é recalculada automaticamente**, pois o % de Despesas Fixas entra direto no divisor do markup.

### 4.2 Cadastrando uma nova empresa

Use quando a mesma conta de usuário administra mais de um negócio (multiempresa).

1. Clique no seletor de empresa no topo → **"+ Nova empresa"**.
2. No modal **"Nova Empresa"**, escolha o **Segmento de negócio** clicando em um dos três cartões (Confeitaria, Indústria ou Serviços). O sistema já sugere um Anexo Simples típico para o segmento escolhido (Anexo II para Confeitaria/Indústria, Anexo III para Serviços).
3. Preencha:
   - **Razão Social*** (obrigatório)
   - **CNPJ*** (obrigatório)
   - **Regime Tributário**
   - **Anexo Simples** (se aplicável)
   - **Faturamento Médio Mensal (R$)*** (obrigatório, > 0)
   - **Folha de Pagamento Mensal (R$)** (se o segmento for Serviços — mostra o Fator R calculado ao vivo)
4. Se faltar um campo obrigatório, o sistema lista os erros em um quadro vermelho antes de salvar (ex.: *"Razão social é obrigatória."*, *"CNPJ é obrigatório."*, *"Informe o faturamento médio mensal."*).
5. Clique em **"Criar Empresa"**.
6. A nova empresa passa a aparecer no seletor de empresas e você já pode alternar para ela.

> O usuário que cria a empresa se torna automaticamente o seu **dono** (`donoUsuarioId`). Só o dono, um colaborador explicitamente convidado, ou um ADMIN global, conseguem acessá-la depois.

---

## 5. Configuração de Impostos

Menu lateral → **Cadastros → Impostos** (rota `/impostos`).

Esta tela cadastra as **alíquotas de impostos** que serão vinculadas aos produtos na hora de montar o preço.

### 5.1 Consultando os impostos cadastrados

A tela exibe:
- Um **banner informativo** no topo com uma dica de enquadramento (ex.: *"Confeitaria e bolos → Anexo II (Indústria). ISS = zero para venda de mercadoria própria. Alíquota DAS = 4,5% para faturamento anual até R$ 180.000,00."*).
- Cards com cada imposto: nome, chave técnica, alíquota (%) em destaque, descrição e status (Ativo/Inativo).
- Uma tabela de referência **"Simples Nacional — Anexo II"** com as faixas de faturamento anual e suas alíquotas DAS (4,5% até R$ 180 mil; 7,8% até R$ 360 mil; 10% até R$ 720 mil; 11,2% até R$ 1,8 milhão) e o limite do MEI (R$ 81.000/ano).

### 5.2 Cadastrando um novo imposto

1. Clique em **"+ Novo Imposto"**.
2. Preencha:
   - **Nome** (ex.: "Simples Nacional — Anexo II (Faixa 1)")
   - **Chave** — identificador único, convenção `SIMPLES_NACIONAL_...` (ex.: `SIMPLES_NACIONAL_ANEXO_II_F1`)
   - **Alíquota (%)** — ex.: `4.5`
   - **Descrição**
   - Marcar/desmarcar **"Imposto ativo"**
3. Clique em **"Salvar"**.

### 5.3 Editando um imposto existente

Clique em **"Editar"** no card do imposto, ajuste os campos e salve. Alterar a alíquota de um imposto já vinculado a produtos **recalcula automaticamente** o preço de venda desses produtos.

---

## 6. Cadastro de Despesas Fixas

Menu lateral → **Cadastros → Despesas Fixas** (rota `/despesas`).

As Despesas Fixas (aluguel, energia, pró-labore, contador etc.) não entram diretamente no custo do produto — elas são **rateadas proporcionalmente** sobre o faturamento médio da empresa, virando um percentual (**% DF**) que soma no divisor do markup.

```
% DF = (Soma das Despesas Fixas ativas) / (Faturamento Médio Mensal) × 100
```

### 6.1 Indicadores no topo da tela

- **Total Mensal** — soma de todas as despesas ativas.
- **% do Faturamento** — fica em laranja/atenção se ultrapassar 20%.
- **Itens Ativos** — quantos itens ativos existem, do total cadastrado.

### 6.2 Cadastrando uma nova despesa

1. Clique em **"+ Nova Despesa"**.
2. Preencha:
   - **Descrição** (ex.: "Aluguel do espaço")
   - **Categoria**: Aluguel, Energia, Gás, Internet, Pró-labore, Contador ou Outro
   - **Valor Mensal (R$)**
   - Marcar **"Despesa ativa"** (só despesas ativas entram no rateio)
3. Clique em **"Salvar"**.

### 6.3 Editando ou removendo uma despesa

- Clique em **"Editar"** na linha da despesa para ajustar valor, categoria ou status.
- Clique em **"Remover"** para excluir — o sistema pede confirmação antes de apagar.

> A tabela mostra, por linha, o **% do Faturamento** que aquela despesa específica representa — útil para identificar rapidamente despesas desproporcionais.

---

## 7. Cadastro de Materiais / Insumos

Menu lateral → **Cadastros → Materiais** (rota `/materiais`; o rótulo muda conforme o segmento: "Ingredientes & Insumos" na Confeitaria, "Matérias-primas & Insumos" na Indústria, "Mão de obra & Custos diretos" em Serviços).

Os materiais são os itens que compõem o **Custo Base (CP)** de cada produto.

### 7.1 Indicadores

- Total de materiais cadastrados.
- **Estoque Baixo** — quantos itens têm estoque ≤ 5 unidades.

### 7.2 Cadastrando um novo material

1. Clique em **"+ Novo [Ingrediente/Matéria-prima/Custo direto]"**.
2. Preencha:
   - **Nome do Material** (ex.: "Farinha de trigo")
   - **Unidade**: KG, G, L, ML, UN, CX, PCT, H (hora), PC, TON, M ou M² — o sistema já sugere a unidade principal do segmento (KG para Confeitaria, UN para Indústria, H para Serviços)
   - **Custo Unitário (R$)**
   - **Fornecedor** (opcional)
   - **Estoque atual** (opcional — não se aplica bem a "hora técnica" em serviços)
3. Clique em **"Salvar"**.

> Em empresas de **Serviços**, o "material" mais comum é a **hora técnica** (unidade `H`) de cada função — ex.: "Hora — Desenvolvedor Sênior", "Hora — UX/UI Designer" — com tipo `MAO_DE_OBRA`. Custos diretos (deslocamento, licença de software, ambiente cloud) usam tipo `INSUMO`.

### 7.3 Editando um material

Clique em **"Editar"** na linha da tabela, ajuste os campos e salve. Alterar o **custo unitário** recalcula automaticamente o custo base de todos os produtos que usam esse material.

### 7.4 Busca e paginação

Use o campo de busca para filtrar por nome ou fornecedor. A lista carrega em blocos de 10 itens (rolagem infinita) — role até o fim para carregar mais.

---

## 8. Cadastro de Produtos (Ficha Técnica)

Menu lateral → **Cadastros → Produtos** (rota `/produtos`).

Aqui é onde a **ficha técnica** de cada produto/serviço é montada: quais materiais ele consome, em que quantidade, qual margem de lucro e qual desconto máximo o vendedor pode conceder.

### 8.1 Visualizando produtos

A tela lista os produtos em cards, com busca por nome, filtro por categoria e, em cada card: categoria, descrição, quantidade de materiais/insumos, **Margem** e **Desc. máx.** Clique em um card para abrir o detalhe (seção 10).

### 8.2 Cadastrando um novo produto

1. Clique em **"+ Novo Produto"**.
2. **Dados do Produto**:
   - **Nome*** (obrigatório)
   - **Descrição**
   - **Categoria** (texto livre, ex.: "Bolos Clássicos")
   - **Produto ativo** (checkbox)
3. **Parâmetros de Precificação**:
   - **Margem de Lucro — ML (%)** — a rentabilidade líquida desejada sobre o preço de venda (dica na tela: alimentação recomenda 25%–40%)
   - **Desconto Máximo (%)** — reserva para promoções/negociação, **sem perder a margem-alvo**
4. **Ficha Técnica — Insumos**:
   - Clique em **"+ Insumo"** para adicionar uma linha.
   - Escolha o **Material**, informe a **Quantidade** utilizada — o sistema mostra a **unidade** e o **custo total** daquele item automaticamente.
   - Repita para todos os insumos da receita/composição.
   - Use o **×** para remover uma linha.
5. **Impostos Vinculados**:
   - Clique em **"+ Imposto"** para vincular um imposto cadastrado (a alíquota é copiada automaticamente, mas pode ser ajustada manualmente por produto).
   - Use o **×** para desvincular.
6. Validações antes de salvar: o **Nome** é obrigatório e é preciso ter **ao menos um material** na ficha técnica — caso contrário o sistema mostra os erros em destaque e não permite salvar.
7. Clique em **"Criar Produto"**.

### 8.3 Editando um produto

Abra o produto (clique no card ou vá ao detalhe) e clique em **"Editar Produto"** — o mesmo formulário é reaberto pré-preenchido.

---

## 9. Formatação do Preço — Precificação

Menu lateral → **Principal → Precificação** (rota `/precificacao`).

Esta é a tela central do sistema: mostra, produto a produto, **como o preço de venda é formado**, seguindo a fórmula do Markup por Divisor.

### 9.1 Calculadora por Produto

1. No seletor **"Produto"**, escolha um produto já cadastrado.
2. O sistema exibe:
   - **Preço de Venda** em destaque.
   - **Fórmula visual**: `Custo Base (CP) ÷ Divisor Markup = PV Final`, com o valor do divisor (ex.: `0,6300`) e o detalhamento `1 − soma dos percentuais`.
   - **Composição do Preço** — uma barra colorida e uma lista com cada fatia do preço:
     - Custo de Produção
     - Impostos (%)
     - Despesas Fixas
     - Desconto Máximo (reserva)
     - Lucro Líquido

Isso permite visualizar, de forma didática, **quanto de cada real cobrado vai para custo, imposto, despesa fixa, reserva de desconto e lucro**.

### 9.2 Simulação Manual

Ao lado da calculadora por produto, a **Simulação Manual** permite testar a fórmula "no braço", sem precisar de um produto cadastrado — ideal para treinamento e explicações rápidas:

1. Informe:
   - **Custo Base — CP (R$)**
   - **Impostos (%)**
   - **Despesas Fixas — DF (%)**
   - **Margem de Lucro — ML (%)**
   - **Desconto Máximo (%)**
2. O sistema calcula em tempo real:
   - A fórmula `PV = CP / Divisor`
   - O **Preço de Venda** resultante
   - A **soma dos percentuais** e o **divisor**

> **Exemplo didático (valores padrão da simulação):** CP = R$ 12,00, Impostos = 4,5%, DF = 15%, ML = 30%, Desconto = 5%. Soma = 54,5% → Divisor = 1 − 0,545 = 0,455 → PV = 12 / 0,455 ≈ **R$ 26,37**.

---

## 10. Detalhe do Produto, Faixa de Negociação e PDF

Clique em qualquer produto na tela de Produtos (ou em "Ver ficha técnica →") para abrir a **página de detalhe** (rota `/produtos/:id`).

Esta página reúne tudo sobre o produto:

### 10.1 Ficha Técnica

Tabela com cada material usado, quantidade, unidade, custo unitário e custo total, terminando na linha **"Custo Base Total (CP)"**.

### 10.2 Impostos Vinculados

Lista os impostos aplicados ao produto e suas alíquotas.

### 10.3 Faixa de Negociação

Um card mostra, do **preço de tabela** (desconto 0%) até o **piso** (desconto máximo cadastrado), quanto o vendedor pode conceder de desconto **sem tocar na margem de lucro-alvo** — porque o desconto máximo já foi reservado no divisor do markup. A faixa mostra "degraus" intermediários com o preço praticado, o lucro correspondente e a margem efetiva em cada ponto.

### 10.4 Parâmetros de Precificação (coluna direita)

- **Margem de Lucro (ML)** — pode ser editada rapidamente clicando em **"Editar"** ao lado do valor, sem precisar abrir o formulário completo.
- **Desconto (mín. → máx.)** — mostra o piso de preço, abaixo do qual a venda sai do lucro.
- **Impostos (total)** e **Despesas Fixas (rateio)**.
- Um bloco de resumo com a fórmula `PV = Custo Base / Divisor`, o **Preço de Venda** e o detalhamento (custo recuperado, impostos, despesas fixas, desconto reservado e lucro líquido).

### 10.5 Gerando o PDF da Ficha Técnica

1. Clique em **"Gerar PDF"** no topo da página.
2. O sistema solicita ao backend a geração do relatório **"Ficha Técnica do Produto"**.
3. Se houver falha na geração, uma mensagem de erro aparece na tela.

> A página também tem um layout específico para **impressão** (cabeçalho com razão social e CNPJ da empresa, data de emissão), acionado quando o navegador imprime a página.

---

## 11. Fator R (empresas de Serviços)

Menu lateral → **Análise → Fator R** (rota `/fator-r`) — visível para qualquer perfil com permissão `EMPRESA_READ`.

O **Fator R** só se aplica a empresas do segmento **Serviços** no **Simples Nacional**, e decide qual Anexo tributário será usado:

```
Fator R (%) = Folha de Pagamento Mensal / Faturamento Médio Mensal × 100
```

- **Fator R ≥ 28%** → tributa pelo **Anexo III** (alíquota inicial de 6%) — mais vantajoso.
- **Fator R < 28%** → tributa pelo **Anexo V** (alíquota inicial de 15,5%).

### 11.1 Simulador de Fator R

Se a empresa ativa é de Serviços, a tela mostra:

1. O **Faturamento médio mensal** (fixo, vem do cadastro da empresa).
2. Um **slider (controle deslizante)** de **Folha de pagamento mensal** — arraste para simular diferentes valores de folha e ver o Fator R e o Anexo mudarem em tempo real.
3. Um **medidor visual (gauge)** com o percentual do Fator R e uma linha marcando o limite de 28%.
4. Uma dica dizendo exatamente **quanto a folha precisaria aumentar** para migrar ao Anexo III, quando o Fator R está abaixo do limite.

### 11.2 Impacto no preço

Um card comparativo mostra, para o mesmo serviço, **quanto o preço de venda mudaria** se a empresa estivesse no Anexo III versus no Anexo V, evidenciando o impacto financeiro direto de manter (ou não) a folha de pagamento acima de 28% do faturamento.

### 11.3 Empresas de serviços (comparativo)

Uma tabela final lista todas as empresas de Serviços da base, com faturamento, folha, Fator R calculado e o Anexo resultante — útil para comparar o cenário entre diferentes empresas/filiais.

> Se a empresa ativa **não** for do segmento Serviços, a tela exibe um aviso explicando que o Fator R não se aplica e direciona para trocar de empresa ou consultar o comparativo.

---

## 12. Relatórios

Menu lateral → **Análise → Relatórios** (rota `/relatorios`).

Três relatórios estão disponíveis por abas:

1. **Precificação Completa** — tabela com todos os produtos e, para cada um: custo base, % impostos, % DF, % ML, % desconto, divisor e preço de venda/lucro líquido calculados.
2. **Despesas Fixas** — lista de despesas com valor, % do faturamento e status, mais o total geral.
3. **Custo de Materiais** — lista de materiais com custo unitário, fornecedor, estoque e um alerta visual (**"Baixo"**) quando o estoque estiver ≤ 5 unidades.

Clique em **"📄 Exportar PDF"** no canto superior direito para gerar o documento correspondente à aba selecionada.

---

## 13. Configuração de Usuários

Menu lateral → **Configurações → Usuários** (rota `/usuarios`) — exige permissão `USUARIO_READ`.

### 13.1 Visualizando usuários

Cada usuário aparece em um card com avatar (iniciais do nome), nome, e-mail, os perfis vinculados (badges verdes) e o status (Ativo/Inativo).

Abaixo, a tabela **"Visão Geral — Permissões por Perfil"** resume, por perfil: quantos usuários o utilizam, as primeiras permissões concedidas e a descrição do perfil.

### 13.2 Cadastrando um novo usuário

1. Clique em **"+ Novo Usuário"**.
2. Preencha:
   - **Nome Completo**
   - **E-mail**
   - **Perfil de Acesso** — selecione um dos perfis cadastrados (ver seção 14)
   - **Usuário ativo** (checkbox)
3. Clique em **"Salvar"**.

### 13.3 Editando um usuário

Clique em **"Editar"** no card do usuário para trocar nome, e-mail, perfil vinculado ou status (ativar/desativar).

> Desativar um usuário **bloqueia o login** dele imediatamente (mensagem *"E-mail não encontrado ou usuário inativo"* na tela de login), sem excluir o histórico de dados associado a ele.

---

## 14. Perfis de Acesso e Permissões (RBAC)

Menu lateral → **Configurações → Perfis & RBAC** (rota `/perfis`) — exige permissão `PERFIL_READ`.

O sistema usa **RBAC** (controle de acesso baseado em papéis): cada usuário tem um **perfil**, e cada perfil concentra um conjunto de **permissões** (chaves como `PRODUTO_READ`, `PRODUTO_WRITE`, `EMPRESA_WRITE` etc.), organizadas por módulo (Produtos, Materiais, Despesas, Impostos, Relatórios, Usuários, Empresa, Perfis).

### 14.1 Perfis padrão do sistema

| Perfil | Escopo | O que pode fazer |
|---|---|---|
| **ADMIN** | Global (todas as empresas) | Acesso total — é o único perfil de **suporte/gestão da plataforma**, usado pelo módulo *Gestão do Site* (seção 15) |
| **PROPRIETARIO** | Por empresa | Acesso total, mas restrito às empresas que possui ou que foram compartilhadas com ele |
| **GERENTE** | Por empresa | Leitura e edição de Produtos e Materiais, leitura de Despesas e Relatórios, leitura da Empresa |
| **VENDEDOR** | Por empresa | Apenas leitura de Produtos e Relatórios — menu mínimo |
| **CONTADOR** | Por empresa | Impostos (leitura/edição), Despesas (leitura/edição), Relatórios e leitura da Empresa |

### 14.2 Consultando a Matriz de Permissões

A tela exibe:
- **Cards de perfil**, cada um com a contagem de permissões e "chips" coloridos indicando permissões de leitura (`_READ`, em verde-claro) e de escrita (`_WRITE`, em amarelo).
- Uma **Matriz de Permissões RBAC** completa: linhas agrupadas por módulo, colunas por perfil, com ✓ indicando que aquele perfil possui aquela permissão específica.

Use a matriz para responder perguntas como *"o Vendedor consegue editar despesas?"* rapidamente (procure a linha `DESPESA_WRITE`, coluna VENDEDOR).

### 14.3 Como as permissões afetam a navegação

- Cada item do menu lateral está associado a uma permissão (`meta.permissao` da rota). Se o perfil do usuário não tiver aquela permissão, **o item nem aparece no menu**, e se o usuário tentar acessar a URL diretamente, é redirecionado de volta ao Dashboard.
- Isso é apenas uma conveniência de interface — **a autoridade final é sempre o backend**, que valida a mesma permissão em cada operação.

### 14.4 Multiempresa e compartilhamento

Um usuário pode ter **múltiplos vínculos** — ele pode ser dono de uma empresa e, ao mesmo tempo, ter sido **convidado/compartilhado** em outra empresa com um perfil diferente (por exemplo, ser Proprietário na própria confeitaria e atuar como Contador em uma empresa de terceiros). Cada vínculo é independente e define o perfil (e portanto as permissões) daquele usuário **naquela empresa específica**.

---

## 15. Gestão do Site (módulo ADMIN global)

Visível apenas para usuários com perfil de **escopo global** (ADMIN) — aparece como o grupo **"Gestão do Site"** no fim do menu lateral, com identidade visual própria (ícone ⚙ e cores neutras).

> Diferente das demais seções, o acesso aqui **não depende de uma permissão RBAC específica**, e sim do **escopo global** do perfil — mesmo um usuário PROPRIETARIO (que tem todas as permissões dentro das suas empresas) não enxerga este módulo.

### 15.1 Visão Geral (rota `/admin`)

Painel de entrada com:
- Estatísticas gerais: empresas cadastradas, usuários na base (ativos/inativos), vínculos usuário↔empresa e faturamento médio somado de toda a base.
- **Empresas por segmento** — quantas empresas existem em cada segmento.
- **Perfis em uso** — quantos usuários usam cada perfil e se o escopo é global ou por empresa.
- **Maiores equipes** — as 5 empresas com mais usuários vinculados, com atalho para gerenciá-las.

### 15.2 Empresas (rota `/admin/empresas`)

Lista **todas** as empresas da base (independente de dono), permitindo abrir o detalhe de cada uma para gerenciar sua equipe/vínculos.

### 15.3 Usuários Globais (rota `/admin/usuarios`)

Lista **todos** os usuários da base com filtros por nome/e-mail, empresa, perfil e status. Para cada usuário mostra:
- Se o escopo é **global** (ADMIN) ou **por empresa**.
- Todos os **acessos** (empresa + perfil, com indicação de "dono" quando aplicável).
- Ação de **Ativar/Desativar** o usuário diretamente na lista.

---

## 16. Glossário rápido

| Termo | Significado |
|---|---|
| **CP** | Custo de Produção — soma dos materiais/insumos da ficha técnica |
| **ML** | Margem de Lucro — % de lucro líquido desejado sobre o preço de venda |
| **D** | Desconto Máximo — % reservado no preço para negociação sem perder a margem |
| **DF** | Despesas Fixas — % obtido do rateio das despesas fixas sobre o faturamento médio |
| **Divisor de Markup** | `1 − (Impostos% + DF% + ML% + D%)/100` |
| **PV** | Preço de Venda = CP ÷ Divisor |
| **Fator R** | Folha de pagamento ÷ Faturamento médio — decide o Anexo do Simples para Serviços |
| **Anexo Simples** | Faixa de tributação do Simples Nacional (I a V) |
| **RBAC** | Controle de acesso baseado em papéis (perfis + permissões) |
| **Escopo Global** | Característica do perfil ADMIN: enxerga e opera todas as empresas da base |
| **Dono (`donoUsuarioId`)** | Usuário que cadastrou a empresa — tem acesso pleno a ela por padrão |
| **Vínculo/Compartilhamento** | Acesso concedido a um usuário em uma empresa que ele não é dono, com um perfil específico |

---

*Manual gerado para fins de treinamento — reflete o comportamento das telas do frontend (Vue 3 + TypeScript) do sistema Markup.*
