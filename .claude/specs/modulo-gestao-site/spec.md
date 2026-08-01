# Spec — Módulo de Gestão do Site (ADMIN global)

> Governado por [../../constitution.md](../../constitution.md) v2.3.0.

- **Slug:** modulo-gestao-site
- **Status:** aprovada
- **Data:** 2026-08-01

## Problema / Objetivo

Hoje o ADMIN global (gestor do site) usa **as mesmas telas do cliente**: entra numa
empresa por vez pelo `CompanySwitcher` e vê o mundo pela lente daquela empresa.
Para dar suporte — descobrir quem cadastrou o quê, qual empresa tem qual equipe,
quem está inativo — ele precisa trocar de empresa repetidas vezes e ainda assim
não enxerga o conjunto.

O gestor do site precisa de um **módulo próprio**, com visão da base inteira:
todas as empresas, seus donos e seus usuários, com poder de gestão sobre os
vínculos. E precisa **saber que está nesse módulo** — a identidade visual do
cliente (verde, por segmento) não pode se confundir com a área administrativa.

## Histórias de usuário

- Como gestor do site, vejo **todas** as empresas cadastradas com dono, segmento,
  regime e tamanho da equipe, sem precisar trocar de empresa ativa.
- Como gestor do site, abro uma empresa e vejo **quem tem acesso a ela** e com
  qual perfil, podendo corrigir o perfil, desvincular ou vincular alguém.
- Como gestor do site, vejo **todos os usuários** da base, em quais empresas cada
  um entra e com que perfil, e posso ativar/desativar o acesso.
- Como gestor do site, reconheço a área administrativa **pela cor** — neutra,
  distinta do tema verde do produto — e não confundo suporte com operação.
- Como usuário comum (proprietário, gerente, vendedor, contador), **não vejo** o
  módulo no menu nem consigo abrir suas rotas.

## Requisitos

- **REQ-01 (MUST):** o módulo administrativo é acessível **apenas** a perfis com
  `escopoGlobal` (ADMIN). Qualquer outro perfil não vê o menu e é barrado na rota.
- **REQ-02 (MUST):** a listagem de empresas do módulo mostra **todas** as empresas
  da base — não o conjunto autorizado por ownership (R09) — porque o escopo global
  do ADMIN já é o conjunto autorizado.
- **REQ-03 (MUST):** cada empresa listada exibe dono, segmento, regime/anexo,
  faturamento médio e **quantidade de usuários com acesso**.
- **REQ-04 (MUST):** o detalhe da empresa lista **os usuários vinculados** com o
  perfil de cada um, marcando quem é o dono.
- **REQ-05 (MUST):** a listagem global de usuários mostra todos os usuários com
  suas empresas, perfis, escopo (global ou por empresa) e status ativo/inativo.
- **REQ-06 (MUST):** o gestor pode, sobre qualquer empresa/usuário: alterar o
  perfil de um vínculo, vincular um usuário existente a uma empresa, desvincular
  e ativar/desativar um usuário.
- **REQ-07 (MUST):** o **dono não pode ser desvinculado** da própria empresa —
  a empresa ficaria órfã (contraria B9/R09).
- **REQ-08 (MUST):** o módulo tem **identidade visual neutra** (escala de cinza
  grafite), aplicada por *escopo de tema* sobre os design tokens — sem hardcode de
  cor e sem duplicar componentes (F3).
- **REQ-09 (MUST):** enquanto o gestor está no módulo, o `CompanySwitcher` some do
  header — não existe "empresa ativa" na visão global — e um indicador informa o
  modo de gestão.
- **REQ-10 (SHOULD):** as listas do módulo usam paginação infinita e busca/filtros
  (F4).
- **REQ-11 (MUST):** toda a visibilidade acima é provada por teste navegando como
  cada perfil (F9).

## Critérios de aceite

- [ ] Edvaldo (ADMIN) vê o grupo "Gestão do Site" no menu; Ana, Marcos, Carla e
      Juliana não veem.
- [ ] `/admin`, `/admin/empresas`, `/admin/empresas/:id` e `/admin/usuarios` abrem
      para o ADMIN e caem no dashboard para qualquer outro perfil.
- [ ] A lista administrativa mostra as 4 empresas do mock, com o dono correto e a
      contagem de usuários de cada uma.
- [ ] A lista global mostra os 8 usuários do mock, incluindo o inativo.
- [ ] O detalhe da `emp-001` lista Ana (dona), Marcos, Carla e Ricardo.
- [ ] Desvincular o dono é recusado; desvincular um não-dono funciona.
- [ ] Em rota `/admin*` o layout está no escopo neutro; fora dele, no tema verde.
- [ ] Store administrativa carregada por um não-ADMIN devolve conjunto vazio.

## Fora de escopo

- **Transferência de propriedade** da empresa (trocar o dono) — continua adiada,
  como decidido em [multiempresa-ownership](../multiempresa-ownership/spec.md).
- Exclusão de empresa ou de usuário (o protótipo só inativa).
- Criação de usuário com senha/convite por e-mail — depende de auth real no backend.
- Auditoria/log de ações administrativas (candidato a spec própria).

## Conformidade com a Constituição

- Artigos: **B9** (ownership + ADMIN global), **B5/R05** (RBAC), **F3** (tokens),
  **F4** (paginação), **F7** (rotas protegidas), **F9** (teste por perfil).
- Emenda necessária: **sim** — novo artigo **F10** (escopo de tema por módulo),
  aplicado na v2.3.0 da Constituição.

## Pontos a clarificar

- [ ] O módulo deve permitir **criar** empresa em nome de outro dono? (assumido:
      não — criar empresa continua sendo ato do dono, R09.)

---
**Próximo passo:** `/plan`
