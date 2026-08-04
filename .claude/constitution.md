# Constituição — Projeto Markup

> Documento de princípios do sistema de precificação **Markup por Divisor**.
> São **invariantes**: toda spec, plano, tarefa e código gerado deve obedecê-los.
> Em conflito, a Constituição prevalece sobre qualquer spec ou preferência de
> implementação.

- **Idioma de trabalho:** pt-br.
- **Fonte de verdade do domínio:** `d:\ObsidianDocumentos\Conhecimento\cálculos\financeiras\markup\wiki\wiki-markup.md` (consultar o "segundo cérebro" antes da web).
- **Versão:** 2.5.0 — 2026-08-03

### Histórico
- **2.5.0** — Artigo III ganha a linha **"zero cálculo no front, sem exceção de
  tamanho"**. Emenda motivada por auditoria que encontrou fórmula de domínio
  (Fator R) rodando em telas já ligadas a dado real do backend, e agregações
  simples (soma de despesas, contagem por segmento) tratadas como "só
  apresentação" quando na prática eram números derivados sem fonte no servidor.
  Fecha a ambiguidade: tamanho da conta não isenta da regra B1/F6.
- **2.4.0** — Novos artigos **B12** (relatório é do backend, em módulo exclusivo,
  via JasperReports) e **F11** (o front pede e baixa o documento; não o monta).
  Emenda motivada pelo requisito de gerar relatórios por JasperReports: documento
  passa a ser artefato do servidor, versionado e autorizado como qualquer outra
  operação. A impressão local do protótipo vira stopgap datado, como o cálculo em
  `useMarkup.ts`.
- **2.3.0** — Novo artigo **F10**: módulo com público próprio tem **escopo de tema**
  (remapeamento de tokens), nunca cor hardcoded nem componente duplicado. Emenda
  motivada pelo módulo de Gestão do Site (ADMIN global), que precisa ser
  reconhecível pela cor e é a primeira área do sistema barrada por **escopo**
  (B9) em vez de permissão (B5).
- **2.2.0** — Novos artigos **B10** (Fator R deriva o anexo) e **B11** (guardas de cálculo). Todos os cálculos e validações passam a ter catálogo único no backend; documentada a migração do cálculo do front para o back.
- **2.1.0** — Novo artigo **F9**: toda regra de visibilidade/permissão precisa de teste de aceite navegando como cada perfil. Emenda motivada pela implementação da B9 no front.
- **2.0.0** — Backend migra de Go/gqlgen para **Java 21 + Spring Boot 4** (GraphQL via Spring for GraphQL). Novos artigos: **B8** (assistente/RAG), **B9** (ownership multi-empresa), **F8** (assistente no front).
- **1.0.0** — Versão inicial (backend Go).

---

## Artigo I — Princípios de Backend

Stack: **Java 21 + Spring Boot 4**, **Spring for GraphQL** (schema-first),
**Spring Data JPA** + PostgreSQL, **Spring Security** (JWT), **Spring AI** (RAG).
Detalhe de cada princípio em **`markup-back/.claude/backend-markup/rules/`** — o
backend tem repositório próprio, e a base de conhecimento dele mora lá. Os
artigos B1–B12 ficam aqui porque a Constituição é do **sistema**, não de um
repositório; o que saiu deste repo foi a documentação de implementação.

- **B1.** Todo cálculo de precificação vive no backend; o front só exibe. → `R01` (markup-back)
- **B2.** Toda consulta filtra por empresa autorizada ao usuário do JWT (multi-tenant). → `R02` (markup-back)
- **B3.** `divisorMarkup <= 0` retorna erro; nunca preço ≤ 0. → `R03` (markup-back)
- **B4.** Camadas separadas: domain (entidades JPA), repository, service (regra), controller GraphQL (orquestração). → `R04` (markup-back)
- **B5.** Autorização RBAC verificada em cada operação (Spring Security). → `R05` (markup-back)
- **B6.** Contrato-first: o `.graphqls` é a fonte de verdade do contrato; o código segue o schema. → `R06` (markup-back)
- **B7.** Formatação, ordenação de UI e estado de tela não vão para o backend. → `R07` (markup-back)
- **B8.** O assistente/RAG responde **apenas** sobre formação de preço; recusa conteúdo ofensivo ou fora de escopo; a fonte é o vault **ingerido** num vector store. → `R08` (markup-back)
- **B9.** Toda empresa tem um **dono** (quem a cadastrou); usuário só enxerga empresas próprias ou explicitamente compartilhadas; **ADMIN tem visão global**. → `R09` (markup-back)
- **B10.** Para serviços no Simples, o anexo é **derivado do Fator R** (≥28% ⇒ Anexo III, senão Anexo V), nunca só o cadastrado. → `R10` (markup-back)
- **B11.** Todo cálculo tem guarda explícita; entrada inválida é **rejeitada**, nunca absorvida num número plausível e errado. → `R11` (markup-back)
- **B12.** Todo documento que sai do sistema é gerado pelo backend, com **JasperReports**, no módulo exclusivo `com.markup.reports`: catálogo fechado, datasource por DTO (nunca SQL no template), autorização igual à da API e nenhum cálculo dentro do relatório. → `R12` (markup-back)

