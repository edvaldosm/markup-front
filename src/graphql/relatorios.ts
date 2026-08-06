/**
 * Porta **única** de saída de documento do front ([[FR11-relatorio-vem-do-backend]]).
 *
 * Quem gera relatório é o módulo `com.markup.reports` do backend, com
 * JasperReports (Artigo B12): `POST /api/relatorios/{tipo}`, catálogo fechado
 * de 5 tipos, `formato` (PDF/XLSX) e `modo` (download/inline — inline só com
 * PDF) como query string. Aqui só pedimos e entregamos o binário ao usuário —
 * nenhuma biblioteca de PDF entra no bundle, e nenhum fallback local existe:
 * negação ou erro do backend sobe como mensagem, nunca como documento montado
 * no navegador como consolo.
 */
import { GQL_ENDPOINT } from './client'
import { tokenDeAcesso } from './sessao'

/** Espelha o catálogo fechado do backend — sem entrada aqui, não há relatório */
export type TipoRelatorio =
  | 'FICHA_TECNICA_PRODUTO'
  | 'LISTA_PRECIFICACAO'
  | 'DESPESAS_FIXAS'
  | 'CUSTO_MATERIAIS'
  | 'GESTAO_EMPRESAS_USUARIOS'

export type FormatoRelatorio = 'PDF' | 'XLSX'
export type ModoRelatorio = 'DOWNLOAD' | 'INLINE'

/**
 * `POST /api/relatorios/{tipo}` → binário. Deriva do endpoint GraphQL
 * (mesmo host, mesmo JWT); `VITE_REPORT_ENDPOINT` sobrescreve quando necessário.
 */
export const REPORT_ENDPOINT: string =
  import.meta.env.VITE_REPORT_ENDPOINT ?? GQL_ENDPOINT.replace(/\/graphql\/?$/, '/api/relatorios')

const NOME_ARQUIVO: Record<TipoRelatorio, string> = {
  FICHA_TECNICA_PRODUTO: 'ficha-tecnica',
  LISTA_PRECIFICACAO: 'lista-precificacao',
  DESPESAS_FIXAS: 'despesas-fixas',
  CUSTO_MATERIAIS: 'custo-materiais',
  GESTAO_EMPRESAS_USUARIOS: 'gestao-empresas-usuarios',
}

const EXTENSAO: Record<FormatoRelatorio, string> = { PDF: 'pdf', XLSX: 'xlsx' }

export interface ResultadoRelatorio {
  nomeArquivo: string
}

/** Saída de `visualizarRelatorioPdf` — quem recebe é dono do Object URL. */
export interface ResultadoRelatorioInline extends ResultadoRelatorio {
  /** `URL.createObjectURL` do blob recebido; revogar (`URL.revokeObjectURL`) ao fechar a pré-visualização. */
  blobUrl: string
}

export interface OpcoesRelatorio {
  /** Sobrescreve o JWT da sessão (`tokenDeAcesso()`); usado sobretudo em teste. */
  token?: string
  /** Sobrescreve o nome sugerido do arquivo (o backend manda o dele no header) */
  nomeArquivo?: string
}

export function nomeArquivoDe(tipo: TipoRelatorio, formato: FormatoRelatorio = 'PDF', sufixo?: string): string {
  const data = new Date().toISOString().slice(0, 10)
  return `${NOME_ARQUIVO[tipo]}${sufixo ? `-${sufixo}` : ''}-${data}.${EXTENSAO[formato]}`
}

function sufixoDe(parametros: Record<string, string>): string | undefined {
  return parametros.produtoId ?? parametros.empresaId
}

/**
 * Única chamada de rede da porta. `modo=inline` com `formato=XLSX` é recusado
 * pelo backend (400) — barrado aqui antes do `fetch`, para o erro não depender
 * de round-trip (REQ-07 de `integracao-backend-relatorios/spec.md`).
 */
async function pedirRelatorio(
  tipo: TipoRelatorio,
  formato: FormatoRelatorio,
  modo: ModoRelatorio,
  parametros: Record<string, string>,
  opcoes: OpcoesRelatorio,
): Promise<Blob> {
  if (modo === 'INLINE' && formato !== 'PDF') {
    throw new Error('Pré-visualização em tela só existe para PDF — XLSX é sempre baixado.')
  }

  const token = opcoes.token ?? tokenDeAcesso()

  const resposta = await fetch(`${REPORT_ENDPOINT}/${tipo}?formato=${formato}&modo=${modo}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/octet-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(parametros),
  })

  // 401/403 é a autorização do backend fazendo o trabalho dela (R05/R09); 404
  // é tipo fora do catálogo ou dado fora do escopo autorizado. Os dois casos:
  // relatar, nunca cair num documento montado localmente como consolo.
  if (!resposta.ok) {
    throw new Error(`Falha ao gerar o relatório (${resposta.status})`)
  }

  return resposta.blob()
}

function dispararDownload(blob: Blob, nomeArquivo: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/**
 * Baixa o relatório do módulo do backend, em PDF (padrão) ou XLSX — sempre
 * `modo=download`, forçando o "Salvar Como".
 */
export async function baixarRelatorioDoBackend(
  tipo: TipoRelatorio,
  parametros: Record<string, string> = {},
  opcoes: OpcoesRelatorio & { formato?: FormatoRelatorio } = {},
): Promise<ResultadoRelatorio> {
  const formato = opcoes.formato ?? 'PDF'
  const blob = await pedirRelatorio(tipo, formato, 'DOWNLOAD', parametros, opcoes)
  const nomeArquivo = opcoes.nomeArquivo ?? nomeArquivoDe(tipo, formato, sufixoDe(parametros))
  dispararDownload(blob, nomeArquivo)
  return { nomeArquivo }
}

/** Atalho: XLSX é sempre baixado — nunca há pré-visualização (regra do backend, FR11). */
export async function baixarRelatorioXlsx(
  tipo: TipoRelatorio,
  parametros: Record<string, string> = {},
  opcoes: OpcoesRelatorio = {},
): Promise<ResultadoRelatorio> {
  return baixarRelatorioDoBackend(tipo, parametros, { ...opcoes, formato: 'XLSX' })
}

/**
 * Pede o PDF em `modo=inline`, para pré-visualização em modal — não dispara
 * download. Quem chama é dono do `blobUrl`: revogar ao fechar a modal.
 */
export async function visualizarRelatorioPdf(
  tipo: TipoRelatorio,
  parametros: Record<string, string> = {},
  opcoes: OpcoesRelatorio = {},
): Promise<ResultadoRelatorioInline> {
  const blob = await pedirRelatorio(tipo, 'PDF', 'INLINE', parametros, opcoes)
  const nomeArquivo = opcoes.nomeArquivo ?? nomeArquivoDe(tipo, 'PDF', sufixoDe(parametros))
  return { nomeArquivo, blobUrl: URL.createObjectURL(blob) }
}

/**
 * Baixa o mesmo blob já aberto numa pré-visualização — sem requisição nova
 * (REQ-05: a modal reaproveita o que `visualizarRelatorioPdf` já buscou).
 */
export function baixarBlobVisualizado(blobUrl: string, nomeArquivo: string): void {
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  link.remove()
}

/** Compat: PDF sempre baixado direto, sem pré-visualização — usado onde a modal não existe. */
export async function gerarRelatorioPdf(
  tipo: TipoRelatorio,
  parametros: Record<string, string> = {},
  opcoes: OpcoesRelatorio = {},
): Promise<ResultadoRelatorio> {
  return baixarRelatorioDoBackend(tipo, parametros, { ...opcoes, formato: 'PDF' })
}
