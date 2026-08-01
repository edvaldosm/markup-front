# Rule R12 — Relatório é do backend, em módulo próprio, via JasperReports

**Categoria:** Arquitetura / Documentos
**Origem:** Requisito do usuário (2026-08-01); spec `modulo-relatorios-jasper`

## Regra

Todo documento que sai do sistema — PDF, planilha, impressão formal — é gerado
pelo **backend**, com **JasperReports**, dentro do módulo exclusivo
`com.markup.reports`. O front **pede e baixa**; não monta documento.

- **Módulo isolado.** `reports` importa services de domínio (leitura); nenhum
  pacote de domínio importa `reports`. Dependência num sentido só.
- **Catálogo fechado.** Sem entrada no `ReportCatalog` (template + permissão +
  escopo), o relatório não existe. Não há geração por template dinâmico.
- **O relatório não calcula.** Os números vêm dos services (C1–C12 do
  [[catalogo-calculos-validacoes]]). No `.jrxml` só há formatação e soma de
  banda — nunca fórmula de negócio.
- **Datasource é DTO.** `JRBeanCollectionDataSource` sobre records. **Proibido**
  `<queryString>` com SQL dentro do template.
- **Autorização é a mesma da API.** Permissão RBAC do catálogo
  ([[R05-autorizacao-rbac]]) + filtro de empresa/escopo
  ([[R02-isolamento-multiempresa]], [[R09-ownership-multiempresa]]) antes de
  qualquer linha ser buscada.
- **Binário sai por REST** (`/api/relatorios/{tipo}`, `application/pdf`), com o
  mesmo JWT; o contrato de **dados** continua em `/graphql`.

### Exceção declarada ao [[R07-fora-do-backend]]

Formatação de moeda, percentual e data **acontece** no módulo de relatórios:
o PDF é o artefato final e não existe front depois dele. A exceção é só essa —
para tela, o backend continua devolvendo número cru.

## Por quê

SQL dentro de um `.jrxml` ignora o `UsuarioContext` e devolve dado de qualquer
empresa: é o caminho mais curto para um PDF vazar cliente. E fórmula copiada
para dentro do template cria um segundo lugar onde o preço é calculado — que
ninguém testa e ninguém lembra de atualizar quando a regra muda.

Módulo separado porque relatório tem ciclo próprio: templates mudam por pedido
comercial, com frequência maior que o domínio, e não podem arrastar `service/`
junto.

## Escopo

Vale para qualquer documento levado para fora da tela. Visualizações **dentro**
da UI (tabelas, gráficos, cartões) continuam sendo front sobre dados da API.
