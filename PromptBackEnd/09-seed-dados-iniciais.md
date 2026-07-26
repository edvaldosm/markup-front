# 09 — Seed de Dados Iniciais

> Fonte de verdade: `d:\ObsidianDocumentos\Conhecimento\cálculos\financeiras\markup\wiki\wiki-markup.md`

O banco deve ser populado na primeira inicialização com os dados abaixo.
Implementar em `internal/database/seed.go`, chamado no `main.go` após `AutoMigrate`.

---

## 1. Impostos padrão

```go
impostos := []domain.Imposto{
    {
        Nome:               "Simples Nacional — Anexo I (Comércio)",
        Chave:              "SIMPLES_NACIONAL_ANEXO_I",
        AliquotaPercentual: 4.0,
        Descricao:          "Comércio varejista — faixa até R$ 180.000,00/ano",
        Ativo:              true,
    },
    {
        Nome:               "Simples Nacional — Anexo II (Indústria / Confeitaria)",
        Chave:              "SIMPLES_NACIONAL_ANEXO_II",
        AliquotaPercentual: 4.5,
        Descricao:          "Pequena indústria e confeitaria — faixa até R$ 180.000,00/ano. ISS zero.",
        Ativo:              true,
    },
    {
        Nome:               "Simples Nacional — Anexo III (Serviços, Fator R ≥ 28%)",
        Chave:              "SIMPLES_NACIONAL_ANEXO_III",
        AliquotaPercentual: 6.0,
        Descricao:          "Prestação de serviços com Fator R ≥ 28% — faixa até R$ 180.000,00/ano. ISS embutido no DAS.",
        Ativo:              true,
    },
    {
        Nome:               "Simples Nacional — Anexo V (Serviços, Fator R < 28%)",
        Chave:              "SIMPLES_NACIONAL_ANEXO_V",
        AliquotaPercentual: 15.5,
        Descricao:          "Prestação de serviços intelectuais com Fator R < 28% — faixa até R$ 180.000,00/ano.",
        Ativo:              true,
    },
    {
        Nome:               "ISS — Imposto Sobre Serviços",
        Chave:              "ISS",
        AliquotaPercentual: 5.0,
        Descricao:          "Municipal (2%–5%). No Simples já está no DAS; no Lucro Presumido/Real recolhe-se por fora.",
        Ativo:              false,
    },
}
```

---

## 2. Permissões (16 chaves)

```go
permissoes := []domain.Permissao{
    {Chave: "PRODUTO_READ",   Descricao: "Visualizar produtos e fichas técnicas",    Modulo: "produto"},
    {Chave: "PRODUTO_WRITE",  Descricao: "Criar e editar produtos",                  Modulo: "produto"},
    {Chave: "MATERIAL_READ",  Descricao: "Visualizar materiais/insumos",             Modulo: "material"},
    {Chave: "MATERIAL_WRITE", Descricao: "Criar e editar materiais",                 Modulo: "material"},
    {Chave: "DESPESA_READ",   Descricao: "Visualizar despesas fixas",                Modulo: "despesa"},
    {Chave: "DESPESA_WRITE",  Descricao: "Cadastrar e editar despesas fixas",        Modulo: "despesa"},
    {Chave: "IMPOSTO_READ",   Descricao: "Visualizar impostos",                      Modulo: "imposto"},
    {Chave: "IMPOSTO_WRITE",  Descricao: "Alterar alíquotas de impostos",           Modulo: "imposto"},
    {Chave: "RELATORIO_READ", Descricao: "Gerar e visualizar relatórios",           Modulo: "relatorio"},
    {Chave: "USUARIO_READ",   Descricao: "Visualizar usuários",                      Modulo: "usuario"},
    {Chave: "USUARIO_WRITE",  Descricao: "Convidar e editar usuários",               Modulo: "usuario"},
    {Chave: "EMPRESA_READ",   Descricao: "Visualizar dados da empresa",              Modulo: "empresa"},
    {Chave: "EMPRESA_WRITE",  Descricao: "Editar dados da empresa",                  Modulo: "empresa"},
    {Chave: "PERFIL_READ",    Descricao: "Visualizar perfis",                        Modulo: "perfil"},
    {Chave: "PERFIL_WRITE",   Descricao: "Criar e editar perfis e permissões",      Modulo: "perfil"},
}
```

---

## 3. Perfis padrão com permissões

| Perfil | Permissões |
|--------|-----------|
| `ADMIN` | Todas as 15 acima |
| `GERENTE` | Todas exceto `PERFIL_WRITE` e `USUARIO_WRITE` |
| `CONTADOR` | `EMPRESA_READ`, `EMPRESA_WRITE`, `DESPESA_READ`, `DESPESA_WRITE`, `IMPOSTO_READ`, `IMPOSTO_WRITE`, `RELATORIO_READ` |
| `VENDEDOR` | `PRODUTO_READ`, `RELATORIO_READ` |
| `LEITURA` | Todos os `*_READ` |

---

## 4. Usuário admin inicial

```go
senhaHash, _ := bcrypt.GenerateFromPassword([]byte("Admin@123"), 14)

admin := domain.Usuario{
    Nome:      "Administrador",
    Email:     "admin@markup.local",
    SenhaHash: string(senhaHash),
    Ativo:     true,
}
```

