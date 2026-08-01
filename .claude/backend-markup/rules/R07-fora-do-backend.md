# Rule R07 — O que NÃO vai para o backend

**Categoria:** Fronteira de responsabilidade
**Origem:** IniciandoBackEndMarkup.md §11

## Regra

As seguintes responsabilidades ficam **no frontend** e não devem ser
implementadas no backend:

- **Formatação** de moeda (R$) e percentual — o front já usa `Intl.NumberFormat`.
- **Ordenação e filtragem** de listas na UI — feitas localmente após receber os dados.
- **Estado da interface** — loading, modal aberto, tab ativa, etc.

## Por quê

O backend expõe números e dados brutos; apresentação é responsabilidade do
cliente. Isso mantém a API agnóstica de UI e reutilizável. É o complemento de
[[R01-calculo-no-backend]] (cálculo no back, apresentação no front).
