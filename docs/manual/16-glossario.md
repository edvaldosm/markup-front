---
title: "Glossário rápido"
ordem: 16
tags: [glossario, siglas, cp, ml, df, pv, fator-r, rbac, convite, versionamento]
resumo: "Definição curta de todas as siglas e termos usados no manual do sistema Markup: CP, ML, D, DF, PV, Divisor de Markup, Fator R, Anexo Cadastrado vs Aplicado, RBAC, Escopo Global, Dono, Convite/Senha Provisória, Versão de Produto e Access/Refresh Token."
---

# 16. Glossário rápido

> **Contexto:** este documento faz parte do *Manual de Utilização — Sistema Markup*, ferramenta de precificação estratégica por Markup Divisor (`PV = CP / Divisor`). Veja o índice completo em [`00-indice.md`](./00-indice.md).

| Termo | Significado |
|---|---|
| **CP** | Custo de Produção — soma dos materiais/insumos da ficha técnica |
| **ML** | Margem de Lucro — % de lucro líquido desejado sobre o preço de venda |
| **D** | Desconto Máximo — % reservado no preço para negociação sem perder a margem |
| **DF** | Despesas Fixas — % obtido do rateio das despesas fixas sobre o faturamento médio, calculado pelo backend |
| **Divisor de Markup** | `1 − (Impostos% + DF% + ML% + D%)/100` |
| **PV** | Preço de Venda = CP ÷ Divisor |
| **Fator R** | Folha de pagamento ÷ Faturamento médio — decide o Anexo do Simples para Serviços |
| **Anexo Cadastrado** | Anexo do Simples informado manualmente no cadastro da empresa — ponto de partida |
| **Anexo Aplicado** | Anexo do Simples que efetivamente vale, derivado do Fator R (empresas de Serviços) — pode diferir do Anexo Cadastrado |
| **Segmento de Negócio** | Confeitaria 🧁, Indústria 🏭, Serviços 🛠️ ou Comércio 🏬 — muda rótulos e comportamento tributário padrão, não a fórmula |
| **RBAC** | Controle de acesso baseado em papéis (perfis + permissões) |
| **Escopo Global** | Característica do perfil ADMIN: enxerga e opera todas as empresas da base |
| **Dono (`donoUsuarioId`)** | Usuário que cadastrou a empresa — tem acesso pleno a ela por padrão; nunca pode ser desvinculado |
| **Vínculo/Compartilhamento** | Acesso concedido a um usuário em uma empresa que ele não é dono, com um perfil específico |
| **Convite** | Único modo de dar acesso a um novo usuário — não existe cadastro direto |
| **Senha Provisória** | Senha gerada pelo servidor ao convidar um usuário, exibida **uma única vez** na tela — não é recuperável depois |
| **Versão de Produto** | Cada período de vigência de margem/desconto de um produto; um ajuste fecha a vigente e abre uma nova, sem apagar o histórico |
| **Access Token** | Token de sessão de curta duração (15 min), só em memória — autentica cada requisição |
| **Refresh Token** | Token de longa duração (7 dias), guardado no navegador — permite renovar a sessão sem pedir senha (o que faz o F5 não deslogar) |

Para o detalhamento de cada termo, consulte o documento correspondente listado em [`00-indice.md`](./00-indice.md).
