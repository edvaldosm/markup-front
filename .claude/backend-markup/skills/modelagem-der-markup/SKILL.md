---
name: modelagem-der-markup
description: Modelagem de dados do backend Markup (DER v3 — RBAC + ownership). Use ao criar entidades JPA ou migrações Flyway do banco.
metadata:
  domain: backend-markup
  kind: skill
  origin: IniciandoBackEndMarkup.md §3, §8 (portado para JPA + ownership)
---

# Modelagem de dados — DER v3 (RBAC + ownership)

Regra de isolamento: consultas restritas às empresas autorizadas ao usuário do
JWT ([[R02-isolamento-multiempresa]], [[R09-ownership-multiempresa]]).

## Entidades

```
EMPRESA
  id (UUID), razao_social, cnpj,
  dono_usuario_id → USUARIO        ← proprietário (quem cadastrou) — R09
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

## Exemplo de entidade JPA (`domain/Produto.java`)

```java
@Entity @Table(name = "produto")
public class Produto {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "empresa_id", nullable = false)
    private String empresaId;

    @Column(nullable = false) private String nome;
    private String descricao;
    private String categoria;

    @Column(name = "margem_lucro", nullable = false)  private double margemLucro;
    @Column(name = "desconto_maximo", nullable = false) private double descontoMaximo;
    @Column(nullable = false) private boolean ativo = true;

    @OneToMany(mappedBy = "produto", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProdutoMaterial> materiais = new ArrayList<>();

    @OneToMany(mappedBy = "produto", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProdutoImposto> impostos = new ArrayList<>();
    // getters/setters
}
```

`EMPRESA` ganha `@ManyToOne` para o dono (`dono_usuario_id`, R09). Convenção:
1 classe por entidade em `domain/`; schema/seed via Flyway ([[seed-dados-iniciais]]).
Estrutura: [[estrutura-projeto-spring]].
