/**
 * Porta de saída de documento (FR11 / Artigo B12).
 *
 * O que estes testes protegem: o front **não gera** documento — ele pede ao
 * módulo de relatórios do backend e entrega o arquivo (baixado ou
 * pré-visualizado). Quando o backend nega (401/403 do RBAC ou do ownership)
 * ou recusa a combinação `inline`+`XLSX` (barrada antes mesmo do request), o
 * erro sobe: nada de "consolar" o usuário com um documento montado
 * localmente, que é exatamente o dado que o servidor recusou.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  gerarRelatorioPdf, baixarRelatorioDoBackend, baixarRelatorioXlsx,
  visualizarRelatorioPdf, baixarBlobVisualizado, nomeArquivoDe, REPORT_ENDPOINT,
} from './relatorios'
import * as sessao from './sessao'

/** Clicar numa âncora de download faria o jsdom tentar navegar — stub global */
let clickSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => 'blob:teste'),
    revokeObjectURL: vi.fn(),
  })
  vi.spyOn(sessao, 'tokenDeAcesso').mockReturnValue(null)
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

  it('nomeia o arquivo por tipo e formato, com data e sufixo opcional', () => {
    const hoje = new Date().toISOString().slice(0, 10)
    expect(nomeArquivoDe('FICHA_TECNICA_PRODUTO')).toBe(`ficha-tecnica-${hoje}.pdf`)
    expect(nomeArquivoDe('FICHA_TECNICA_PRODUTO', 'PDF', 'prod-c01'))
      .toBe(`ficha-tecnica-prod-c01-${hoje}.pdf`)
    expect(nomeArquivoDe('CUSTO_MATERIAIS', 'XLSX', 'emp-01'))
      .toBe(`custo-materiais-emp-01-${hoje}.xlsx`)
    expect(nomeArquivoDe('GESTAO_EMPRESAS_USUARIOS'))
      .toBe(`gestao-empresas-usuarios-${hoje}.pdf`)
  })
})

describe('gerarRelatorioPdf — sem modo alternativo', () => {
  it('delega direto ao backend; sem módulo Jasper, o erro (404) sobe claro', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404, blob: async () => new Blob() })))
    const print = vi.fn()
    vi.stubGlobal('print', print)

    await expect(gerarRelatorioPdf('FICHA_TECNICA_PRODUTO', { produtoId: 'prod-c01' }))
      .rejects.toThrow('(404)')
    // Nunca cai em impressão local como consolo — o módulo não existe, ponto.
    expect(print).not.toHaveBeenCalled()
  })
})

describe('download do módulo de relatórios do backend', () => {
  function respostaBinaria() {
    return {
      ok: true,
      status: 200,
      blob: async () => new Blob(['%PDF-1.7'], { type: 'application/pdf' }),
    }
  }

  it('faz POST no tipo pedido, com formato/modo na query e Accept genérico', async () => {
    const fetchSpy = vi.fn(async () => respostaBinaria())
    vi.stubGlobal('fetch', fetchSpy)
    vi.spyOn(sessao, 'tokenDeAcesso').mockReturnValue('jwt-123')

    const r = await baixarRelatorioDoBackend('FICHA_TECNICA_PRODUTO', { produtoId: 'prod-c01' })

    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(`${REPORT_ENDPOINT}/FICHA_TECNICA_PRODUTO?formato=PDF&modo=DOWNLOAD`)
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer jwt-123')
    expect((init.headers as Record<string, string>).Accept).toBe('application/octet-stream')
    expect(JSON.parse(String(init.body))).toEqual({ produtoId: 'prod-c01' })
    expect(r.nomeArquivo).toContain('ficha-tecnica-prod-c01')
  })

  it('usa o JWT da sessão atual sem o caller precisar passar token', async () => {
    const fetchSpy = vi.fn(async () => respostaBinaria())
    vi.stubGlobal('fetch', fetchSpy)
    vi.spyOn(sessao, 'tokenDeAcesso').mockReturnValue('jwt-da-sessao')

    await baixarRelatorioDoBackend('LISTA_PRECIFICACAO', { empresaId: 'emp-01' })

    const [, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit]
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer jwt-da-sessao')
  })

  it('opcoes.token sobrescreve o token da sessão', async () => {
    const fetchSpy = vi.fn(async () => respostaBinaria())
    vi.stubGlobal('fetch', fetchSpy)
    vi.spyOn(sessao, 'tokenDeAcesso').mockReturnValue('jwt-da-sessao')

    await baixarRelatorioDoBackend('LISTA_PRECIFICACAO', { empresaId: 'emp-01' }, { token: 'jwt-manual' })

    const [, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit]
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer jwt-manual')
  })

  it('baixarRelatorioXlsx pede formato=XLSX, modo=download', async () => {
    const fetchSpy = vi.fn(async () => respostaBinaria())
    vi.stubGlobal('fetch', fetchSpy)

    const r = await baixarRelatorioXlsx('CUSTO_MATERIAIS', { empresaId: 'emp-01' })

    const [url] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(`${REPORT_ENDPOINT}/CUSTO_MATERIAIS?formato=XLSX&modo=DOWNLOAD`)
    expect(r.nomeArquivo).toBe(nomeArquivoDe('CUSTO_MATERIAIS', 'XLSX', 'emp-01'))
  })

  it('entrega o arquivo ao usuário e libera o object URL', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => respostaBinaria()))

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

  it('sem sessão, vai sem o header Authorization (o backend recusa)', async () => {
    const fetchSpy = vi.fn(async () => respostaBinaria())
    vi.stubGlobal('fetch', fetchSpy)
    vi.spyOn(sessao, 'tokenDeAcesso').mockReturnValue(null)

    await baixarRelatorioDoBackend('DESPESAS_FIXAS')

    const [, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit]
    expect(init.headers).not.toHaveProperty('Authorization')
  })
})

describe('visualizarRelatorioPdf — pré-visualização inline', () => {
  it('pede modo=inline, formato=PDF e devolve o blobUrl sem baixar', async () => {
    const fetchSpy = vi.fn(async () => ({
      ok: true,
      status: 200,
      blob: async () => new Blob(['%PDF-1.7'], { type: 'application/pdf' }),
    }))
    vi.stubGlobal('fetch', fetchSpy)

    const r = await visualizarRelatorioPdf('FICHA_TECNICA_PRODUTO', { produtoId: 'prod-c01' })

    const [url] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(`${REPORT_ENDPOINT}/FICHA_TECNICA_PRODUTO?formato=PDF&modo=INLINE`)
    expect(r.blobUrl).toBe('blob:teste')
    expect(r.nomeArquivo).toContain('ficha-tecnica-prod-c01')
    // pré-visualização não é download: nenhuma âncora clicada
    expect(clickSpy).not.toHaveBeenCalled()
  })

  // A combinação inválida (`modo=inline` + `formato=XLSX`) não tem teste de
  // guarda em runtime porque é irrepresentável pela API pública:
  // `visualizarRelatorioPdf` força PDF, `baixarRelatorioDoBackend` força
  // download. A guarda em `pedirRelatorio()` (não exportada) existe como
  // segunda linha de defesa para quem adicionar uma nova função de acesso —
  // ver REQ-07 do spec.
})

describe('baixarBlobVisualizado — reaproveita o blob já buscado', () => {
  it('baixa a partir do blobUrl recebido, sem nova requisição', () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)

    baixarBlobVisualizado('blob:teste', 'ficha-tecnica-prod-c01-2026-08-06.pdf')

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalledOnce()
    expect(document.querySelectorAll('a[download]')).toHaveLength(0)
  })
})
