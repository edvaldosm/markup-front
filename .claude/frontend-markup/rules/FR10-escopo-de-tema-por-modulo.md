# Rule FR10 — Escopo de tema por módulo

**Categoria:** Estilo / Arquitetura de navegação
**Origem:** módulo de Gestão do Site (spec `modulo-gestao-site`, 2026-08-01);
complementa [[FR03-design-tokens]] e [[FR07-rotas-protegidas]]

## Regra

Quando um módulo tem **público próprio** (hoje: o gestor do site), ele muda de
identidade visual por **escopo de tema** — uma classe que **remapeia os design
tokens** — e nunca por cor hardcoded, tema paralelo ou componente duplicado.

```css
/* main.css, depois do :root */
.theme-admin {
  --color-primary-600: var(--color-neutral-600);
  --color-bg:          #f7f8fa;
  --color-text-muted:  var(--color-neutral-500);
  /* … remapeia a paleta inteira, não pinta componentes */
}
```

```ts
// AppLayout.vue — o escopo segue a rota
const emAdmin = computed(() => route.path.startsWith('/admin'))
watch(emAdmin, ativo => document.documentElement.classList.toggle('theme-admin', ativo),
      { immediate: true })
```

Três consequências obrigatórias:

1. **A classe vai no layout _e_ no `documentElement`.** O que o Vue teleporta
   (`BaseModal` usa `<Teleport to="body">`) e o `background` do `body` ficam fora
   do escopo do layout — sem a classe na raiz, voltam ao tema do produto.
2. **Qualquer realce derivado da primária vira token.** Sombra de botão, anel de
   foco: `--color-primary-shadow`, `--focus-ring`. Hex de acento cravado no
   componente é justamente o que não acompanha a troca de escopo.
3. **A rota declara o que a protege.** `meta.permissao` quando é RBAC
   (`PermissaoChave`); `meta.adminGlobal` quando é **escopo** — o guard checa
   `auth.adminGlobal`, não uma permissão. Espelhe no menu com a mesma condição.

## Por quê

Escopo e permissão não são a mesma coisa. Um PROPRIETARIO tem **todas** as
permissões RBAC e mesmo assim não pode administrar o site; quem separa é o escopo
global (B9). Tratar isso como "mais uma permissão" convidaria alguém, um dia, a
dar `USUARIO_WRITE` a um cliente e abrir a área de suporte junto.

E o gestor precisa saber, olhando, se está dando suporte ou operando a empresa de
um cliente. Cor é o sinal mais barato para isso — desde que venha do tema, não de
uma segunda árvore de componentes que envelheceria em paralelo.

## Escopo

O tema é UI. Ele **não** protege nada: quem barra é o guard (FR07) e, com
autoridade final, o backend ([[R05-autorizacao-rbac]], [[R09-ownership-multiempresa]]).
A prova de que o módulo só aparece para quem deve continua sendo o teste de
navegação por perfil ([[FR09-teste-navegacao-por-perfil]]).
