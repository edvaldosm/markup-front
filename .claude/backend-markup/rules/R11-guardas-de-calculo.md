# Rule R11 — Guardas de cálculo e validação de entrada

**Categoria:** Integridade de cálculo
**Origem:** vault `wiki-markup.md` §Boas Práticas e Erros Comuns; lacunas
identificadas ao migrar `src/composables/useMarkup.ts` para o backend

## Regra

Nenhum cálculo de precificação pode produzir número silenciosamente errado.
Toda divisão é guardada e toda entrada inválida é **rejeitada**, não absorvida.

| Guarda | Condição | Comportamento obrigatório |
|--------|----------|---------------------------|
| Divisor | `divisor <= 0` | erro explícito — ver [[R03-divisor-markup-positivo]] |
| Rateio DF | `faturamento_medio_mensal <= 0` | `%DF = 0` (não dividir por zero) |
| Fator R | `faturamento_medio_mensal <= 0` | `fatorR = 0` — ver [[R10-fator-r-anexo-simples]] |
| Despesa inativa | `ativa = false` | **não** entra no somatório do %DF |
| Material órfão | vínculo aponta material inexistente | **erro de integridade** — nunca ignorar |
| Percentuais | `margem_lucro < 0`, `desconto_maximo < 0`, alíquota `< 0` | rejeitar na entrada |
| Autorização | `empresaId` fora do conjunto autorizado | negar **antes** de calcular ([[R09-ownership-multiempresa]]) |

### Falhar alto, não em silêncio

O protótipo Vue ignora o material ausente (`if (!mat) return acc`), o que
**subestima o custo** — o produto sai barato demais e ninguém percebe. No
backend a FK impede o órfão; se ainda assim ocorrer, é erro, não zero.

A mesma lógica vale para o resto: preferir erro explícito a um número plausível
e errado. O único caso em que um zero é aceitável é o rateio sem faturamento
cadastrado, porque ali `0%` é a resposta correta (não há base para ratear).

## Por quê

Erro de precificação não aparece como falha — aparece como margem corroída meses
depois. O vault lista exatamente esses casos em "erros comuns": custo
subestimado, %DF fixado à mão, dupla contagem de despesa. Guardas explícitas no
service são a diferença entre um bug detectável e um prejuízo silencioso.

Catálogo completo (C1–C12, V1–V9): [[catalogo-calculos-validacoes]].

## Verificação

Cada guarda desta tabela precisa de teste no backend, incluindo o caminho de
erro — não basta testar o caminho feliz.
