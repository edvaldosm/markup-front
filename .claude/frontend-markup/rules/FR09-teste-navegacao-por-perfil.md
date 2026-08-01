# Rule FR09 — Teste de navegação por perfil

**Categoria:** Qualidade / Segurança
**Origem:** Requisito do usuário (2026-08-01); prova no front as rules
[[R09-ownership-multiempresa]] e [[R02-isolamento-multiempresa]]

## Regra

Toda regra de **visibilidade** (quais empresas/registros o usuário enxerga) ou de
**permissão** (quais telas ele acessa) precisa de um **teste de aceite que navega
como cada perfil**. Não basta testar a função pura: o teste sobe o app real
(router + layout + views) e percorre a jornada.

Cada persona coberta deve provar as cinco coisas:

1. o seletor lista **exatamente** as empresas autorizadas — nem mais, nem menos;
2. o menu oferece só as rotas que o perfil permite;
3. **toda** tela permitida abre e carrega;
4. rota proibida **não** abre (cai no destino de fallback);
5. **nenhum dado de outra empresa aparece** — nem no store, nem renderizado.

### Como não escrever um teste vazio

- Asserte no **DOM**, não no texto da página inteira: procurar a palavra
  "Empresa" em `wrapper.text()` dá falso positivo (ela aparece em botões,
  rótulos e razões sociais). Use os elementos de navegação (`a.nav-item`).
- Ao caçar vazamento por nome, **descarte nomes que se sobrepõem** aos da
  empresa ativa (prefixo/sufixo). "Energia elétrica" é substring de "Energia
  elétrica (maquinário pesado)" e acusaria vazamento onde não há.
- Prove que o teste **falha** quando a regra é removida (mutação). Um teste de
  isolamento que passa com o filtro desligado não está testando nada.

## Por quê

O isolamento entre clientes é a fronteira de privacidade do sistema. Uma
regressão aqui não quebra a tela — ela vaza dado de um cliente para outro, em
silêncio. Testes de função pura não pegam isso: o vazamento nasce da composição
(store + rota + componente). Procedimento e harness em
[[testes-navegacao-multiusuario]].

## Escopo

O front testa o que a **UI oferece**. A autoridade continua no backend
([[R02-isolamento-multiempresa]], [[R05-autorizacao-rbac]]): estes testes
garantem que a interface nunca conduza o usuário a uma operação que o servidor
negaria — não substituem a checagem do servidor.
