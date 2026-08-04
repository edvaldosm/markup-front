# Spec — Integração com o backend: Gestão do Site e remoção do mock

> Preenchido por `/specify`. Descreve **o quê** e **por quê** — nunca o **como**
> (isso é o `plan.md`). Deve obedecer a [constitution.md](../../constitution.md).

- **Slug:** integracao-backend-gestao-site
- **Status:** aprovada
- **Data:** 2026-08-04

## Problema / Objetivo

`src/stores/admin.ts` (módulo de Gestão do Site, escopo ADMIN global — B9/F10) é
a última store de dado real ainda sobre `src/mock/data.ts`. O backend já
implementa todas as oito operações que ela precisa: `todasEmpresas`,
`empresaAdmin`, `todosUsuarios`, `metricasDaBase`, `vincularUsuario`,
`desvincularUsuario`, `definirPerfilNoVinculo`, `definirUsuarioAtivo`.

Isso é o que falta para **apagar `src/mock/` do projeto por completo** — pedido
explícito do usuário em 2026-08-04, que antecipa o que a nota da fatia 1 já
previa ("`src/mock/` sai quando a Gestão do Site migrar"). Apagar a pasta exige
duas coisas: migrar `admin.ts` para as queries reais, e mover a massa de dados
que `servidor-falso.ts` usa como "banco" dos testes para fora de `src/mock/`
— hoje sete arquivos de teste importam fixtures de lá.

Um segundo achado, ao ler o schema contra o tipo do front: `VinculoEmpresa` no
front tem `perfilId` e `empresa?`/`perfil?` opcionais; o contrato
(`UsuarioEmpresa`) tem só `empresaId: ID!` e `perfil: Perfil!` — sem
`perfilId`, sem `empresa` embutida, `perfil` obrigatório. Corrigido aqui porque
`admin.ts` é o maior consumidor do tipo.

## Histórias de usuário

- Como **ADMIN global**, quero ver a base real de empresas e usuários, não o
  mock congelado no navegador.
- Como **ADMIN global**, quero vincular, desvincular e trocar o perfil de um
  usuário, e ver isso sobreviver ao F5.
- Como **ADMIN global**, quero ativar/desativar o acesso de um usuário.
- Como **desenvolvedor**, quero rodar a suíte de testes sem depender de um
  arquivo de dados que finge ser o front — a massa de teste deve declarar que é
  massa de teste.

## Requisitos

> Testáveis, com MUST/SHOULD. IDs `REQ-01`, `REQ-02`…

### Leitura

- **REQ-01 (MUST):** A listagem de empresas usa `todasEmpresas`, que já devolve
  `EmpresaAdmin` **composto pelo servidor** (`empresa`, `dono`, `equipe`,
  `totalUsuarios`). A junção manual que hoje existe em `empresasAdmin`
  (`empresas.value.map` cruzando com `usuarios.value`) **sai** — o backend já
  entrega isso pronto (B1/Artigo III v2.5.0: essa junção calculava "quem é o
  dono" e "quem está na equipe" a partir de duas listas soltas; o servidor faz
  isso melhor, com uma fonte só).
- **REQ-02 (MUST):** O detalhe de uma empresa usa `empresaAdmin(empresaId)` em
  vez de filtrar `empresasAdmin` local por id.
