import { ref, computed, watch, onUnmounted } from 'vue'
import type { Ref, ComputedRef } from 'vue'

interface UsePaginacaoOptions {
  /**
   * Tamanho da página inicial e de cada carregamento subsequente.
   * Em produção este valor virá da query GraphQL (first: pageSize).
   * Default: 10
   */
  pageSize?: number
  /**
   * Delay artificial em ms para simular latência de rede no mock (padrão 1200ms).
   * Remover quando integrar com GraphQL real.
   */
  mockDelay?: number
}

export function usePaginacao<T>(
  source: Ref<T[]> | ComputedRef<T[]>,
  options: UsePaginacaoOptions = {}
) {
  const { pageSize = 10, mockDelay = 1200 } = options

  const pagina = ref(1)
  const carregandoMais = ref(false)
  const sentinelaEl = ref<HTMLElement | null>(null)

  // Itens visíveis = fatia da fonte até a página atual
  const itensVisiveis = computed(() => source.value.slice(0, pagina.value * pageSize))
  const temMais = computed(() => itensVisiveis.value.length < source.value.length)
  const totalItens = computed(() => source.value.length)

  async function carregarMais() {
    if (carregandoMais.value || !temMais.value) return
    carregandoMais.value = true
    // Simula latência de rede — substituir por cursor GraphQL em produção:
    // const { data } = await useQuery(LIST_QUERY, { first: pageSize, after: cursor })
    await new Promise(r => setTimeout(r, mockDelay))
    pagina.value++
    carregandoMais.value = false
  }

  function resetar() {
    pagina.value = 1
    carregandoMais.value = false
  }

  // Reinicia paginação quando a fonte mudar (ex.: busca/filtro)
  watch(source, () => resetar(), { deep: false })

  // IntersectionObserver: dispara carregarMais quando a sentinela entra na viewport
  let observer: IntersectionObserver | null = null

  function observar(el: HTMLElement | null) {
    if (observer) observer.disconnect()
    if (!el) return
    observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) carregarMais() },
      { threshold: 0.1 }
    )
    observer.observe(el)
  }

  watch(sentinelaEl, (el) => observar(el))

  onUnmounted(() => observer?.disconnect())

  return {
    itensVisiveis,
    temMais,
    carregandoMais,
    totalItens,
    pagina,
    pageSize,
    sentinelaEl,
    carregarMais,
    resetar,
  }
}
