---
name: testes-navegacao-multiusuario
description: Como escrever os testes de aceite que navegam como cada perfil e provam o isolamento entre empresas (vitest + @vue/test-utils). Template da rule FR09.
---

# Testes de navegação multi-usuário (vitest)

Procedimento para cumprir [[FR09-teste-navegacao-por-perfil]]. Trabalhe em
**pt-br**, inclusive nos nomes dos testes.

## Stack

`vitest` + `@vue/test-utils` + `jsdom`. Config em `vitest.config.ts` fazendo
`mergeConfig` com o `vite.config.ts` (herda o alias `@`).

```
npm test          # vitest run
npm run test:watch
```

## Arquivos

| Arquivo | Papel |
|---------|-------|
| `src/test/setup.ts` | stub de `IntersectionObserver` (jsdom não tem; `usePaginacao` usa) |
| `src/test/app-harness.ts` | sobe o app real e expõe helpers de navegação |
| `src/test/navegacao-multiusuario.spec.ts` | as jornadas por persona |

## Harness — o que ele resolve

Monta o **app real**: router com `createMemoryHistory`, as `rotasApp` reais (com
lazy-load), o `AppLayout` real e o guard real. Nada de stub de view — o objetivo
é justamente pegar o vazamento que nasce da composição.

Expõe:

- `montarAppComo(email)` — login + monta + navega ao dashboard
- `irPara(rota)` — navega e devolve o nome da rota onde **parou** (revela redirect)
- `rotasNoMenu()` — `href` dos `a.nav-item` renderizados
- `abrirSwitcher()` — abre o seletor e devolve as empresas listadas
- `aguardar(promessa)` / `assentar()` — ver abaixo

### Fake timers: a armadilha

Os stores simulam latência com `setTimeout` (`mockQuery`, `login`). Sob
`vi.useFakeTimers()` o timer **não avança sozinho** — então:

```ts
await store.fetchProdutos()            // ✗ trava até o timeout do teste
await aguardar(store.fetchProdutos())  // ✓ avança os timers e então espera
```

`aguardar` faz `vi.runAllTimersAsync()` + `flushPromises()` antes de aguardar a
promise. Com fake timers a suíte roda em ~2s em vez de ~2min.

## Estrutura do spec

Declare as personas numa tabela — `describe.each` gera a jornada de cada uma:

```ts
interface Persona {
  nome: string; email: string; perfil: string
  empresas: string[]     // ids que DEVE ver
  permitidas: string[]   // rotas que abrem
  bloqueadas: string[]   // rotas que caem no fallback
}
```

Escreva `permitidas`/`bloqueadas` **à mão** (é a especificação). Derivá-las do
perfil em runtime faz o teste espelhar a implementação e nunca falhar.

Cinco testes por persona — os cinco itens da FR09. Mais dois blocos fora do
`each`: isolamento no nível dos stores e troca de sessão.

## Detector de vazamento

```ts
function nomesExclusivosDeOutras(empresaAtiva: string): string[] {
  const daAtiva = rotulosDe(empresaAtiva, true)
  const deOutras = new Set(rotulosDe(empresaAtiva, false))
  // descarta sobreposição: "Energia elétrica" ⊂ "Energia elétrica (maquinário)"
  return [...deOutras].filter(
    nome => !daAtiva.some(meu => meu.includes(nome) || nome.includes(meu))
  )
}
```

Guarde o detector com `expect(proibidos.length).toBeGreaterThan(0)` — se o
fixture perder a variedade, o teste avisa em vez de passar vazio.

## Verificação por mutação (obrigatória)

Antes de dar o teste por bom, **quebre a regra** e confirme que ele acusa:

```bash
# em stores/produtos.ts, troque o computed filtrado por `todos.value`
npm test
```

Deve falhar em massa (isolamento renderizado + isolamento de store). Restaure e
confirme `git diff` limpo. Um teste de isolamento que passa com o filtro
desligado não está testando nada.

## Arquivos de aceite

- `src/test/navegacao-multiusuario.spec.ts` — as 6 personas × 5 provas. As rotas
  do módulo do gestor ficam na constante `ADMIN`, **fora** de `TODAS`: elas são
  bloqueadas por escopo, não por permissão, então PROPRIETARIO também as tem em
  `bloqueadas`.
- `src/test/admin-gestao-site.spec.ts` — o módulo de Gestão do Site: acesso,
  visão da base inteira, ações do gestor e o escopo de tema
  ([[modulo-gestao-site]], [[FR10-escopo-de-tema-por-modulo]]). Ao assertar o
  conteúdo de uma tabela, consulte **as linhas** (`tbody .usuario__info`) e não
  `wrapper.text()`: um nome legítimo num seletor de convite dá falso positivo.

## Onde isso não alcança

Cobre o que a **UI oferece** sobre dados mock. A autoridade é o backend
([[R09-ownership-multiempresa]], [[R05-autorizacao-rbac]]) — quando ele existir,
`fetch*` deve mandar o `empresaId` e receber já filtrado; hoje os stores trazem
o dataset inteiro e filtram num `computed`, então o isolamento é de
**apresentação**, não de transporte.
