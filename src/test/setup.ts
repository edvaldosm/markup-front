/**
 * Setup global do vitest (jsdom).
 * jsdom não implementa IntersectionObserver, usado por `usePaginacao` —
 * o stub deixa as telas com lista montarem sem quebrar.
 */
import { vi } from 'vitest'

class IntersectionObserverStub implements IntersectionObserver {
  readonly root = null
  readonly rootMargin = ''
  readonly thresholds: ReadonlyArray<number> = []
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn(() => [])
}

vi.stubGlobal('IntersectionObserver', IntersectionObserverStub)
