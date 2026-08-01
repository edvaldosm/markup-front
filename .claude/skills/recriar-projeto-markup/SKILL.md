---
name: recriar-projeto-markup
description: Recria o projeto Markup do zero (backend Java 21 + Spring Boot 4 e frontend Vue) a partir das bases de conhecimento .claude/backend-markup e .claude/frontend-markup, respeitando as Rules. Use quando o usuário pedir para recriar/scaffoldar/reconstruir o projeto inteiro.
---

# Recriar projeto Markup (orquestrador)

Gera **do zero** o backend e o frontend do sistema de precificação Markup por
Divisor, usando as bases de conhecimento segmentadas como fonte. Trabalhe em
**pt-br** e consulte primeiro o segundo cérebro
(`d:\ObsidianDocumentos\Conhecimento`) quando faltar contexto de domínio.

## Fontes (ler antes de gerar)

- Backend: `.claude/backend-markup/README.md` → 11 Rules + 10 Skills
- Frontend: `.claude/frontend-markup/README.md` → 10 Rules + 11 Skills
- Verdade do domínio: `d:\ObsidianDocumentos\Conhecimento\cálculos\financeiras\markup\wiki\wiki-markup.md`

## Regra de ouro

As **Rules** de cada base são invariantes: nunca as viole ao gerar código. As
**Skills** são os procedimentos/modelos de referência para cada parte.

## Procedimento

1. **Confirmar destino** com o usuário: backend em `backend/` (monorepo, decidido)
   e frontend na raiz; se pode sobrescrever. Não apagar nada sem confirmação.
2. **Backend** — delegar à skill [[recriar-backend-markup]] (ou executar as fases
   dela): estrutura Spring → schema GraphQL → domínio JPA → services (fórmula) →
   auth JWT → RBAC → assistente RAG → seed.
3. **Frontend** — delegar à skill [[recriar-frontend-markup]]: scaffold Vue →
   tipos → tokens → stores → composables → camada GraphQL → paginação → router/layout → telas.
4. **Integração** — garantir o contrato entre os dois:
   - `VITE_GQL_ENDPOINT` do front aponta para o endpoint do back (`/graphql`).
   - Os tipos do front (`src/types`) batem com o schema GraphQL do back (inclui
     `minhasEmpresas` e `perguntarAssistente`).
5. **Verificar** — backend: `./mvnw -q compile`; frontend: `npm install` + `npm run build`.
   Rodar o backend de fato exige PostgreSQL+pgvector e `ANTHROPIC_API_KEY`.
   Reportar o resultado real (sucesso/erros), sem afirmar que passou sem rodar.

## Escopo

Para recriar só uma parte, use diretamente [[recriar-backend-markup]] ou
[[recriar-frontend-markup]].
