# Rule R05 — Autorização RBAC em cada operação

**Categoria:** Segurança / Autorização
**Origem:** IniciandoBackEndMarkup.md §6 (portado para Spring Security)

## Regra

Toda operação que lê ou grava dados **verifica a permissão** correspondente antes
de executar qualquer lógica. Em Spring, as `permissoes` do JWT viram
`GrantedAuthority` e a checagem é declarativa:

```java
@MutationMapping
@PreAuthorize("hasAuthority('PRODUTO_WRITE')")
public Produto salvarProduto(@Argument ProdutoInput input) { ... }
```

- Exige `@EnableMethodSecurity` (ver [[auth-jwt-spring]]).
- As permissões são carregadas **no login** e viajam no JWT — sem consulta ao
  banco a cada request.
- Cada operação exige a chave adequada (`*_READ` para leitura, `*_WRITE` para
  escrita). Lista completa em [[rbac-permissoes]].
- Regras que dependem de dados (ownership da empresa) complementam com verificação
  no service ([[R09-ownership-multiempresa]]).

## Por quê

A autorização granular por permissão é o mecanismo de controle de acesso do
sistema; omiti-la em uma operação abre um furo de segurança. Combina com
[[R02-isolamento-multiempresa]].
