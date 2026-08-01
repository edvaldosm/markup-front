/**
 * Harness de teste: sobe o app **de verdade** (router real, `AppLayout` real e
 * as views reais em lazy-load) sobre um history em memória.
 *
 * Serve aos testes de aceite da R09: navegar como cada usuário e comprovar que
 * ele só vê a(s) empresa(s) dele.
 */
import { vi, expect } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory, RouterView, type Router } from 'vue-router'
import { defineComponent, h } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { rotasApp, guardaNavegacao } from '@/router'
import { useAuthStore } from '@/stores/auth'

const LoginStub = defineComponent({ name: 'LoginStub', render: () => h('div', 'login') })

const Raiz = defineComponent({ name: 'RaizTeste', render: () => h(RouterView) })

/**
 * Deixa promises + timers do mock (`mockQuery`, `login`) resolverem.
 * Os stores simulam latência com `setTimeout`, então avançamos os fake timers.
 */
export async function assentar() {
  await vi.runAllTimersAsync()
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

/** Autentica pelo store real, respeitando o delay simulado do login */
export async function entrarComo(email: string) {
  const auth = useAuthStore()
  const promessa = auth.login(email, '123456')
  await assentar()
  expect(await promessa).toBe(true)
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

/** Faz login, monta o app real e navega até o dashboard */
export async function montarAppComo(email: string): Promise<AppMontado> {
  setActivePinia(createPinia())
  await entrarComo(email)

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
