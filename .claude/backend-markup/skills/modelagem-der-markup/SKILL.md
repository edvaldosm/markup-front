---
name: modelagem-der-markup
description: Modelagem de dados do backend Markup (DER v3 — RBAC corporativo). Use ao criar entidades GORM em internal/domain ou desenhar migrações do banco.
metadata:
  domain: backend-markup
  kind: skill
  origin: IniciandoBackEndMarkup.md §3, §8
---

# Modelagem de dados — DER v3 (RBAC Corporativo)

Regra de isolamento: toda query filtra por `empresa_id` do JWT
([[R02-isolamento-multiempresa]]).

## Entidades

```
EMPRESA
  id (UUID), razao_social, cnpj,
  regime_tributario (SIMPLES_NACIONAL | LUCRO_PRESUMIDO | LUCRO_REAL | MEI),
  anexo_simples (ANEXO_I..V) [nullable],
  faturamento_medio_mensal        ← divisor do rateio de DF

DESPESA_FIXA
  id, empresa_id → EMPRESA, descricao, valor_mensal,
  categoria (ALUGUEL | ENERGIA | GAS | INTERNET | PROLABORE | CONTADOR | OUTRO), ativa

MATERIAL
  id, empresa_id → EMPRESA, nome,
  unidade (KG | G | L | ML | UN | CX | PCT), custo_unitario,
  fornecedor [nullable], estoque [nullable]

PRODUTO
  id, empresa_id → EMPRESA, nome, descricao [nullable], categoria [nullable],
  margem_lucro (%), desconto_maximo (%), ativo

PRODUTO_MATERIAL  (ficha técnica N:M)
  produto_id → PRODUTO, material_id → MATERIAL, quantidade_utilizada

IMPOSTO  (dicionário global)
  id, nome, chave (ex: SIMPLES_NACIONAL_ANEXO_II), aliquota_percentual, descricao, ativo

PRODUTO_IMPOSTO  (N:M com alíquota override)
  produto_id → PRODUTO, imposto_id → IMPOSTO, aliquota_percentual  ← pode diferir do dicionário

USUARIO
  id, nome, email (único), senha_hash, ativo

PERFIL  (Role)
  id, nome (ADMIN | GERENTE | VENDEDOR | CONTADOR | LEITURA), descricao

PERMISSAO  (Privilege granular)
  id, chave, descricao, modulo

PERFIL_PERMISSAO  (N:M): perfil_id → PERFIL, permissao_id → PERMISSAO

USUARIO_EMPRESA  (N:M — usuário em várias empresas com perfis diferentes)
  usuario_id → USUARIO, empresa_id → EMPRESA, perfil_id → PERFIL
```

## Exemplo de struct GORM (`internal/domain/produto.go`)

```go
package domain

type Produto struct {
    ID          string            `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
    EmpresaID   string            `gorm:"type:uuid;not null;index"                       json:"empresa_id"`
    Nome        string            `gorm:"not null"                                       json:"nome"`
    Descricao   *string           `                                                      json:"descricao,omitempty"`
    Categoria   *string           `                                                      json:"categoria,omitempty"`
    MargemLucro float64           `gorm:"not null"                                       json:"margem_lucro"`
    DescontoMax float64           `gorm:"not null"                                       json:"desconto_maximo"`
    Ativo       bool              `gorm:"default:true"                                   json:"ativo"`
    Materiais   []ProdutoMaterial `gorm:"foreignKey:ProdutoID"                            json:"materiais"`
    Impostos    []ProdutoImposto  `gorm:"foreignKey:ProdutoID"                            json:"impostos"`
}
```

Convenção: 1 arquivo por entidade em `internal/domain/` ([[estrutura-projeto-go]]).
