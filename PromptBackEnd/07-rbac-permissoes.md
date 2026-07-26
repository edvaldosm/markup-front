# 07 — RBAC — Permissões e Perfis

> Fonte de verdade: `d:\ObsidianDocumentos\Conhecimento\cálculos\financeiras\markup\wiki\wiki-markup.md`

## Chaves de permissão (16 no total)

| Chave | Módulo | Ação |
|-------|--------|------|
| `PRODUTO_READ` | produto | Visualizar produtos e fichas técnicas |
| `PRODUTO_WRITE` | produto | Criar e editar produtos |
| `MATERIAL_READ` | material | Visualizar materiais/insumos |
| `MATERIAL_WRITE` | material | Criar e editar materiais |
| `DESPESA_READ` | despesa | Visualizar despesas fixas |
| `DESPESA_WRITE` | despesa | Cadastrar e editar despesas fixas |
| `IMPOSTO_READ` | imposto | Visualizar impostos |
| `IMPOSTO_WRITE` | imposto | Alterar alíquotas de impostos |
| `RELATORIO_READ` | relatorio | Gerar e visualizar relatórios de precificação |
| `USUARIO_READ` | usuario | Visualizar usuários |
| `USUARIO_WRITE` | usuario | Convidar e editar usuários |
| `EMPRESA_READ` | empresa | Visualizar dados da empresa |
| `EMPRESA_WRITE` | empresa | Editar dados da empresa |
| `PERFIL_READ` | perfil | Visualizar perfis |
| `PERFIL_WRITE` | perfil | Criar e editar perfis e permissões |

---

## Perfis padrão e suas permissões

| Perfil | Permissões |
|--------|-----------|
| `ADMIN` | Todas as 15 acima |
| `GERENTE` | Tudo exceto `PERFIL_WRITE` e `USUARIO_WRITE` |
| `CONTADOR` | `EMPRESA_READ/WRITE`, `DESPESA_READ/WRITE`, `IMPOSTO_READ/WRITE`, `RELATORIO_READ` |
| `VENDEDOR` | `PRODUTO_READ`, `RELATORIO_READ` |
| `LEITURA` | Todos os `*_READ` |

---

## Estrutura dos claims JWT

As permissões são carregadas no login e viajam no token — sem consulta ao banco a cada request:

```json
{
  "id":          "uuid-do-usuario",
  "empresa_id":  "uuid-da-empresa",
  "role":        "ADMIN",
  "permissoes":  ["PRODUTO_READ", "PRODUTO_WRITE", "RELATORIO_READ"],
  "exp":         1751234567,
  "orig_iat":    1751198167
}
```

---

## Verificação de permissão nos resolvers

```go
// graph/schema.resolvers.go

func contemPermissao(claims jwt.MapClaims, chave string) bool {
    lista, ok := claims["permissoes"].([]interface{})
    if !ok {
        return false
    }
    for _, p := range lista {
        if p.(string) == chave {
            return true
        }
    }
    return false
}

// Exemplo de uso em cada resolver:
func (r *mutationResolver) SalvarProduto(ctx context.Context, input model.ProdutoInput) (*model.Produto, error) {
    ginCtx := ctx.Value("GinContextKey").(*gin.Context)
    claims := jwt.ExtractClaims(ginCtx)

    if !contemPermissao(claims, "PRODUTO_WRITE") {
        return nil, fmt.Errorf("acesso negado: PRODUTO_WRITE necessário")
    }
    empresaID := claims["empresa_id"].(string)
    return r.ProdutoService.Salvar(input, empresaID)
}
```

---

## Regra de isolamento por empresa

Todo service deve receber `empresaID` e filtrar por ele:

```go
// Correto: filtra pela empresa do usuário autenticado
s.DB.Where("empresa_id = ?", empresaID).Find(&produtos)

// NUNCA: buscar sem filtro de empresa
s.DB.Find(&produtos)
```
