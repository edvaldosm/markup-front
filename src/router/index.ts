import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
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
      children: [
        { path: '', redirect: '/dashboard' },
        { path: 'dashboard', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
        { path: 'empresa', name: 'empresa', component: () => import('@/views/EmpresaView.vue') },
        { path: 'materiais', name: 'materiais', component: () => import('@/views/MateriaisView.vue') },
        { path: 'despesas', name: 'despesas', component: () => import('@/views/DespesasFixasView.vue') },
        { path: 'impostos', name: 'impostos', component: () => import('@/views/ImpostosView.vue') },
        { path: 'produtos', name: 'produtos', component: () => import('@/views/ProdutosView.vue') },
        { path: 'produtos/:id', name: 'produto-detalhe', component: () => import('@/views/ProdutoDetalheView.vue') },
        { path: 'precificacao', name: 'precificacao', component: () => import('@/views/PrecificacaoView.vue') },
        { path: 'fator-r', name: 'fator-r', component: () => import('@/views/FatorRView.vue') },
        { path: 'relatorios', name: 'relatorios', component: () => import('@/views/RelatoriosView.vue') },
        { path: 'usuarios', name: 'usuarios', component: () => import('@/views/UsuariosView.vue') },
        { path: 'perfis', name: 'perfis', component: () => import('@/views/PerfisView.vue') },
      ]
    },
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
  ]
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.user) {
    return { name: 'login' }
  }
})

export default router
