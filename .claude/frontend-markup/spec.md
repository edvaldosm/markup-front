# Spec — Frontend Markup

> **Requisitos** (o quê e por quê) do frontend. O **como** (templates, código) está
> em `skills/`. Os princípios em [constitution.md](../constitution.md). Este spec
> descreve o **baseline** do front; mudanças novas nascem em `.claude/specs/<slug>/`.

## Objetivo

Protótipo navegável Vue 3 do sistema de precificação, funcionando com dados mock
e pronto para ligar no backend GraphQL por uma flag.

## Requisitos funcionais

- **RF-01 (Navegação):** 13 telas sob layout autenticado + login público, rotas
  com guard e lazy load. (Artigo F7) — ver [roteamento-e-layout](skills/roteamento-e-layout/SKILL.md).
- **RF-02 (Multi-empresa):** `CompanySwitcher` troca a empresa ativa; todas as
  listas reagem por reatividade. (Artigo F2)
- **RF-03 (Estado):** uma Pinia setup store por domínio (auth, empresa, produtos,
  materiais, despesas, impostos, usuarios). (Artigo F2)
- **RF-04 (Precificação na UI):** exibir custo, percentuais, divisor, PV e
  breakdown. Em `MOCK_MODE` o cálculo roda em `useMarkupCalculator`; ao ligar o
  backend, consumir `precificarProduto`. (Artigo F6)
- **RF-05 (Fator R):** para `SEGMENTO=SERVICOS` no Simples, calcular Fator R e
  resolver Anexo III/V (limite 28%). Tela `FatorRView` + `FatorRNote`.
- **RF-06 (Listas):** toda tela com lista usa paginação infinita. (Artigo F4)
- **RF-07 (Formatação):** moeda/percentual só via `useCurrency` (pt-BR). (Artigo F5)
- **RF-08 (Tema):** identidade verde via design tokens; pode variar por segmento. (Artigo F3)
- **RF-09 (Dados):** acesso isolado em `src/graphql` com `MOCK_MODE` e `mockQuery`. (Artigo F6)

## Fora de escopo (não-objetivos)

Cálculo de precificação como fonte de verdade (é do backend quando `MOCK_MODE=false`),
persistência real e autenticação real (mock no protótipo).

## Rastreabilidade → templates (`skills/`)

| Requisito | Template |
|-----------|----------|
| RF-01/02 | `roteamento-e-layout` |
| RF-03 | `store-pinia-dominio` |
| RF-04/05/07 | `composables-calculo-formatacao` |
| RF-06 | `paginacao-infinita` |
| RF-08 | `design-tokens-tema` |
| RF-09 | `camada-graphql-mock` |
| base | `estrutura-projeto-vue`, `modelo-de-dados-front` |