- **REQ-03 (MUST):** A listagem de usuários usa `todosUsuarios`. A resolução de
  "em quais empresas este usuário está, com qual perfil, é dono em qual" (hoje
  em `usuariosAdmin`) **permanece no front**, mas como **referência por id
  contra uma lista já buscada** — não como cálculo. O próprio schema declara
  essa forma: `UsuarioEmpresa.empresaId` é id solto de propósito ("o objeto
  Empresa completo vem de minhasEmpresas, para o payload não arrastar o
  cadastro inteiro"). Cruzar `todosUsuarios` com `todasEmpresas` por id é o uso
  pretendido do contrato, não uma segunda fonte de verdade.
- **REQ-04 (MUST):** Os cinco indicadores que `metricasDaBase` cobre
  (`totalEmpresas`, `totalUsuarios`, `usuariosAtivos`, `totalVinculos`,
  `faturamentoTotal`) vêm dessa query — a versão local (`reduce`/`filter().length`
  sobre a lista inteira) **sai**.
- **REQ-05 (MUST):** `porSegmento` (contagem de empresas por segmento) e
  `usuariosInativos` **não são implementados** — `MetricasBase` não tem esses
  campos (pendência já registrada em `integracao-backend-precificacao/spec.md`).
  A tela omite os dois indicadores, não os recalcula como paliativo.
- **REQ-06 (MUST):** `AdminEmpresaDetalheView.vue` para de calcular Fator R
  localmente (`folhaPagamentoMensal / faturamentoMedioMensal * 100`) — mesma
  pendência de `Empresa.fatorR` já registrada. A tela usa
  `IndisponivelBackend`, igual às demais telas de Fator R.
- **REQ-07 (SHOULD):** `usuariosPorPerfil` (contagem de usuários por perfil)
  continua local — é contagem (`.filter().length`) sobre lista já correta, não
  fórmula de domínio nem agregado que o contrato deveria fornecer; mesmo
  tratamento dado a "Produtos Ativos: X de Y" no Dashboard.

### Escrita

- **REQ-08 (MUST):** `vincularUsuario`, `desvincularUsuario`,
  `definirPerfilNoVinculo`, `definirUsuarioAtivo` gravam no servidor. Cada uma
  recarrega a fração de estado que ela mudou (não a base inteira) —
  `desvincularUsuario`, por exemplo, não precisa re-buscar `todasEmpresas`.
- **REQ-09 (MUST):** A recusa por regra de negócio (dono não pode ser
  desvinculado — V-própria do domínio, não guarda numerada) chega como erro do
  servidor, com mensagem; a checagem local que existe hoje
  (`empresa.donoUsuarioId === usuarioId`) pode continuar como atalho de UI
  (evita a viagem de rede para um caso sempre recusado), mas **o servidor
  decide** — a checagem local nunca é a única barreira.

### Tipos e contrato

- **REQ-10 (MUST):** `VinculoEmpresa` (front) perde `perfilId` e `empresa?`;
  `perfil` vira obrigatório — espelha `UsuarioEmpresa` exatamente.
  Consumidores que liam `perfilId` (fallback de exibição, formulário de vínculo)
  passam a usar `perfil.id`.

### Remoção do mock

- **REQ-11 (MUST):** A massa de dados que `servidor-falso.ts` usa como banco
  (hoje importada de `src/mock/data.ts`) muda de casa para dentro de
  `src/test/` — ela é infraestrutura de teste, não "dado do front que ainda não
  migrou". Local exato é decisão do `plan.md`.
- **REQ-12 (MUST):** Todo `import ... from '@/mock/data'` em arquivo de teste
  passa a importar do novo local.
- **REQ-13 (MUST):** `src/mock/` é **apagada** do repositório.
- **REQ-14 (MUST):** `npm test` e `npm run build` passam sem nenhuma referência
  a `@/mock`.

## Critérios de aceite

- [ ] `grep -rn "from '@/mock" src/` não retorna nada.
- [ ] `ls src/mock` falha (diretório não existe).
- [ ] Gestão do Site abre com empresas e usuários reais do backend (seed `dev`).
- [ ] Vincular, desvincular, trocar perfil e ativar/desativar usuário gravam no
      servidor e sobrevivem ao F5.
- [ ] Tentar desvincular o dono é recusado com mensagem do servidor.
- [ ] Métricas do painel batem com `metricasDaBase` chamada direto no backend.
- [ ] `porSegmento`/`usuariosInativos`/Fator R aparecem como indisponível, não
      recalculados.
- [ ] `npm run build` e `npm test` passam.

## Fora de escopo

- `porSegmento`, `usuariosInativos`, `Empresa.fatorR` — pendências de contrato,
  não desta fatia.
- Convite de usuário a partir da Gestão do Site (já existe em `UsuariosView`,
  por empresa; não há requisito de fazer o mesmo fluxo em escopo global).
- Exclusão de empresa ou usuário — o contrato não tem, ponto já assentado nas
  fatias anteriores.

## Conformidade com a Constituição

- Artigos aplicáveis: B9 (ownership + ADMIN global), F10 (escopo de tema do
  módulo), B1 + Artigo III v2.5.0 (zero cálculo/agregado inventado no front),
  B6 (contrato-first — REQ-10).
- Emenda necessária? Não.

## Pontos a clarificar

- Nenhum em aberto.

---
**Próximo passo:** `/plan`
