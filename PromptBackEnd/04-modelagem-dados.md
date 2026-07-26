# 04 — Modelagem de Dados (DER v3 — RBAC Corporativo)

> Fonte de verdade: `d:\ObsidianDocumentos\Conhecimento\cálculos\financeiras\markup\wiki\wiki-markup.md`

## Entidades e responsabilidades

```
EMPRESA
  ├── id (UUID)
  ├── razao_social
  ├── cnpj
  ├── segmento           (CONFEITARIA | INDUSTRIA | SERVICOS)  ← identidade visual + comportamento tributário
  ├── regime_tributario  (SIMPLES_NACIONAL | LUCRO_PRESUMIDO | LUCRO_REAL | MEI)
  ├── anexo_simples      (ANEXO_I | ANEXO_II | ANEXO_III | ANEXO_IV | ANEXO_V) [nullable]
  ├── faturamento_medio_mensal  ← divisor do rateio de DF (denominador do Fator R)
  └── folha_pagamento_mensal    ← numerador do Fator R (serviços) [nullable]

DESPESA_FIXA
  ├── id (UUID)
  ├── empresa_id → EMPRESA
  ├── descricao
  ├── valor_mensal
  ├── categoria  (ALUGUEL | ENERGIA | GAS | INTERNET | PROLABORE | CONTADOR | OUTRO)
  └── ativa

MATERIAL   (insumo genérico: ingrediente, matéria-prima OU hora de mão de obra)
  ├── id (UUID)
  ├── empresa_id → EMPRESA
  ├── nome
  ├── unidade  (KG | G | L | ML | UN | CX | PCT | H | PC | TON | M | M2)
  ├── custo_unitario   ← para serviços, é o custo/hora da mão de obra
  ├── tipo       (INSUMO | MAO_DE_OBRA) [default INSUMO]
  ├── fornecedor [nullable]
  └── estoque   [nullable]

PRODUTO   (item vendido: produto físico OU serviço prestado)
  ├── id (UUID)
  ├── empresa_id → EMPRESA
  ├── nome
  ├── descricao  [nullable]
  ├── categoria  [nullable]
  ├── tipo       (PRODUTO | SERVICO) [default PRODUTO]
  ├── margem_lucro      (%)
  ├── desconto_maximo   (%)
  └── ativo

PRODUTO_MATERIAL  (ficha técnica N:M)
  ├── produto_id → PRODUTO
  ├── material_id → MATERIAL
  └── quantidade_utilizada

IMPOSTO  (dicionário global)
  ├── id (UUID)
  ├── nome
  ├── chave  (ex: SIMPLES_NACIONAL_ANEXO_II)
  ├── aliquota_percentual
  ├── descricao
  └── ativo

PRODUTO_IMPOSTO  (N:M produto ↔ imposto com alíquota override)
  ├── produto_id → PRODUTO
  ├── imposto_id → IMPOSTO
  └── aliquota_percentual  ← pode diferir do dicionário global

USUARIO
  ├── id (UUID)
  ├── nome
  ├── email  (único)
  ├── senha_hash
  └── ativo

PERFIL  (Role)
  ├── id (UUID)
  ├── nome   (ADMIN | GERENTE | VENDEDOR | CONTADOR | LEITURA)
  └── descricao

PERMISSAO  (Privilege granular)
  ├── id (UUID)
  ├── chave   (ver arquivo 06-rbac-permissoes.md)
  ├── descricao
  └── modulo

PERFIL_PERMISSAO  (N:M)
  ├── perfil_id → PERFIL
  └── permissao_id → PERMISSAO

USUARIO_EMPRESA  (N:M — usuário pode estar em várias empresas com perfis diferentes)
  ├── usuario_id → USUARIO
  ├── empresa_id → EMPRESA
  └── perfil_id → PERFIL
```

---

## Regra de isolamento

Toda query deve filtrar por `empresa_id` obtido do JWT do usuário autenticado.

O `empresa_id` viaja no token JWT (claim `"empresa_id"`) e é extraído em cada resolver via `jwt.ExtractClaims(ginCtx)`.

### Multi-empresa e criação de empresa

Um usuário pode estar vinculado a **várias empresas** (via `USUARIO_EMPRESA`). O frontend expõe um **seletor de empresa** que troca a empresa ativa; o backend deve:

- `minhasEmpresas`: listar todas as empresas vinculadas ao usuário logado (alimenta o seletor).
- `criarEmpresa(input)`: cria a `EMPRESA` **e** a linha `USUARIO_EMPRESA` ligando o criador com perfil **ADMIN** (numa transação). A partir daí, a nova empresa já aparece no seletor e pode ser selecionada como ativa.
- Trocar de empresa = emitir novo JWT (ou atualizar a claim `empresa_id`) para a empresa escolhida, respeitando o vínculo em `USUARIO_EMPRESA`.

> Requer permissão `EMPRESA_WRITE` para `criarEmpresa`/`atualizarEmpresa`.

---

## Lógica de cálculo derivada da modelagem

| Campo calculado | Fonte de dados | Fórmula |
|-----------------|---------------|---------|
| `Produto.custoBase` | `PRODUTO_MATERIAL` + `MATERIAL.custo_unitario` | `SUM(quantidade_utilizada × custo_unitario)` |
| `Produto.percentualImpostos` | `PRODUTO_IMPOSTO` | `SUM(aliquota_percentual)` |
| `Empresa.percentualDespesasFixas` | `DESPESA_FIXA` (ativa=true) + `EMPRESA.faturamento_medio_mensal` | `SUM(valor_mensal) / faturamento × 100` |
| `Empresa.fatorR` | `EMPRESA.folha_pagamento_mensal` + `faturamento_medio_mensal` | `folha / faturamento × 100` (só serviços) |
| `Empresa.anexoAplicado` | `segmento` + `fatorR` | serviços: `fatorR ≥ 28 ? ANEXO_III : ANEXO_V`; senão `anexo_simples` |
| `ResultadoPrecificacao.precoVenda` | Todos acima + `PRODUTO.margem_lucro` + `PRODUTO.desconto_maximo` | `CP / (1 - soma/100)` |

---

## Segmentos de negócio

O campo `EMPRESA.segmento` classifica a empresa e define rótulos e comportamento tributário. **A engine de markup é a mesma** para os três — muda a composição do custo e o anexo:

| Segmento | Custo Base (CP) | Anexo típico | Observação tributária |
|----------|-----------------|--------------|-----------------------|
| `CONFEITARIA` | Ingredientes + embalagem | Anexo II (4,5% F1) | Mercadoria própria → ICMS/IPI no DAS, ISS zero |
| `INDUSTRIA` | Matéria-prima + insumos | Anexo II (4,5% F1) | Mercadoria própria → ICMS/IPI no DAS, ISS zero |
| `SERVICOS` | Hora técnica (MAO_DE_OBRA) + custos diretos | Anexo III (6% F1) **ou** Anexo V (15,5% F1) | Definido pelo **Fator R**; ISS embutido no DAS |

### Fator R (apenas serviços no Simples Nacional)

```
Fator R = folha_pagamento_mensal / faturamento_medio_mensal × 100

  Fator R ≥ 28%  → Anexo III (alíquota menor, ex.: 6% na 1ª faixa)
  Fator R <  28% → Anexo V   (alíquota maior, ex.: 15,5% na 1ª faixa)
```

Sugestão de implementação: um `fator_r_service.go` (ou método no `precificacao_service.go`) que resolve o anexo efetivo antes de somar `% Impostos`. Para confeitaria/indústria, o Fator R não se aplica e `anexoAplicado = anexo_simples`.
