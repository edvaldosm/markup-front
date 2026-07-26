# 08 — Autenticação JWT com Gin

> Fonte de verdade: `d:\ObsidianDocumentos\Conhecimento\cálculos\financeiras\markup\wiki\wiki-markup.md`

> Biblioteca: `github.com/appleboy/gin-jwt/v3`
> Ver também: `wiki-go.md` → seção "JWT com Gin"

---

## Fluxo de autenticação

```
1. POST /login  →  Authenticator valida email + senha
2. gin-jwt gera token com os claims definidos em PayloadFunc
3. Cliente armazena o token e envia em cada request:
   Authorization: Bearer <token>
4. MiddlewareFunc valida o token e chama IdentityHandler
5. Handler ou resolver extrai claims com jwt.ExtractClaims(c)
```

---

## Setup completo do middleware

```go
// internal/auth/middleware.go
package auth

import (
    "os"
    "time"

    jwt    "github.com/appleboy/gin-jwt/v3"
    gojwt  "github.com/golang-jwt/jwt/v5"
    "github.com/gin-gonic/gin"
    "golang.org/x/crypto/bcrypt"
)

const identityKey = "id"

type claimsUsuario struct {
    ID        string
    EmpresaID string
    Role      string
    Permissoes []string
}

func NovoMiddleware(db *gorm.DB) *jwt.GinJWTMiddleware {
    mw, err := jwt.New(&jwt.GinJWTMiddleware{
        Realm:       "markup-api",
        Key:         []byte(os.Getenv("JWT_SECRET")), // mínimo 32 bytes
        Timeout:     8 * time.Hour,
        MaxRefresh:  24 * time.Hour,
        IdentityKey: identityKey,

        // Embute dados no token ao fazer login
        PayloadFunc: func(data any) gojwt.MapClaims {
            if u, ok := data.(*claimsUsuario); ok {
                return gojwt.MapClaims{
                    identityKey:   u.ID,
                    "empresa_id":  u.EmpresaID,
                    "role":        u.Role,
                    "permissoes":  u.Permissoes,
                }
            }
            return gojwt.MapClaims{}
        },

        // Reconstrói o usuário a partir dos claims em cada request protegido
        IdentityHandler: func(c *gin.Context) any {
            claims := jwt.ExtractClaims(c)
            permissoes := []string{}
            if lista, ok := claims["permissoes"].([]interface{}); ok {
                for _, p := range lista {
                    permissoes = append(permissoes, p.(string))
                }
            }
            return &claimsUsuario{
                ID:         claims[identityKey].(string),
                EmpresaID:  claims["empresa_id"].(string),
                Role:       claims["role"].(string),
                Permissoes: permissoes,
            }
        },

        // Valida credenciais — retorna dados para o PayloadFunc
        Authenticator: func(c *gin.Context) (any, error) {
            var creds struct {
                Email string `json:"email" binding:"required"`
                Senha string `json:"senha" binding:"required"`
            }
            if err := c.ShouldBindJSON(&creds); err != nil {
                return nil, jwt.ErrMissingLoginValues
            }

            // Buscar usuário no banco
            var usuario domain.Usuario
            if err := db.Preload("Empresas.Perfil.Permissoes").
                Where("email = ? AND ativo = true", creds.Email).
                First(&usuario).Error; err != nil {
                return nil, jwt.ErrFailedAuthentication
            }

            // Verificar senha
            if err := bcrypt.CompareHashAndPassword([]byte(usuario.SenhaHash), []byte(creds.Senha)); err != nil {
                return nil, jwt.ErrFailedAuthentication
            }

            // Coletar permissões do perfil
            permissoes := []string{}
            var empresaID string
            var role string
            if len(usuario.Empresas) > 0 {
                ue := usuario.Empresas[0]
                empresaID = ue.EmpresaID
                role = ue.Perfil.Nome
                for _, p := range ue.Perfil.Permissoes {
                    permissoes = append(permissoes, p.Chave)
                }
            }

            return &claimsUsuario{
                ID:         usuario.ID,
                EmpresaID:  empresaID,
                Role:       role,
                Permissoes: permissoes,
            }, nil
        },

        Authorizer: func(c *gin.Context, data any) bool {
            _, ok := data.(*claimsUsuario)
            return ok
        },

        Unauthorized: func(c *gin.Context, code int, message string) {
            c.JSON(code, gin.H{"codigo": code, "mensagem": message})
        },

        TokenLookup:   "header:Authorization",
        TokenHeadName: "Bearer",
        TimeFunc:      time.Now,
    })
    if err != nil {
        panic("falha ao inicializar JWT middleware: " + err.Error())
    }
    return mw
}
```

---

## Registro de rotas no `main.go`

```go
func main() {
    db  := database.Conectar()
    mw  := auth.NovoMiddleware(db)

    r := gin.Default()
    r.Use(graph.GinContextToContextMiddleware()) // necessário para gqlgen

    // Públicas
    r.POST("/login",   mw.LoginHandler)
    r.POST("/refresh", mw.RefreshHandler)

    // Protegidas — token obrigatório em todas
    api := r.Group("/", mw.MiddlewareFunc())
    {
        api.POST("/graphql", graph.GraphQLHandler(db))
    }

    // Playground apenas em desenvolvimento
    if os.Getenv("GIN_MODE") != "release" {
        r.GET("/playground", graph.PlaygroundHandler())
    }

    r.Run(":" + os.Getenv("PORT"))
}
```

---

## Middleware que conecta Gin ao gqlgen

```go
// graph/gin_middleware.go
func GinContextToContextMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        ctx := context.WithValue(c.Request.Context(), "GinContextKey", c)
        c.Request = c.Request.WithContext(ctx)
        c.Next()
    }
}
```

---

## Extraindo claims dentro de um resolver

```go
ginCtx := ctx.Value("GinContextKey").(*gin.Context)
claims := jwt.ExtractClaims(ginCtx)

usuarioID  := claims["id"].(string)
empresaID  := claims["empresa_id"].(string)
role       := claims["role"].(string)
```
