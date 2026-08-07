/**
 * Plugin do widget do assistente — instalado uma vez (`app.use`) no
 * `main.ts`, nunca importado tela a tela. `AssistenteWidget.vue` lê a
 * config via `inject(ASSISTENTE_OPCOES)` em vez de receber tudo por prop,
 * o que permite montá-lo uma única vez em `AppLayout.vue` (REQ-05/REQ-10).
 */
import type { App, InjectionKey } from 'vue'

export interface AssistenteOptions {
  posicao?: 'bottom-right' | 'bottom-left'
  /** Tamanho da janela deslizante do histórico exibido em tela (padrão: 10). */
  maxMensagens?: number
}

export const ASSISTENTE_OPCOES: InjectionKey<Required<AssistenteOptions>> = Symbol('assistente:opcoes')

export const AssistentePlugin = {
  install(app: App, opcoes: AssistenteOptions = {}) {
    app.provide(ASSISTENTE_OPCOES, {
      posicao: 'bottom-right',
      maxMensagens: 10,
      ...opcoes,
    })
  },
}
