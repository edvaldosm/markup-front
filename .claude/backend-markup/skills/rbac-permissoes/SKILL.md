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

## Proteção de operação (obrigatória — ver [[R05-autorizacao-rbac]])

Em Spring, as `permissoes` do JWT viram `GrantedAuthority`; a checagem é
declarativa com `@PreAuthorize` (exige `@EnableMethodSecurity`):

```java
@Controller
public class ProdutoController {

    @MutationMapping
    @PreAuthorize("hasAuthority('PRODUTO_WRITE')")   // R05
    public Produto salvarProduto(@Argument ProdutoInput input) {
        String empresaId = contexto.empresaAtivaAutorizada(); // R02/R09
        return produtoService.salvar(input, empresaId);
    }
}
```

Para regras que dependem de dados (ex.: ownership da empresa), complementar com
verificação no `service` — ADMIN ignora o filtro de dono ([[R09-ownership-multiempresa]]).

As permissões vêm nos claims do JWT ([[auth-jwt-spring]]). Seed das 16 chaves e
dos 5 perfis: [[seed-dados-iniciais]].
