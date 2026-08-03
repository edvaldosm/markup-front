import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createRouter, createMemoryHistory, type RouteRecordRaw } from 'vue-router'
import { defineComponent, h } from 'vue'
import { rotasApp, guardaNavegacao } from './index'
import { useAuthStore } from '@/stores/auth'
import { useEmpresaStore } from '@/stores/empresa'
import { prepararAmbiente, entrarComo as autenticar } from '@/test/app-harness'
import { type ServidorFalso } from '@/test/servidor-falso'

let servidor: ServidorFalso

/**
 * Router de teste: mesmas rotas e mesmo guard do app, mas com history em
 * memória e componentes stub (evita carregar as views de verdade).
 */
const Stub = defineComponent({ render: () => h('div') })

function semLazy(rotas: RouteRecordRaw[]): RouteRecordRaw[] {
  return rotas.map(r => ('redirect' in r && r.redirect ? r : { ...r, component: Stub } as RouteRecordRaw))
}

function criarRouterTeste() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', name: 'login', component: Stub, meta: { public: true } },
      { path: '/', component: Stub, meta: { requiresAuth: true }, children: semLazy(rotasApp) },
      { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
    ],
  })
  router.beforeEach(guardaNavegacao)
  return router
}

/**
 * Autentica **e carrega as empresas**: o perfil efetivo — o que o guard consulta
 * — vem do vínculo da empresa ativa (REQ-09). Sem as empresas, todo perfil
 * pareceria vazio e toda rota cairia no dashboard.
 */
async function entrarComo(email: string) {
  const auth = await autenticar(email)
  await useEmpresaStore().fetchEmpresas()
  return auth
}

describe('navegação — guard de autenticação (FR07)', () => {
  beforeEach(() => { servidor = prepararAmbiente() })
  afterEach(() => servidor.restaurar())

  it('visitante sem login é mandado para /login', async () => {
    const router = criarRouterTeste()
    await router.push('/produtos')
    expect(router.currentRoute.value.name).toBe('login')
  })

  it('usuário logado entra na rota pedida', async () => {
    await entrarComo('ana@docesdaana.com.br')
    const router = criarRouterTeste()
    await router.push('/produtos')
    expect(router.currentRoute.value.path).toBe('/produtos')
  })

  it('usuário logado que tenta /login volta ao dashboard', async () => {
    await entrarComo('ana@docesdaana.com.br')
    const router = criarRouterTeste()
    await router.push('/login')
    expect(router.currentRoute.value.name).toBe('dashboard')
  })

  it('rota inexistente cai no dashboard', async () => {
    await entrarComo('ana@docesdaana.com.br')
    const router = criarRouterTeste()
    await router.push('/rota-que-nao-existe')
    expect(router.currentRoute.value.name).toBe('dashboard')
  })
})

describe('navegação — guard de permissão RBAC (R05)', () => {
  beforeEach(() => { servidor = prepararAmbiente() })
  afterEach(() => servidor.restaurar())

  it('vendedora não acessa /usuarios (sem USUARIO_READ)', async () => {
    await entrarComo('carla@docesdaana.com.br')
    const router = criarRouterTeste()
    await router.push('/usuarios')
    expect(router.currentRoute.value.name).toBe('dashboard')
  })

  it('vendedora não acessa /impostos nem /perfis', async () => {
    await entrarComo('carla@docesdaana.com.br')
    const router = criarRouterTeste()
    for (const rota of ['/impostos', '/perfis', '/materiais', '/empresa']) {
      await router.push(rota)
      expect(router.currentRoute.value.name).toBe('dashboard')
    }
  })

  it('vendedora acessa o que o perfil permite', async () => {
    await entrarComo('carla@docesdaana.com.br')
    const router = criarRouterTeste()
    for (const rota of ['/produtos', '/relatorios', '/precificacao']) {
      await router.push(rota)
      expect(router.currentRoute.value.path).toBe(rota)
    }
  })

  it('gerente acessa materiais mas não perfis', async () => {
    await entrarComo('marcos@docesdaana.com.br')
    const router = criarRouterTeste()

    await router.push('/materiais')
    expect(router.currentRoute.value.path).toBe('/materiais')

    await router.push('/perfis')
    expect(router.currentRoute.value.name).toBe('dashboard')
  })

  it('ADMIN global acessa todas as rotas', async () => {
    await entrarComo('admin@markup.com.br')
    const router = criarRouterTeste()
    const rotas = ['/empresa', '/materiais', '/despesas', '/impostos', '/produtos',
                   '/precificacao', '/fator-r', '/relatorios', '/usuarios', '/perfis']
    for (const rota of rotas) {
      await router.push(rota)
      expect(router.currentRoute.value.path).toBe(rota)
    }
  })

  it('dashboard é sempre acessível — é o destino de fallback', async () => {
    for (const email of ['carla@docesdaana.com.br', 'marcos@docesdaana.com.br', 'admin@markup.com.br']) {
      prepararAmbiente()
      await entrarComo(email)
      const router = criarRouterTeste()
      await router.push('/dashboard')
      expect(router.currentRoute.value.name).toBe('dashboard')
    }
  })

  it('logout no meio da sessão bloqueia a próxima navegação', async () => {
    const auth = await entrarComo('ana@docesdaana.com.br')
    const router = criarRouterTeste()
    await router.push('/produtos')
    expect(router.currentRoute.value.path).toBe('/produtos')

    await auth.logout()
    await router.push('/materiais')
    expect(router.currentRoute.value.name).toBe('login')
  })
})
