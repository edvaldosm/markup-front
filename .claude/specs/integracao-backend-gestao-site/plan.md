# Plano técnico — Integração com o backend: Gestão do Site e remoção do mock

> Preenchido por `/plan` a partir do `spec.md`. Descreve **como** construir.
> Nenhuma decisão pode violar [constitution.md](../../constitution.md).

- **Slug:** integracao-backend-gestao-site  •  **Baseado em:** spec.md  •  **Data:** 2026-08-04

## Abordagem

Duas frentes que precisam acontecer **na ordem certa**, porque a segunda depende
da primeira parar de usar a primeira:

1. **Migrar `admin.ts`.** Mecânico na maior parte — o backend já compõe
   `EmpresaAdmin` pronto, então esta migração **remove** código (a junção
   manual de `empresasAdmin`) em vez de só trocar a fonte.
2. **Mudar a casa da massa de teste e apagar `src/mock/`.** Só depois que
   `admin.ts` (o único consumidor de app) sair do mock é que a pasta pode
   morrer. Até lá, apagá-la quebraria a Gestão do Site.

### Onde a massa de teste vai morar

`src/test/fixtures.ts` — mesmo formato de linha que `src/mock/data.ts` tem hoje
(`ProdutoRegistro`, `MaterialRegistro` etc., já pensados como "banco" desde a
fatia 2), só que **nomeado como o que é**: dado de teste, não protótipo do
front. `servidor-falso.ts` importa de lá; os sete `*.spec.ts` que hoje importam
de `@/mock/data` trocam a origem, sem trocar o que importam — são os mesmos
nomes (`mockEmpresas`, `mockUsuarios`...), então o `import` muda, o resto do
teste não.

### Por que a junção de `usuariosAdmin` fica no front

Vale registrar a diferença em relação a `empresasAdmin`, que sai: `EmpresaAdmin`
é a **resposta de uma query** (`todasEmpresas`), o backend já entrega composto.
`usuariosAdmin` não tem query equivalente — o que existe é `todosUsuarios`
(usuário com vínculos por id) e `todasEmpresas` (empresa completa). Cruzar os
dois por `empresaId` é **o uso que o próprio schema pede** (comentário no
`.graphqls`: "o objeto Empresa completo vem de minhasEmpresas"). Não é uma
segunda fonte de verdade — é resolver uma referência contra uma lista que já
tem a resposta certa, sem inventar número nenhum.

## Camadas afetadas

- **Frontend:**
  - `src/types/index.ts` — `VinculoEmpresa` (REQ-10).
  - `src/graphql/operations/admin.ts` — novo: `TODAS_EMPRESAS`, `EMPRESA_ADMIN`,
    `TODOS_USUARIOS`, `METRICAS_DA_BASE`, `VINCULAR_USUARIO`,
    `DESVINCULAR_USUARIO`, `DEFINIR_PERFIL_NO_VINCULO`, `DEFINIR_USUARIO_ATIVO`.
  - `src/stores/admin.ts` — reescrito.
  - `src/views/admin/*.vue` — ajustes de campo (`perfilId` → `perfil.id`) e
    gate de Fator R em `AdminEmpresaDetalheView`.
  - `src/test/fixtures.ts` — novo, substitui `src/mock/data.ts`.
  - `src/test/servidor-falso.ts` — importa de `fixtures.ts`; ganha as 8
    operações de admin.
  - `src/mock/` — apagada ao final.
- **Backend (repo markup-back):** nenhuma mudança — as 8 operações já existem.

## Mudanças de modelo / contrato

- **Schema GraphQL:** nenhuma.
- **Tipos do front:**
  - `VinculoEmpresa`: remove `perfilId` e `empresa?`; `perfil` obrigatório.
  - Novo `EmpresaAdmin`, `MembroEquipe`, `MetricasBase` em `src/types/index.ts`
    (hoje só existem como `interface` local dentro de `admin.ts` — sobem para
    tipos compartilhados, espelhando o schema, como todo o resto do domínio).
- **Migração de dados:** `src/mock/data.ts` → `src/test/fixtures.ts` (mesmo
  conteúdo, novo endereço, novo cabeçalho dizendo o que o arquivo é).

## Decisões de design (requisito → decisão)

