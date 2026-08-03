# Spec — Integração com o backend: sessão e empresas

> Preenchido por `/specify`. Descreve **o quê** e **por quê** — nunca o **como**
> (isso é o `plan.md`). Deve obedecer a [constitution.md](../../constitution.md).

- **Slug:** integracao-backend-sessao-empresas
- **Status:** aprovada
- **Data:** 2026-08-03

## Problema / Objetivo

O frontend é um protótipo que roda inteiramente sobre `src/mock/data.ts`: o login
aceita qualquer senha desde que o e-mail exista no mock, e a lista de empresas do
usuário é filtrada **no cliente** por `empresasAutorizadas()`. Enquanto isso, o
`markup-back` está no ar com o contrato GraphQL completo, JWT e autorização por
operação.

Enquanto o front não consumir o backend, três coisas continuam verdadeiras e são
ruins: (a) não existe autenticação de fato — a tela de login é um seletor de
usuário; (b) a regra de isolamento multi-empresa (B9) é decidida no cliente, onde
o usuário pode alterá-la; (c) o mock e o banco vão divergir a cada mudança.

Esta é a **fatia 1 de 3** da integração. Ela liga a porta de entrada — sessão e
empresas — e valida token, CORS, expiração e erro de autorização de ponta a ponta
antes de mexer nas 15 telas de dados. As fatias seguintes são *dados de empresa*
(catálogo, materiais, impostos, despesas) e *precificação + Gestão do Site +
assistente*.

## Histórias de usuário

- Como **usuário**, quero entrar com meu e-mail e minha senha reais para que meu
  acesso valha alguma coisa.
- Como **usuário**, quero continuar logado ao recarregar a página, para não
  reautenticar a cada F5.
- Como **usuário**, quero que uma sessão longa não me derrube no meio de uma
  operação, porque o token curto expirou.
- Como **dono de empresa**, quero ver exatamente as empresas que são minhas ou
  compartilhadas comigo — decidido pelo servidor, não pelo navegador.
- Como **usuário com perfis diferentes por empresa**, quero que minhas permissões
  acompanhem a empresa que eu selecionei.
- Como **ADMIN global**, quero continuar enxergando todas as empresas.

## Requisitos

> Testáveis, com MUST/SHOULD. IDs `REQ-01`, `REQ-02`…

### Sessão

- **REQ-01 (MUST):** O login autentica contra o backend com e-mail **e senha**.
  Credencial inválida exibe erro e não cria sessão. Não existe mais caminho de
  login que aceite qualquer senha.
- **REQ-02 (MUST):** O *access token* vive apenas em memória; o *refresh token*
  persiste no navegador. Recarregar a página restaura a sessão a partir do
  refresh, sem pedir senha de novo.
- **REQ-03 (MUST):** Operação recusada por token expirado é renovada
  automaticamente e **repetida uma vez**, de forma invisível ao usuário. Se a
  renovação falhar, a sessão é encerrada e o usuário volta ao login com aviso de
  sessão expirada — nunca uma tela vazia sem explicação.
- **REQ-04 (MUST):** Sair encerra a sessão **no servidor** e limpa todo estado
  local (tokens, empresas, empresa ativa, dados em cache). Nenhum dado de um
  usuário pode aparecer para o próximo que logar na mesma aba.
- **REQ-05 (MUST):** Usuário inativo não entra, mesmo com senha correta.

### Empresas e escopo

- **REQ-06 (MUST):** A lista de empresas vem do servidor já filtrada. O
  frontend **não** decide mais quais empresas o usuário pode ver — a filtragem
  no cliente é removida, não mantida como reforço. (B9: a regra tem uma sede só,
  e não é o navegador.)
- **REQ-07 (MUST):** A empresa ativa sobrevive ao recarregamento. Se a empresa
  guardada não estiver no conjunto autorizado devolvido pelo servidor, cai
  silenciosamente na primeira disponível.
- **REQ-08 (MUST):** Usuário sem nenhuma empresa autorizada vê um estado vazio
  explicativo, não uma tela quebrada.
- **REQ-09 (MUST):** O perfil efetivo da sessão — o que decide permissões — é o
  **perfil global**, se houver; senão, o perfil do vínculo **da empresa ativa**.
  Trocar de empresa recalcula permissões e navegação.
  *Muda comportamento atual:* hoje o front fixa o perfil do primeiro vínculo, o
  que dá permissão errada para quem tem perfis distintos em empresas distintas.
  Confirmado contra o backend em execução: `ana@docesdaana.com.br` é
  `PROPRIETARIO` na empresa 1 e `CONTADOR` na empresa 3.
- **REQ-09a (MUST):** Se a troca de empresa tornar a rota atual proibida para o
  novo perfil, o usuário é **redirecionado ao dashboard** — não fica numa rota
  que ele não pode mais ver, nem vê uma tela de "sem permissão" no lugar do
  conteúdo que estava aberto.
- **REQ-10 (MUST):** Toda consulta de dados de empresa envia a empresa ativa
  explicitamente, conforme o contrato.

### Contrato e erros

