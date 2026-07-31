---
name: seed-dados-iniciais
description: Seed inicial do banco do backend Markup — impostos padrão, permissões, perfis e usuário admin. Use ao popular o banco pela primeira vez.
metadata:
  domain: backend-markup
  kind: skill
  origin: IniciandoBackEndMarkup.md §10
---

# Dados iniciais (seed)

O banco deve ser populado com:

## 1. Impostos padrão

| chave | alíquota |
|-------|----------|
| `SIMPLES_NACIONAL_ANEXO_II` | 4,5% |
| `SIMPLES_NACIONAL_ANEXO_I` | 4,0% |
| `SIMPLES_NACIONAL_ANEXO_III` | 6,0% |

## 2. Permissões

Todas as 16 chaves listadas em [[rbac-permissoes]].

## 3. Perfis

Os 5 perfis padrão (ADMIN, GERENTE, CONTADOR, VENDEDOR, LEITURA) com suas
permissões — ver [[rbac-permissoes]].

## 4. Usuário admin inicial

Para o primeiro acesso ao sistema (senha com `bcrypt`).

> Referência de domínio: Simples Nacional — Anexo II, alíquota 4,5%.
> Fonte de verdade: `d:\ObsidianDocumentos\Conhecimento\cálculos\financeiras\markup\wiki\wiki-markup.md`.
