/**
 * Harness de teste: sobe o app **de verdade** (router real, `AppLayout` real e
 * as views reais em lazy-load) sobre um history em memória, falando com o
 * `servidor-falso` no lugar do backend.
 *
 * Serve aos testes de aceite da R09: navegar como cada usuário e comprovar que
 * ele só vê a(s) empresa(s) dele — agora com a decisão vindo do servidor, e não
 * de um filtro do próprio front.
 */
import { vi, expect } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory, RouterView, type Router } from 'vue-router'
import { defineComponent, h } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { rotasApp, guardaNavegacao } from '@/router'
import { useAuthStore } from '@/stores/auth'
import { instalarServidorFalso, SENHA_PADRAO, type ServidorFalso } from './servidor-falso'
import { limparSessao } from '@/graphql/sessao'
import { apolloClient } from '@/graphql/client'

const LoginStub = defineComponent({ name: 'LoginStub', render: () => h('div', 'login') })

const Raiz = defineComponent({ name: 'RaizTeste', render: () => h(RouterView) })

/**
 * Deixa promises e timers pendentes resolverem.
 *
 * As respostas do servidor falso são imediatas, mas os stores ainda não
 * migrados usam `mockQuery` com `setTimeout` — por isso os timers continuam
 * sendo avançados aqui. Some quando o mock sair, na fatia 3.
 */
export async function assentar() {
  // Só avança timers quando o teste os simula: `runAllTimersAsync` lança se os
  // fake timers não estiverem ligados, e nem toda suíte precisa deles.
  if (vi.isFakeTimers()) await vi.runAllTimersAsync()
  await flushPromises()
}

/**
 * Espera uma promise que depende dos timers simulados.
 * Nunca faça `await store.fetchX()` direto sob fake timers: o timer não avança
 * sozinho e o teste trava. Use `await aguardar(store.fetchX())`.
 */
export async function aguardar<T>(promessa: Promise<T>): Promise<T> {
  await assentar()
  return promessa
}

/**
 * Prepara um teste: Pinia novo, servidor falso no ar e sessão zerada.
 *
 * O cofre de sessão e o cache do Apollo são **módulos**, não estado do Pinia —
 * sobrevivem entre testes. Sem limpá-los, um teste entraria autenticado pelo
 * anterior, e o seguinte veria dado em cache de outra empresa.
 */
export function prepararAmbiente(): ServidorFalso {
  setActivePinia(createPinia())
  limparSessao()
  try {
    localStorage.clear()
  } catch {
    /* jsdom sempre tem localStorage; a guarda é para ambientes sem ele */
  }
  void apolloClient.clearStore()
  return instalarServidorFalso()
}

export function criarRouter(): Router {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', name: 'login', component: LoginStub, meta: { public: true } },
      { path: '/', component: AppLayout, meta: { requiresAuth: true }, children: rotasApp },
      { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
    ],
  })
  router.beforeEach(guardaNavegacao)
  return router
}

/** Autentica pelo store real, contra o servidor falso. */
export async function entrarComo(email: string, senha = SENHA_PADRAO) {
  const auth = useAuthStore()
  const promessa = auth.login(email, senha)
  await assentar()
  expect(await promessa, `login de ${email} deveria ser aceito`).toBe(true)
  return auth
}

export interface AppMontado {
  wrapper: VueWrapper
  router: Router
  /** Navega e espera a tela assentar; devolve o nome da rota em que parou */
  irPara(caminho: string): Promise<string>
  /** Texto renderizado da tela inteira */
  texto(): string
  /** Destinos dos itens de menu realmente renderizados na sidebar */
  rotasNoMenu(): string[]
  /** Abre o seletor de empresas e devolve os nomes listados */
  abrirSwitcher(): Promise<string[]>
  desmontar(): void
}

/**
 * Faz login, monta o app real e navega até o dashboard.
 *
 * Diferente da versão anterior, **carrega as empresas antes de montar**: o
 * perfil efetivo depende da empresa ativa (REQ-09), então montar sem elas
 * renderizaria um momento sem permissão nenhuma.
 */
export async function montarAppComo(email: string): Promise<AppMontado> {
  await entrarComo(email)

  const { useEmpresaStore } = await import('@/stores/empresa')
  await aguardar(useEmpresaStore().fetchEmpresas())

  const router = criarRouter()
  await router.push('/dashboard')
  await router.isReady()

  const wrapper = mount(Raiz, { global: { plugins: [router] } })
  await assentar()

  return {
    wrapper,
    router,
    async irPara(caminho: string) {
      await router.push(caminho)
      await assentar()
      return String(router.currentRoute.value.name ?? '')
    },
    texto: () => wrapper.text(),
    rotasNoMenu: () =>
      wrapper.findAll('a.nav-item').map(a => a.attributes('href') ?? '').filter(Boolean),
    async abrirSwitcher() {
      await wrapper.find('.switcher__trigger').trigger('click')
      await assentar()
      return wrapper.findAll('.switcher__item-name').map(el => el.text())
    },
    desmontar: () => wrapper.unmount(),
  }
}
