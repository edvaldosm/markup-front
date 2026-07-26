# CLAUDE.md — markup-front

## Vault de conhecimento

Todo conhecimento técnico deste projeto está documentado em:

```
d:\ObsidianDocumentos\Conhecimento
```

### Regra: vault primeiro, sempre

Antes de responder sobre qualquer tecnologia, fórmula ou arquitetura, **buscar primeiro no vault**:

| Assunto | Caminho no vault |
|---------|-----------------|
| Vue 3 (componentes, Pinia, Router) | `programação/FrontEnd/vue/wiki/` |
| TypeScript | `programação/FrontEnd/typescript/wiki/` |
| React | `programação/FrontEnd/react/wiki/` |
| Precificação / Markup por Divisor | `cálculos/financeiras/markup/wiki/wiki-markup.md` |
| Modelagem de dados (DER, RBAC) | `cálculos/financeiras/markup/wiki/wiki-markup.md` |
| SQL / banco de dados | `programação/DataBase/sql/wiki/` |

Se o conteúdo não estiver no vault → perguntar antes de buscar na web.

## Sobre o projeto

Frontend do sistema de precificação estratégica baseado em **Markup por Divisor**.

**Domínio do negócio:** ver `d:\ObsidianDocumentos\Conhecimento\cálculos\financeiras\markup\wiki\wiki-markup.md`

Conceitos principais já documentados no vault:
- Fórmula `PV = CP / (1 - (Impostos + DF + ML + D) / 100)`
- Rateio de Despesas Fixas por faturamento médio mensal
- Modelagem DER com RBAC (USUARIO → PERFIL → PERMISSAO)
- Simples Nacional — Anexo II, alíquota 4,5%

## Stack esperada

- **Framework:** Vue 3 (Composition API)
- **Estado:** Pinia
- **Roteamento:** Vue Router
- **Linguagem:** TypeScript
- **Estilo:** a definir
