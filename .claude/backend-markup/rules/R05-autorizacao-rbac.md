# Rule R05 — Autorização RBAC no início de cada resolver

**Categoria:** Segurança / Autorização
**Origem:** IniciandoBackEndMarkup.md §6

## Regra

Todo resolver que lê ou grava dados **verifica a permissão** correspondente
antes de executar qualquer lógica, usando as chaves de permissão dos claims do
JWT:

```go
claims := jwt.ExtractClaims(ginCtx)
if !contemPermissao(claims["permissoes"], "PRODUTO_WRITE") {
    return nil, fmt.Errorf("acesso negado: PRODUTO_WRITE necessário")
}
```

- As permissões são carregadas **no login** (via `PayloadFunc` do gin-jwt) e
  viajam no JWT — sem consulta ao banco a cada request.
- Cada resolver exige a chave adequada (`*_READ` para leitura, `*_WRITE` para
  escrita). Ver a lista completa em [[rbac-permissoes]].

## Por quê

A autorização granular por permissão é o mecanismo de controle de acesso do
sistema; omiti-la em um resolver abre um furo de segurança. Combina com
[[R02-isolamento-multiempresa]].
