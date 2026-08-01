/**
 * Porta de saída de documento (FR11 / Artigo B12).
 *
 * O que estes testes protegem: o front **não gera** documento — ele pede ao
 * módulo de relatórios do backend e entrega o arquivo. E, quando o backend nega
 * (401/403 do RBAC ou do ownership), o erro sobe: nada de "consolar" o usuário
 * com um PDF montado localmente, que é exatamente o dado que o servidor recusou.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  gerarRelatorioPdf, baixarRelatorioDoBackend, nomeArquivoDe, REPORT_ENDPOINT,
} from './relatorios'
import { MOCK_MODE } from './client'

/** Clicar numa âncora de download faria o jsdom tentar navegar — stub global */
let clickSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => 'blob:teste'),
    revokeObjectURL: vi.fn(),
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('endpoint e nome do arquivo', () => {
  it('deriva o endpoint de relatórios do endpoint GraphQL', () => {
    expect(REPORT_ENDPOINT).toMatch(/\/api\/relatorios$/)
    expect(REPORT_ENDPOINT).not.toContain('/graphql')
  })

  it('nomeia o arquivo por tipo, com data e sufixo opcional', () => {
    const hoje = new Date().toISOString().slice(0, 10)
    expect(nomeArquivoDe('FICHA_TECNICA_PRODUTO')).toBe(`ficha-tecnica-${hoje}.pdf`)
    expect(nomeArquivoDe('FICHA_TECNICA_PRODUTO', 'prod-c01'))
      .toBe(`ficha-tecnica-prod-c01-${hoje}.pdf`)
    expect(nomeArquivoDe('GESTAO_EMPRESAS_USUARIOS'))
      .toBe(`gestao-empresas-usuarios-${hoje}.pdf`)
  })
})

describe('modo protótipo (MOCK_MODE)', () => {
  it('imprime a tela em vez de chamar o backend', async () => {
    expect(MOCK_MODE, 'o protótipo roda em MOCK_MODE').toBe(true)

    const print = vi.fn()
    vi.stubGlobal('print', print)
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    const r = await gerarRelatorioPdf('FICHA_TECNICA_PRODUTO', { produtoId: 'prod-c01' })

    expect(print).toHaveBeenCalledOnce()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(r.origem).toBe('impressao-local')
    expect(r.nomeArquivo).toContain('ficha-tecnica-prod-c01')
  })
})

describe('download do módulo de relatórios do backend', () => {
  function respostaPdf() {
    return {
      ok: true,
      status: 200,
      blob: async () => new Blob(['%PDF-1.7'], { type: 'application/pdf' }),
    }
  }

  it('faz POST no tipo pedido, com JWT e Accept de PDF', async () => {
    const fetchSpy = vi.fn(async () => respostaPdf())
    vi.stubGlobal('fetch', fetchSpy)

    const r = await baixarRelatorioDoBackend(
      'FICHA_TECNICA_PRODUTO', { produtoId: 'prod-c01' }, { token: 'jwt-123' }
    )

    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(`${REPORT_ENDPOINT}/FICHA_TECNICA_PRODUTO`)
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer jwt-123')
    expect((init.headers as Record<string, string>).Accept).toBe('application/pdf')
    expect(JSON.parse(String(init.body))).toEqual({ produtoId: 'prod-c01' })
    expect(r.origem).toBe('backend-jasper')
  })

  it('entrega o arquivo ao usuário e libera o object URL', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => respostaPdf()))

    await baixarRelatorioDoBackend('LISTA_PRECIFICACAO')

    expect(clickSpy).toHaveBeenCalledOnce()
    expect(URL.createObjectURL).toHaveBeenCalledOnce()
    expect(URL.revokeObjectURL).toHaveBeenCalledOnce()
    // não deixa âncora órfã no documento
    expect(document.querySelectorAll('a[download]')).toHaveLength(0)
  })

  it('propaga a negação do backend — não imprime a tela como consolo', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 403, blob: async () => new Blob() })))
    const print = vi.fn()
    vi.stubGlobal('print', print)

    await expect(baixarRelatorioDoBackend('GESTAO_EMPRESAS_USUARIOS'))
      .rejects.toThrow('(403)')
    expect(print).not.toHaveBeenCalled()
  })

  it('sem token, vai sem o header Authorization (o backend recusa)', async () => {
    const fetchSpy = vi.fn(async () => respostaPdf())
    vi.stubGlobal('fetch', fetchSpy)

    await baixarRelatorioDoBackend('DESPESAS_FIXAS')

    const [, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit]
    expect(init.headers).not.toHaveProperty('Authorization')
  })
})
