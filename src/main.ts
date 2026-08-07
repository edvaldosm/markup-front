import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { definirAoPerderSessao } from './graphql/client'
import { useAuthStore } from './stores/auth'
import { useEmpresaStore } from './stores/empresa'
import { AssistentePlugin } from './plugins/assistente'
import './assets/main.css'

async function iniciar() {
  const app = createApp(App)
  app.use(createPinia())
  // Instalado uma única vez — o widget é montado globalmente em AppLayout.vue,
  // nunca importado tela a tela (assistente-chat-plugavel, REQ-05/REQ-10).
  app.use(AssistentePlugin, { posicao: 'bottom-right', maxMensagens: 10 })

  /**
   * A camada GraphQL não conhece o router — importá-lo lá fecharia o ciclo
   * client → router → stores → client. Ela avisa que a sessão caiu; quem navega
   * é o app.
   */
  definirAoPerderSessao(() => {
    router.push({ name: 'login', query: { expirada: '1' } })
  })

  /**
   * Restaura a sessão **antes de instalar o router** (REQ-02).
   *
   * `app.use(router)` já dispara a navegação inicial: instalando primeiro, o
   * guard avaliaria a rota com `user = null` e mandaria para o login quem tinha
   * refresh válido. Esperar só o `mount` não resolve — a corrida está no
   * `use`, não no `mount`.
   */
  const sessaoRestaurada = await useAuthStore().restaurarSessao()

  /**
   * As empresas fazem parte do boot, não da tela: o perfil efetivo vem do
   * vínculo da **empresa ativa** (REQ-09), e o guard consulta esse perfil. Sem
   * elas carregadas, todo F5 numa rota com permissão cairia no dashboard — o
   * usuário estaria logado, mas jogado para fora da tela em que estava.
   */
  if (sessaoRestaurada) await useEmpresaStore().fetchEmpresas()

  app.use(router)
  await router.isReady()
  app.mount('#app')
}

void iniciar()