| Requisito | Decisão |
|-----------|---------|
| REQ-01 | `admin.ts.empresas` guarda `EmpresaAdmin[]` direto (não mais `Empresa[]` + junção). `empresasAdmin` computed sai; o que a tela lia de lá agora lê `empresas` direto. |
| REQ-02 | `buscarEmpresaAdmin(id)` chama `empresaAdmin(empresaId)`, usado no detalhe. |
| REQ-03 | `usuariosAdmin` continua, cruzando `usuarios` (de `todosUsuarios`) com `empresas` (de `todasEmpresas`) por `empresaId` — mesma forma de hoje, fonte trocada. |
| REQ-04 | `metricas` vira leitura direta de `metricasDaBase()`, sem `computed` de agregação. |
| REQ-05 | Painel usa `IndisponivelBackend` para os dois indicadores ausentes. |
| REQ-06 | Mesmo padrão de `EmpresaView`/`FatorRView`: `MOTIVO_FATOR_R` (a mesma constante, reexportada ou duplicada — decidir na hora pela conveniência do import). |
| REQ-07 | `usuariosPorPerfil` sem mudança de forma, só de fonte dos dados de entrada. |
| REQ-08 | Cada ação recarrega o que mudou: `vincularUsuario`/`desvincularUsuario`/`definirPerfilNoVinculo` recarregam `todasEmpresas` (a equipe mudou) — não `todosUsuarios`; `definirUsuarioAtivo` atualiza o usuário em memória com a resposta da mutation, sem refetch. |
| REQ-09 | A checagem local de dono vira comentário "atalho de UI"; o `catch` do erro do servidor é o caminho que realmente impede. |
| REQ-10 | `VinculoEmpresa` sem `perfilId`/`empresa?`. `AdminEmpresaDetalheView` e `UsuariosView` trocam `emp.perfilId` por `emp.perfil.id`, `v.perfilId === perfil.id` por `v.perfil.id === perfil.id`. |
| REQ-11 | `src/test/fixtures.ts`. |
| REQ-12 | 7 arquivos: `servidor-falso.ts`, `servidor-falso.spec.ts`, `catalogo.spec.ts`, `navegacao-multiusuario.spec.ts`, `admin-gestao-site.spec.ts`, `empresa.spec.ts`, `autorizacao.spec.ts`, `faixa-negociacao.spec.ts` (8, na verdade — conferir na implementação). |
| REQ-13 | `rm -rf src/mock`. |
| REQ-14 | Build + suíte completa, mais o grep do critério de aceite. |

## Rules aplicáveis

- **B1/Artigo III v2.5.0** — a junção que sai (`empresasAdmin`) e a que fica
  (`usuariosAdmin`, por ser resolução de referência do próprio contrato, não
  agregação nova) são o ponto central deste plano.
- **B9/F10** — módulo continua checando escopo global em toda ação.
- **B6** — `VinculoEmpresa` alinhado ao schema.
- **F6** — a emenda que a Rule FR06 registrou como pendente desde a fatia 1 se
  conclui **aqui**: quando `src/mock/` sair, a regra é reescrita sem menção a
  `MOCK_MODE`.

## Riscos e alternativas

- **Fixtures usadas por 8 arquivos de teste** — trocar o import é mecânico, mas
  qualquer erro de path quebra a suíte inteira de uma vez. Mitigação: rodar
  `npm test` logo após mover o arquivo, antes de tocar em `admin.ts`.
- **`EmpresaAdmin`/`MembroEquipe` viram tipos compartilhados** — risco de
  colidir de nome com algo já existente em `src/types/index.ts`. Conferir antes
  de escrever.
- **Recarga parcial após escrita (REQ-08)** pode deixar `metricas` levemente
  desatualizada até o próximo `fetchTudo` completo (ex.: `vincularUsuario` muda
  `totalVinculos`, que só está em `metricasDaBase`, não em `todasEmpresas`).
  Aceito: `metricasDaBase` é barata e pode ser recarregada junto sem custo real
  — incluir na recarga de cada ação de escrita, não só `todasEmpresas`.
- **Apagar `src/mock/` é irreversível pelo Git normal** (fica no histórico, mas
  não no working tree) — confirmar que os 7+ arquivos de teste passam a
  importar de `fixtures.ts` **antes** do `rm -rf`, não depois.

---
**Próximo passo:** `/tasks`