- **REQ-11 (MUST):** Os tipos do front espelham o schema do backend (Artigo III).
  Divergências conhecidas a corrigir nesta fatia:
  | Front hoje | Schema (fonte de verdade) |
  |---|---|
  | `Empresa.anexoSimples` | `anexoCadastrado` |
  | `Empresa.createdAt` | não existe |
  | `Empresa` sem `percentualDespesasFixas` | existe, **calculado pelo servidor** (C2) |
  | `SegmentoNegocio` sem `COMERCIO` | quatro valores |
  | `Usuario.createdAt`, `Usuario.avatarUrl` | não existem |
  | `Perfil.escopoGlobal` opcional | obrigatório |

  Consequência de `COMERCIO`: `src/config/segmentos.ts` é um registro completo
  por segmento (ícone, cores, rótulos). O novo valor exige entrada própria, senão
  empresa de comércio fica sem identidade visual e sem rótulos de UI.
- **REQ-12 (MUST):** `percentualDespesasFixas` passa a ser **lido do servidor**,
  nunca recalculado no front (B1).
- **REQ-13 (MUST):** Falhas têm mensagem distinta e acionável para o usuário:
  credencial inválida, sem autorização para a operação, e backend inacessível.
  Erro de rede não pode ser exibido como "nenhum registro encontrado".
- **REQ-14 (MUST):** O endpoint do backend é configurável por ambiente, sem
  recompilar código.

### Remoção do mock

- **REQ-15 (MUST):** Sai do app o caminho mock de autenticação e de empresas. O
  mock permanece **apenas** como fixture de teste, sem flag que o ligue em tempo
  de execução. O destino é remoção total: `src/mock/data.ts` encolhe a cada fatia
  e é apagado na última.
- **REQ-16 (SHOULD):** Os testes de navegação por perfil (F9) continuam
  provando o que cada perfil vê e o que lhe é negado, agora sobre respostas
  simuladas do backend em vez de mock importado.

## Critérios de aceite

- [ ] Login com credencial do seed (`ana@docesdaana.com.br`) entra; senha errada
      é recusada com mensagem.
- [ ] Usuário inativo (`contador@contabilidade.com.br`) é recusado mesmo com
      senha correta.
- [ ] F5 em qualquer tela mantém usuário logado e a mesma empresa ativa.
- [ ] Com o access token expirado, uma ação do usuário conclui normalmente
      (renovação + repetição), sem tela de erro.
- [ ] Refresh inválido/expirado leva ao login com aviso de sessão expirada.
- [ ] Ana (perfis diferentes em duas empresas) vê a navegação mudar ao trocar de
      empresa.
- [ ] ADMIN global vê todas as empresas da base.
- [ ] Sair e logar como outro usuário não mostra nenhum dado do anterior.
- [ ] Backend derrubado ⇒ mensagem de indisponibilidade, não lista vazia.
- [ ] Nenhuma tela desta fatia importa `src/mock/`.
- [ ] `npm run build` e `npm test` passam.

## Fora de escopo

- Catálogo (produtos, materiais, impostos, despesas fixas) — fatia 2.
- Precificação, Gestão do Site, assistente e relatórios — fatia 3.
- Remoção do `useMarkupCalculator` — sai junto com a precificação, na fatia 3.
- `alterarSenha`, `convidarUsuario` e recuperação de senha.
- Autenticação social, MFA e "lembrar-me" configurável.
- Paginação server-side (`minhasEmpresas` devolve lista simples no contrato).

## Conformidade com a Constituição

- **Artigos aplicáveis:** B2 (isolamento multi-empresa), B5 (RBAC por operação),
  B6 (contrato-first: o `.graphqls` manda), B9 (ownership + ADMIN global),
  F2 (stores por domínio, reativas à empresa ativa), F6 (camada GraphQL isolada;
  cálculo sai do front), F7 (rotas protegidas), F9 (teste navegando por perfil),
  Artigo III (fronteira: números crus do backend, formatação no front).
- **Emenda necessária?** Sim, pequena — o artigo **F6** descreve o front como
  tendo uma flag de runtime `MOCK_MODE` alternando mock/backend. A decisão desta
  spec é que **não existe flag**: o mock vira fixture de teste. Ao fim da fatia 3,
  `FR06` deve ser reescrita como "camada GraphQL isolada", sem o modo mock.

## Decisões tomadas (2026-08-03)

- **Duração da sessão:** renova **indefinidamente** enquanto o refresh for
  aceito pelo servidor. O front não impõe teto próprio — quem decide o fim da
  sessão é o backend, recusando o refresh; nesse momento vale o REQ-03.
- **Rota proibida após troca de empresa:** redireciona ao dashboard (REQ-09a).
- **Formato de id:** varrido em `src/**` — nada no código de aplicação depende
  do formato (rotas usam `:id` genérico, o tema é chaveado por `segmento`, não há
  parse nem ordenação por id). Os literais `emp-001`/`usr-001` existem só nos
  `.spec.ts`, que esta fatia reescreve. **Sem pendência.**
- **Endpoint de desenvolvimento:** `http://localhost:8080/graphql`, verificado no
  ar durante a especificação.

## Pontos a clarificar

- Nenhum em aberto.

---
**Próximo passo:** `/plan`
