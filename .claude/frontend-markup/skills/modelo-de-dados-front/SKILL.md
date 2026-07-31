---
name: modelo-de-dados-front
description: Tipos do domínio do frontend Markup (src/types), segmentos de negócio e campos do Fator R. Use ao criar interfaces, stores ou telas que dependem do modelo.
metadata:
  domain: frontend-markup
  kind: skill
  origin: src/types/index.ts, src/config/segmentos.ts
---

# Modelo de dados (frontend)

Tipos em `src/types/index.ts`. Espelha o backend ([[modelagem-der-markup]]) com
alguns extras de UI e do **Fator R**.

## Núcleo do domínio

```ts
type SegmentoNegocio = 'CONFEITARIA' | 'INDUSTRIA' | 'SERVICOS'
type RegimeTributario = 'SIMPLES_NACIONAL' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL' | 'MEI'
type AnexoSimples = 'ANEXO_I' | 'ANEXO_II' | 'ANEXO_III' | 'ANEXO_IV' | 'ANEXO_V'

interface Empresa {
  id; razaoSocial; cnpj
  segmento: SegmentoNegocio
  regimeTributario: RegimeTributario
  anexoSimples?: AnexoSimples
  faturamentoMedioMensal: number
  folhaPagamentoMensal?: number   // numerador do Fator R (serviços)
  createdAt: string
}

interface Produto {
  id; empresaId; nome; descricao?; categoria?
  tipo?: 'PRODUTO' | 'SERVICO'
  margemLucro; descontoMaximo; ativo
  materiais: ProdutoMaterial[]
  impostos: ProdutoImposto[]
  createdAt: string
}
```

Demais tipos: `DespesaFixa`, `Material` (com `tipo?: 'INSUMO' | 'MAO_DE_OBRA'`,
`unidade` estendida com `H | PC | TON | M | M2`), `Imposto`, `ProdutoMaterial`,
`ProdutoImposto`, `ResultadoPrecificacao` (inclui `fatorR?` e `anexoAplicado?`).

## RBAC (front)

`PermissaoChave` (16 chaves, iguais ao backend [[rbac-permissoes]]), `Permissao`,
`Perfil`, `Usuario` (com `empresas: { empresaId, perfilId }[]`), `AuthUser`.

## GraphQL helpers

`PageInfo`, `PaginatedResult<T>` (`{ nodes, pageInfo }`) — formato de cursor para
quando ligar o backend real ([[paginacao-infinita]]).

## Segmento de negócio

`SegmentoNegocio` define identidade visual, rótulos e comportamento tributário
(config em `src/config/segmentos.ts`). Só `SERVICOS` no Simples aciona o Fator R
([[composables-calculo-formatacao]]).