> Trocar a senha padrão no primeiro acesso. Nunca usar `Admin@123` em produção.

---

## 5. Empresas exemplo — 3 segmentos (demo navegável)

Cada empresa tem CNPJ próprio, despesas fixas, materiais/insumos e produtos/serviços. Os valores abaixo mantêm o **% DF entre 15% e 20%** para preços coerentes.

```go
empresas := []domain.Empresa{
    {
        RazaoSocial:            "Doces da Ana — Confeitaria Artesanal",
        CNPJ:                   "12.345.678/0001-90",
        Segmento:               "CONFEITARIA",
        RegimeTributario:       "SIMPLES_NACIONAL",
        AnexoSimples:           "ANEXO_II",
        FaturamentoMedioMensal: 52000,   // % DF ≈ 14,8%
    },
    {
        RazaoSocial:            "MetalForte Indústria de Esquadrias LTDA",
        CNPJ:                   "23.456.789/0001-12",
        Segmento:               "INDUSTRIA",
        RegimeTributario:       "SIMPLES_NACIONAL",
        AnexoSimples:           "ANEXO_II",
        FaturamentoMedioMensal: 300000,  // % DF ≈ 18,0%
        FolhaPagamentoMensal:   38000,
    },
    {
        RazaoSocial:            "NexaTech Consultoria em Tecnologia LTDA",
        CNPJ:                   "34.567.890/0001-34",
        Segmento:               "SERVICOS",
        RegimeTributario:       "SIMPLES_NACIONAL",
        AnexoSimples:           "ANEXO_III",       // Fator R 32,9% ≥ 28% → Anexo III
        FaturamentoMedioMensal: 158000,  // % DF ≈ 19,9%
        FolhaPagamentoMensal:   52000,   // Fator R = 52000/158000 = 32,9%
    },
    {
        RazaoSocial:            "CodeLab Studio de Software LTDA",
        CNPJ:                   "45.678.901/0001-56",
        Segmento:               "SERVICOS",
        RegimeTributario:       "SIMPLES_NACIONAL",
        AnexoSimples:           "ANEXO_V",         // Fator R 20,0% < 28% → Anexo V
        FaturamentoMedioMensal: 120000,  // % DF ≈ 16,7%
        FolhaPagamentoMensal:   24000,   // Fator R = 24000/120000 = 20,0% (folha baixa)
    },
}
```

> **NexaTech vs CodeLab:** mesmo segmento, Fator R oposto. A NexaTech (folha alta) cai no Anexo III (6%); a CodeLab (enxuta, muita terceirização) cai no Anexo V (15,5%). Bom par para validar a regra do Fator R.

### Alíquota efetiva por faixa (realismo)

O DAS é **único por empresa** (baseado no RBT12), não por produto. No seed, aplicar a alíquota **efetiva** da faixa de faturamento de cada empresa (não a nominal de 1ª faixa):

| Empresa | RBT12 aprox. | Anexo/faixa | Alíquota efetiva |
|---------|--------------|-------------|------------------|
| Doces da Ana | R$ 624 mil | Anexo II, faixa 3 | ~7,8% |
| MetalForte | R$ 3,6 mi | Anexo II, faixa 5 | ~12,3% |
| NexaTech | R$ 1,9 mi | Anexo III, faixa 5 | ~14,4% |
| CodeLab | R$ 1,44 mi | Anexo V, faixa 4 | ~19,3% |

> Fórmula: `efetiva = (RBT12 × nominal − parcela_deduzir) / RBT12`. Ver tabelas por faixa no vault `wiki-markup.md`.

### Materiais/insumos por segmento

| Segmento | Exemplos de material | Unidade | Tipo |
|----------|----------------------|---------|------|
| Confeitaria | Farinha, açúcar, chocolate, embalagem | KG, UN | INSUMO |
| Indústria | Perfil de alumínio, vidro temperado, chapa de aço, fechadura | M, M2, UN | INSUMO |
| Serviços | Hora Dev Sênior/Pleno/Júnior, Hora PM, deslocamento, cloud | H, UN | MAO_DE_OBRA / INSUMO |

### Produtos/serviços por segmento

| Segmento | Exemplos (tipo) |
|----------|-----------------|
| Confeitaria | Bolo de Cenoura, Red Velvet, Brigadeiro Gourmet (PRODUTO) |
| Indústria | Janela de Correr, Porta de Alumínio, Portão de Correr (PRODUTO) |
| Serviços | Desenvolvimento Web, Consultoria, Sustentação Mensal, Auditoria (SERVICO) |

> Referência de dados completos: `src/mock/data.ts` no frontend serve como fonte fiel do seed (mesmos CNPJs, materiais e composições).

### Usuários por empresa (login demo)

| Empresa | Usuário admin | E-mail |
|---------|---------------|--------|
| Doces da Ana | Ana Paula Santos | ana@docesdaana.com.br |
| MetalForte | Roberto Menezes | roberto@metalforte.com.br |
| NexaTech | Juliana Ferraz | juliana@nexatech.com.br |
