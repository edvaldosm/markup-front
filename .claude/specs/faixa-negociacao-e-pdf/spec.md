# Spec — Faixa de negociação (desconto mín./máx.) e exportação em PDF

> Governado por [../../constitution.md](../../constitution.md) v2.3.0.

- **Slug:** faixa-negociacao-e-pdf
- **Status:** aprovada
- **Data:** 2026-08-01

## Problema / Objetivo

A ficha do produto mostra **um** preço e, entre os parâmetros, um "Desconto
Máximo: 8,0%". Quem vai negociar não consegue responder, olhando a tela, as duas
perguntas que importam na hora da venda:

1. **até onde posso descer?** — qual é o preço mínimo que ainda entrega a margem;
2. **o que acontece com o lucro** em cada nível de desconto.

Hoje isso exige contas de cabeça a partir de um percentual solto. Além disso, a
ficha só existe na tela: não há como levar a composição e o preço para uma
reunião, anexar numa proposta ou arquivar.

## Histórias de usuário

- Como vendedor, vejo o **preço de tabela e o preço mínimo** lado a lado, e sei
  que qualquer valor entre os dois preserva a margem planejada.
- Como vendedor, vejo em uma tabela quanto sobra de lucro em cada nível de
  desconto, para decidir quanto conceder.
- Como proprietário, **gero um PDF** da ficha técnica com composição, impostos,
  parâmetros, preço e faixa de negociação para anexar a uma proposta.

## Requisitos

- **REQ-01 (MUST):** a ficha exibe a faixa **desconto mínimo → desconto máximo**.
  O mínimo é `0%` (preço de tabela); o máximo é `produto.descontoMaximo`.
- **REQ-02 (MUST):** exibir o **preço mínimo** (piso) = `PV × (1 − D/100)` e
  quanto isso representa em reais (margem de negociação).
- **REQ-03 (MUST):** exibir o lucro nos dois extremos: no teto = `PV × (ML+D)/100`;
  no piso = `PV × ML/100` — a margem-alvo, intacta.
- **REQ-04 (SHOULD):** exibir degraus intermediários de desconto com preço, lucro
  e **margem efetiva** (lucro / preço praticado).
- **REQ-05 (MUST):** deixar explícito que **abaixo do piso o desconto sai do
  lucro** — a faixa é um limite de negociação, não uma sugestão de desconto.
- **REQ-06 (MUST):** botão **Gerar PDF** na ficha, produzindo um documento com
  cabeçalho (empresa, CNPJ, data de emissão), composição, impostos, parâmetros,
  preço com breakdown e a faixa de negociação.
- **REQ-07 (MUST):** o PDF não leva a moldura do app (sidebar, header, botões).
- **REQ-08 (MUST):** os novos cálculos entram no
  [catálogo](../../backend-markup/skills/catalogo-calculos-validacoes/SKILL.md)
  como C10–C12 + guarda V9 (B11: nenhum cálculo existe fora do catálogo).

## Critérios de aceite

- [ ] MVP de Startup (CodeLab, ML 38% / D 8%): tabela R$ 55.914,78, piso
      R$ 51.441,59, margem de negociação R$ 4.473,18.
- [ ] Lucro no piso = lucro líquido já exibido no breakdown (R$ 21.247,61);
      lucro no teto = lucro + reserva (R$ 25.720,80).
- [ ] Margem efetiva cai monotonicamente do teto (46,0%) ao piso (41,3%).
- [ ] Produto com `descontoMaximo = 0` mostra faixa de um ponto só, sem tabela.
- [ ] `window.print()` na ficha produz uma folha sem sidebar/header/botões e com
      o cabeçalho da empresa.

## Fora de escopo

- **Campo `descontoMinimo` no produto.** O domínio (vault + catálogo) define
  apenas `D` como *desconto máximo previsto*; o mínimo é 0% por definição. Criar
  um piso de desconto obrigatório é decisão de negócio, não de tela.
- Simular desconto **acima** do máximo (venda abaixo do piso, comendo margem).
- Geração de PDF no servidor, com template próprio e envio por e-mail.
- Exportar a lista de produtos inteira (só a ficha individual).

## Conformidade com a Constituição

- Artigos: **B1/B11** (cálculo e guardas no backend; catálogo único),
  **F5** (formatação via `useCurrency`), **F3** (tokens), **F6** (o cálculo
  local é provisório e entra no inventário de migração).
- Emenda necessária: não.

## Pontos a clarificar

- [ ] Impostos e DF da faixa estão valorados sobre o **preço de tabela** (leitura
      conservadora, igual à do breakdown atual). Recalcular sobre a receita
      efetiva do desconto elevaria o lucro exibido no piso (~R$ 22,9 mil em vez
      de R$ 21,2 mil no exemplo). **Decisão pendente para o backend** — registrada
      no catálogo.
- [ ] O PDF deve trazer logotipo/identidade da empresa? (assumido: não por ora —
      o cadastro não tem logo.)

---
**Próximo passo:** `/plan`