> **Catálogo dos cálculos.** Fórmulas (C1–C12) e guardas (V1–V9) vivem num único
> documento: `catalogo-calculos-validacoes` (skill em **markup-back**).
> Nenhum cálculo pode existir no sistema sem estar lá.

## Artigo II — Princípios de Frontend

Stack: **Vue 3 + Pinia + Vue Router + TypeScript + Vite**, Apollo Client.
Detalhe em `.claude/frontend-markup/rules/`.

- **F1.** Componentes em `<script setup lang="ts">` + Composition API. → [FR01](frontend-markup/rules/FR01-composition-api-ts.md)
- **F2.** Estado em Pinia setup stores por domínio, reativo à empresa ativa. → [FR02](frontend-markup/rules/FR02-stores-por-dominio.md)
- **F3.** Cores/espaços via variáveis CSS (`main.css`); nunca hardcode. → [FR03](frontend-markup/rules/FR03-design-tokens.md)
- **F4.** Toda tela com lista usa `usePaginacao` + `InfiniteScrollSentinel`. → [FR04](frontend-markup/rules/FR04-paginacao-obrigatoria.md)
- **F5.** Moeda/percentual só via `useCurrency` (Intl pt-BR). → [FR05](frontend-markup/rules/FR05-formatacao-intl.md)
- **F6.** GraphQL isolado (`MOCK_MODE`); ao ligar o backend, o cálculo sai do front. → [FR06](frontend-markup/rules/FR06-camada-graphql-isolada.md)
- **F7.** Rotas com guard de auth + lazy load de componentes. → [FR07](frontend-markup/rules/FR07-rotas-protegidas.md)
- **F8.** O assistente consome **o backend**, nunca o vault direto; não renderiza conteúdo fora de formação de preço. → [FR08](frontend-markup/rules/FR08-assistente-consome-backend.md)
- **F9.** Toda regra de **visibilidade ou permissão** tem teste de aceite que **navega como cada perfil** e prova o que ele vê e o que lhe é negado. → [FR09](frontend-markup/rules/FR09-teste-navegacao-por-perfil.md)
- **F10.** Módulo com público próprio muda de identidade por **escopo de tema** (remapeia os tokens), nunca por cor hardcoded ou componente duplicado; e o que o separa — escopo ou permissão — é declarado na rota. → [FR10](frontend-markup/rules/FR10-escopo-de-tema-por-modulo.md)
- **F11.** O front **pede e baixa** relatório do backend; não monta documento nem embarca biblioteca de PDF. Impressão local existe só no modo mock, datada. → [FR11](frontend-markup/rules/FR11-relatorio-vem-do-backend.md)

## Artigo III — Fronteira Backend ↔ Frontend

- O backend devolve **números crus**; o frontend **formata e apresenta** (B7 + F5).
- **Cálculo tem uma sede só: o backend** (B1). O cálculo hoje no protótipo Vue
  (`useMarkup.ts`) é provisório e será **removido** — não vira fallback. Duas
  fontes de verdade para preço significam dois preços. Inventário da migração em
  [FR06](frontend-markup/rules/FR06-camada-graphql-isolada.md).
- Contrato único: schema GraphQL do backend (servido por Spring for GraphQL)
  espelhado pelos tipos do front; endpoint via `VITE_GQL_ENDPOINT`.
- O assistente conversa via GraphQL (`perguntarAssistente`), com o guardrail e o
  RAG **no backend** (B8) — o front só exibe (F8).
- **Documento também tem sede única: o backend** (B12 + F11). Dados trafegam por
  GraphQL; **binário** sai por REST (`/api/relatorios/{tipo}`), com o mesmo JWT —
  base64 em GraphQL infla o payload e perde `Content-Disposition`.
- **Zero cálculo no front, sem exceção de tamanho** (emenda 2.5.0). "Cálculo tem
  uma sede só" (acima) cobre fórmula do domínio; esta linha fecha a lacuna que
  ficou aberta até 2026-08: **nenhum número derivado** — soma, contagem,
  percentual, diferença — nasce no front, mesmo quando parece só agregação de
  tela. Se o backend ainda não expõe o agregado, a tela mostra **indisponível**
  com o motivo, nunca recalcula para preencher a lacuna. Não se aplica a
  paginação, ordenação e formatação (`Intl`), que continuam do front por F4/F5 —
  a diferença é que essas não produzem um número nem uma decisão novos, só
  reorganizam ou reescrevem o que já veio pronto.

## Artigo IV — Governança (Spec-Driven Development)

1. **Fluxo de mudança:** `/specify` → `/plan` → `/tasks` → implementar. Nenhuma
   feature entra em código sem passar por uma spec em `.claude/specs/<slug>/`.
2. **Precedência:** Constituição > spec da feature > plano > preferência de código.
3. **Conformidade:** todo `spec.md`, `plan.md` e `tasks.md` declara quais artigos
   aplica; nada pode propor algo que viole um artigo sem uma emenda explícita aqui.
4. **Emenda:** alterar um princípio = editar a Rule correspondente **e** subir a
   versão desta Constituição (semver: breaking = major).
5. **Regeneração total:** as skills `recriar-*` produzem o projeto do zero a
   partir das bases, sempre respeitando estes artigos.
