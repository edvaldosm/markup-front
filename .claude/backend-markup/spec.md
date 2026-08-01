# Spec — Backend Markup

> **Requisitos** (o quê e por quê) do backend. O **como** (templates, código) está
> em `skills/`. Os princípios em [constitution.md](../constitution.md). Este spec
> descreve o **baseline** do backend; mudanças novas nascem em `.claude/specs/<slug>/`.

## Objetivo

Expor uma API **GraphQL** (Java 21 + Spring Boot 4, Spring for GraphQL) que
centraliza o cálculo de precificação por Markup por Divisor, isolada por empresa
(ownership), protegida por RBAC, e com um **assistente RAG** de apoio ao usuário.

## Requisitos funcionais

- **RB-01 (Precificação):** o sistema DEVE calcular o Preço de Venda no servidor
  pela fórmula `PV = CP / (1 - (Impostos+DF+ML+D)/100)`. (Artigos B1, B3)
  - Aceite: `precificarProduto(produtoId)` retorna `ResultadoPrecificacao` com
    breakdown; soma ≥ 100% ⇒ erro, nunca preço ≤ 0.
- **RB-02 (Custo base):** DEVE calcular CP = `SUM(qtd × custo_unitario)` da ficha técnica.
- **RB-03 (Despesas fixas):** DEVE calcular %DF = `SUM(valor_mensal_ativo)/faturamento×100` dinamicamente.
  - Aceite: despesa com `ativa = false` não entra no somatório; faturamento ≤ 0 ⇒ %DF = 0.
- **RB-03a (Fator R e anexo):** para segmento `SERVICOS` no Simples, DEVE derivar
  `fatorR = folha/faturamento×100` e o `anexoAplicado` (≥28% ⇒ ANEXO_III, senão
  ANEXO_V), devolvendo ambos em `ResultadoPrecificacao`. (Artigo B10)
  - Aceite: fora desse recorte, `fatorR` e `anexoAplicado` vêm **nulos**;
    faturamento ≤ 0 ⇒ `fatorR = 0`.
- **RB-03b (Guardas de cálculo):** toda divisão DEVE ser guardada e toda entrada
  inválida rejeitada — nunca um número plausível e errado. (Artigo B11)
  - Aceite: material órfão ⇒ erro (não custo ignorado); `ML`/`D`/alíquota
    negativos ⇒ rejeitados na entrada; cada guarda V1–V8 tem teste.
- **RB-04 (Multi-tenant):** toda operação DEVE restringir-se às empresas autorizadas
  ao usuário do JWT. (Artigos B2, B9)
  - Aceite: usuário não lê/escreve dados de empresa que não possui nem foi compartilhada.
- **RB-05 (RBAC):** cada operação DEVE exigir a permissão correspondente (`*_READ`/`*_WRITE`). (Artigo B5)
- **RB-06 (Auth):** login DEVE emitir JWT com claims `sub`, `role`, `permissoes`; refresh sem re-login.
- **RB-07 (CRUD de domínio):** empresa, despesas, materiais, impostos, produtos
  (com ficha técnica e impostos), perfis/permissões e usuários.
- **RB-08 (Seed):** DEVE popular impostos padrão, 16 permissões, 5 perfis e admin inicial.
- **RB-09 (Ownership + ADMIN global):** empresa tem dono (`dono_usuario_id`); usuário
  comum vê só as próprias/compartilhadas; `minhasEmpresas` reflete isso; ADMIN vê todas. (Artigo B9)
  - Aceite: Edvaldo (E1,E2), Santiago (E3,E4), Matos (E5,E6) — cada um só vê as suas; ADMIN vê as seis.
- **RB-10 (Assistente RAG):** `perguntarAssistente(pergunta)` DEVE responder **só**
  sobre formação de preço, com guardrails de escopo e de conteúdo ofensivo, ancorado
  no vault ingerido (Spring AI + Claude + pgvector); sem fonte relevante ⇒ não alucina. (Artigo B8)
  - Aceite: pergunta fora de tema ⇒ `FORA_DE_ESCOPO`; ofensiva ⇒ `RECUSADO`; sem doc ⇒ `SEM_FONTE`.

## Modelo de dados (requisito)

Entidades e relações conforme o DER v3 — ver template
[modelagem-der-markup](skills/modelagem-der-markup/SKILL.md).

## Contrato (requisito)

Schema GraphQL (tipos, queries, mutations, inputs) — ver template
[schema-graphql-markup](skills/schema-graphql-markup/SKILL.md). Endpoint
`POST /graphql` com `Authorization: Bearer <token>`.

## Fora de escopo (não-objetivos)

Formatação de moeda/percentual, ordenação e filtragem de UI, e estado de
interface — pertencem ao frontend. (Artigo B7)

## Rastreabilidade → templates (`skills/`)

| Requisito | Template |
|-----------|----------|
| RB-01/02/03 | `catalogo-calculos-validacoes`, `formula-markup-divisor`, `service-precificacao-java` |
| RB-03a/03b | `catalogo-calculos-validacoes`, rules R10/R11 |
| RB-04/05/09 | `rbac-permissoes`, rules R02/R05/R09 |
| RB-06 | `auth-jwt-spring` |
| RB-07 | `modelagem-der-markup`, `schema-graphql-markup`, `estrutura-projeto-spring` |
| RB-08 | `seed-dados-iniciais` |
| RB-10 | `assistente-rag-precificacao`, rule R08 |
