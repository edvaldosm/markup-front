---
title: "Cadastro de Despesas Fixas"
ordem: 6
tags: [despesas-fixas, rateio, aluguel, pro-labore, percentual-df]
resumo: "Como lançar despesas fixas (aluguel, energia, pró-labore, contador etc.) e como o sistema calcula automaticamente o percentual de rateio (% DF) sobre o faturamento médio."
---

# 6. Cadastro de Despesas Fixas

> **Contexto:** este documento faz parte do *Manual de Utilização — Sistema Markup*, ferramenta de precificação estratégica por Markup Divisor (`PV = CP / Divisor`). Veja o índice completo em [`00-indice.md`](./00-indice.md).

Menu lateral → **Cadastros → Despesas Fixas** (rota `/despesas`).

As Despesas Fixas (aluguel, energia, pró-labore, contador etc.) não entram diretamente no custo do produto — elas são **rateadas proporcionalmente** sobre o faturamento médio da empresa (cadastrado em [`04-cadastro-empresa.md`](./04-cadastro-empresa.md)), virando um percentual (**% DF**) que soma no divisor do markup.

```
% DF = (Soma das Despesas Fixas ativas) / (Faturamento Médio Mensal) × 100
```

## 6.1 Indicadores no topo da tela

- **Total Mensal** — soma de todas as despesas ativas.
- **% do Faturamento** — fica em laranja/atenção se ultrapassar 20%.
- **Itens Ativos** — quantos itens ativos existem, do total cadastrado.

## 6.2 Cadastrando uma nova despesa

1. Clique em **"+ Nova Despesa"**.
2. Preencha:
   - **Descrição** (ex.: "Aluguel do espaço")
   - **Categoria**: Aluguel, Energia, Gás, Internet, Pró-labore, Contador ou Outro
   - **Valor Mensal (R$)**
   - Marcar **"Despesa ativa"** (só despesas ativas entram no rateio)
3. Clique em **"Salvar"**.

```mermaid
flowchart TD
    A["Menu: Cadastros > Despesas Fixas"] --> B["Clicar em + Nova Despesa"]
    B --> C["Preencher Descrição, Categoria e Valor Mensal"]
    C --> D["Marcar Despesa ativa"]
    D --> E["Clicar em Salvar"]
    E --> F["Sistema recalcula:\n% DF = Total Despesas / Faturamento × 100"]
    F --> G["% DF entra no divisor de TODOS os produtos"]
```

## 6.3 Editando ou removendo uma despesa

- Clique em **"Editar"** na linha da despesa para ajustar valor, categoria ou status.
- Clique em **"Remover"** para excluir — o sistema pede confirmação antes de apagar.

> A tabela mostra, por linha, o **% do Faturamento** que aquela despesa específica representa — útil para identificar rapidamente despesas desproporcionais.
