---
name: rbac-permissoes
description: Permissões granulares, perfis padrão e proteção de resolvers no backend Markup. Use ao implementar autorização RBAC, definir chaves de permissão ou perfis.
metadata:
  domain: backend-markup
  kind: skill
  origin: IniciandoBackEndMarkup.md §6
---

# RBAC — Permissões granulares

## Chaves de permissão

| Chave | Ação |
|-------|------|
| `PRODUTO_READ` | Visualizar produtos e fichas técnicas |
| `PRODUTO_WRITE` | Criar e editar produtos |
| `MATERIAL_READ` | Visualizar materiais/insumos |
| `MATERIAL_WRITE` | Criar e editar materiais |
| `DESPESA_READ` | Visualizar despesas fixas |
| `DESPESA_WRITE` | Cadastrar e editar despesas fixas |
| `IMPOSTO_READ` | Visualizar impostos |
| `IMPOSTO_WRITE` | Alterar alíquotas de impostos |
| `RELATORIO_READ` | Gerar e visualizar relatórios |
| `USUARIO_READ` | Visualizar usuários |
| `USUARIO_WRITE` | Convidar e editar usuários |
| `EMPRESA_READ` | Visualizar dados da empresa |
| `EMPRESA_WRITE` | Editar dados da empresa |
| `PERFIL_READ` | Visualizar perfis |
| `PERFIL_WRITE` | Criar e editar perfis e permissões |

## Perfis padrão sugeridos

| Perfil | Permissões principais |
|--------|-----------------------|
| ADMIN | Todas |
| GERENTE | Tudo exceto `PERFIL_WRITE` e `USUARIO_WRITE` |
| CONTADOR | `EMPRESA_READ/WRITE`, `DESPESA_READ/WRITE`, `IMPOSTO_READ/WRITE`, `RELATORIO_READ` |
| VENDEDOR | `PRODUTO_READ`, `RELATORIO_READ` |
| LEITURA | `*_READ` de todos os módulos |

## Proteção de resolver (obrigatória — ver [[R05-autorizacao-rbac]])

```go
func (r *mutationResolver) SalvarProduto(ctx context.Context, input model.ProdutoInput) (*model.Produto, error) {
    ginCtx := ctx.Value("GinContextKey").(*gin.Context)
    claims := jwt.ExtractClaims(ginCtx)

    permissoes := claims["permissoes"].([]interface{})
    if !contemPermissao(permissoes, "PRODUTO_WRITE") {
        return nil, fmt.Errorf("acesso negado: PRODUTO_WRITE necessário")
    }
    // lógica de negócio...
}

func contemPermissao(lista []interface{}, chave string) bool {
    for _, p := range lista {
        if p.(string) == chave { return true }
    }
    return false
}
```

As permissões vêm nos claims do JWT ([[auth-jwt-gin]]). Seed das 16 chaves e dos
5 perfis: [[seed-dados-iniciais]].
