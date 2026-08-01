---
name: auth-jwt-spring
description: Autenticação JWT com Spring Security no backend Markup — login, claims, filtro e RBAC. Use ao configurar segurança, contexto do usuário ou isolamento por empresa.
metadata:
  domain: backend-markup
  kind: skill
  origin: IniciandoBackEndMarkup.md §7 (portado para Spring Security)
---

# Autenticação JWT (Spring Security)

## Fluxo

- `login(email, senha)` (mutation GraphQL ou `POST /auth/login`) valida com
  `BCryptPasswordEncoder` e emite um JWT.
- O front envia `Authorization: Bearer <token>` a cada request.
- Refresh sem re-login; expiração 8h (access) / 24h (refresh).

## Claims

`sub` (usuario_id), `role`, `permissoes` (lista de chaves). As **empresas
visíveis** são derivadas do usuário no backend a cada request (não confiar no
cliente) — ver [[R02-isolamento-multiempresa]] e [[R09-ownership-multiempresa]].

```json
{ "sub": "uuid-usuario", "role": "ADMIN",
  "permissoes": ["PRODUTO_READ","PRODUTO_WRITE","RELATORIO_READ"],
  "exp": 1751234567 }
```

## Config (`config/SecurityConfig.java`)

```java
@Configuration
@EnableMethodSecurity // habilita @PreAuthority/@PreAuthorize (R05)
public class SecurityConfig {
  @Bean
  SecurityFilterChain chain(HttpSecurity http, JwtAuthFilter jwt) throws Exception {
    return http.csrf(c -> c.disable())
      .authorizeHttpRequests(a -> a
        .requestMatchers("/auth/**").permitAll()
        .anyRequest().authenticated())
      .addFilterBefore(jwt, UsernamePasswordAuthenticationFilter.class)
      .build();
  }
  @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }
}
```

- `JwtAuthFilter` valida o token e popula o `SecurityContext` com as authorities
  (as `permissoes` viram `GrantedAuthority`).
- `UsuarioContext` (bean request-scoped) expõe o usuário e as empresas
  autorizadas para services/controllers.

RBAC nos controllers: [[rbac-permissoes]].
