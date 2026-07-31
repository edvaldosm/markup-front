import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { PermissaoChave } from '@/types'

declare module 'vue-router' {
  interface RouteMeta {
    /** Rota acessível sem login */
    public?: boolean
    requiresAuth?: boolean
    /** Permissão RBAC exigida para entrar na rota (FR07 + R05) */
    permissao?: PermissaoChave
  }
}

/**
 * Rotas protegidas. `meta.permissao` é a mesma chave usada pelo backend no
 * `@PreAuthorize` — o front só esconde/bloqueia a navegação; a autoridade
 * continua sendo o servidor.
 */
export const rotasApp: RouteRecordRaw[] = [
  { path: '', redirect: '/dashboard' },
  { path: 'dashboard', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
  { path: 'empresa', name: 'empresa', component: () => import('@/views/EmpresaView.vue'), meta: { permissao: 'EMPRESA_READ' } },
  { path: 'materiais', name: 'materiais', component: () => import('@/views/MateriaisView.vue'), meta: { permissao: 'MATERIAL_READ' } },
  { path: 'despesas', name: 'despesas', component: () => import('@/views/DespesasFixasView.vue'), meta: { permissao: 'DESPESA_READ' } },
  { path: 'impostos', name: 'impostos', component: () => import('@/views/ImpostosView.vue'), meta: { permissao: 'IMPOSTO_READ' } },
  { path: 'produtos', name: 'produtos', component: () => import('@/views/ProdutosView.vue'), meta: { permissao: 'PRODUTO_READ' } },
  { path: 'produtos/:id', name: 'produto-detalhe', component: () => import('@/views/ProdutoDetalheView.vue'), meta: { permissao: 'PRODUTO_READ' } },
  { path: 'precificacao', name: 'precificacao', component: () => import('@/views/PrecificacaoView.vue'), meta: { permissao: 'PRODUTO_READ' } },
  { path: 'fator-r', name: 'fator-r', component: () => import('@/views/FatorRView.vue'), meta: { permissao: 'EMPRESA_READ' } },
  { path: 'relatorios', name: 'relatorios', component: () => import('@/views/RelatoriosView.vue'), meta: { permissao: 'RELATORIO_READ' } },
  { path: 'usuarios', name: 'usuarios', component: () => import('@/views/UsuariosView.vue'), meta: { permissao: 'USUARIO_READ' } },
  { path: 'perfis', name: 'perfis', component: () => import('@/views/PerfisView.vue'), meta: { permissao: 'PERFIL_READ' } },
]

export const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: () => import('@/components/layout/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: rotasApp,
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
]

/**
 * Guard de navegação (FR07 + R05). Exportado para teste: recebe o destino e
 * devolve `true` (segue) ou o redirecionamento.
 */
export function guardaNavegacao(to: RouteLocationNormalized) {
  const auth = useAuthStore()

  // já logado não volta para o login
  if (to.meta.public) {
    return auth.user && to.name === 'login' ? { name: 'dashboard' } : true
  }

  if (!auth.user) return { name: 'login' }

  // RBAC: sem a permissão da rota, não entra (cai no dashboard)
  const exigida = to.meta.permissao
  if (exigida && !auth.hasPermissao(exigida)) {
    return { name: 'dashboard' }
  }

  return true
}

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(guardaNavegacao)

export default router
