# Spec — Multi-empresa por dono + ADMIN global

> Governado por [../../constitution.md](../../constitution.md) v2.0.0.

- **Slug:** multiempresa-ownership
- **Status:** aprovada
- **Data:** 2026-07-31

## Problema / Objetivo

Vários usuários cadastram suas empresas no mesmo sistema, mas **um não pode ver a
empresa do outro**. Só o ADMIN tem visão global.

## Histórias de usuário

- Como Edvaldo, cadastro Empresa 1 e 2 e só eu (e o ADMIN) as vejo.
- Como ADMIN, vejo e opero todas as empresas para suporte.
- Como dono, posso convidar um colega para uma empresa minha (compartilhamento explícito).

## Requisitos

- **REQ-01 (MUST):** `EMPRESA` tem `dono_usuario_id` = usuário que a cadastrou.
- **REQ-02 (MUST):** usuário comum só enxerga empresas **próprias** ou
  **compartilhadas** (vínculo `USUARIO_EMPRESA`).
- **REQ-03 (MUST):** perfil `ADMIN` enxerga e opera **todas** as empresas.
- **REQ-04 (MUST):** o conjunto visível é derivado do usuário do JWT em toda
  consulta; `empresaId` do cliente é sempre validado contra a autorização.
- **REQ-05 (MUST):** `minhasEmpresas` retorna exatamente o conjunto autorizado.
- **REQ-06 (SHOULD):** `CompanySwitcher` no front lista só `minhasEmpresas`.

## Critérios de aceite

- [ ] Cenário E1..E6 (Edvaldo/Santiago/Matos): cada um vê só as suas; ADMIN vê as seis.
- [ ] Tentar `precificarProduto` de empresa não autorizada ⇒ erro/negado.
- [ ] `CompanySwitcher` não mostra empresa de outro dono.

## Fora de escopo

- Papéis intermediários de "super-dono" por grupo econômico; hierarquia de empresas.

## Conformidade com a Constituição

- Artigos: **B9**, B2, B5; espelho no front (RF-11). Emenda: aplicada (v2.0.0).

## Pontos a clarificar

- [ ] Transferência de propriedade (trocar o dono) entra agora ou depois? (assumido: depois)
