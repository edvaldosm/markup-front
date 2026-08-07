---
title: "Cadastro de Materiais / Insumos"
ordem: 7
tags: [materiais, insumos, materia-prima, hora-tecnica, custo-unitario, estoque]
resumo: "Cadastro dos itens (ingredientes, matérias-primas, horas técnicas ou custos diretos) que compõem o custo base (CP) de cada produto, incluindo unidade de medida, custo unitário, fornecedor e estoque. Não há exclusão: apenas criação e edição."
---

# 7. Cadastro de Materiais / Insumos

> **Contexto:** este documento faz parte do *Manual de Utilização — Sistema Markup*, ferramenta de precificação estratégica por Markup Divisor (`PV = CP / Divisor`). Veja o índice completo em [`00-indice.md`](./00-indice.md).

Menu lateral → **Cadastros → Materiais** (rota `/materiais`; o rótulo muda conforme o segmento: "Ingredientes & Insumos" na Confeitaria, "Matérias-primas & Insumos" na Indústria, "Mão de obra & Custos diretos" em Serviços, "Mercadorias & Custos de aquisição" em Comércio).

Os materiais são os itens que compõem o **Custo Base (CP)** de cada produto (ver [`08-produtos-ficha-tecnica.md`](./08-produtos-ficha-tecnica.md)).

## 7.1 Indicadores

- Total de materiais cadastrados.
- **Estoque Baixo** — quantos itens têm estoque ≤ 5 unidades.

## 7.2 Cadastrando um novo material

1. Clique em **"+ Novo [Ingrediente/Matéria-prima/Custo direto/Custo de aquisição]"**.
2. Preencha:
   - **Nome do Material** (ex.: "Farinha de trigo")
   - **Unidade**: KG, G, L, ML, UN, CX, PCT, H (hora), PC, TON, M ou M² — o sistema já sugere a unidade principal do segmento (KG para Confeitaria, UN para Indústria e Comércio, H para Serviços)
   - **Custo Unitário (R$)**
   - **Fornecedor** (opcional)
   - **Estoque atual** (opcional — não se aplica bem a "hora técnica" em serviços)
3. Clique em **"Salvar"**.

A empresa do material **não é escolhida no formulário** — o sistema sempre grava contra a empresa ativa no momento (ver [`03-navegacao-e-troca-de-empresa.md`](./03-navegacao-e-troca-de-empresa.md)); não há como criar um material para outra empresa por engano.

```mermaid
flowchart TD
    A["Menu: Cadastros > Materiais"] --> B["Clicar em + Novo Material"]
    B --> C["Preencher Nome, Unidade e Custo Unitário"]
    C --> D["Preencher Fornecedor e Estoque (opcional)"]
    D --> E["Clicar em Salvar"]
    E --> F["Material disponível na Ficha Técnica dos Produtos"]
```

> Em empresas de **Serviços**, o "material" mais comum é a **hora técnica** (unidade `H`) de cada função — ex.: "Hora — Desenvolvedor Sênior", "Hora — UX/UI Designer" — com tipo `MAO_DE_OBRA`. Custos diretos (deslocamento, licença de software, ambiente cloud) usam tipo `INSUMO`.

## 7.3 Editando um material

Clique em **"Editar"** na linha da tabela, ajuste os campos e salve. Alterar o **custo unitário** recalcula automaticamente o custo base de todos os produtos que usam esse material.

> **Não existe exclusão de material.** A tela só permite criar e editar — o contrato não tem uma operação de remoção. Um material que não deve mais ser usado permanece cadastrado (mas pode simplesmente parar de ser referenciado em novas fichas técnicas).

## 7.4 Busca e paginação

Use o campo de busca para filtrar por nome ou fornecedor. A lista carrega em blocos de 10 itens (rolagem infinita) — role até o fim para carregar mais.
