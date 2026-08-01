/**
 * Porta **única** de saída de documento do front ([[FR11-relatorio-vem-do-backend]]).
 *
 * Quem gera relatório é o módulo `com.markup.reports` do backend, com
 * JasperReports (Artigo B12). Aqui só pedimos e entregamos o arquivo ao usuário —
 * nenhuma biblioteca de PDF entra no bundle.
 *
 * Enquanto `MOCK_MODE = true`, cai na impressão do navegador (`window.print()` +
 * a camada `@media print`). É stopgap **datado** do protótipo, igual ao cálculo
 * em `useMarkupCalculator`: sai no dia em que o backend responder.
 */
import { MOCK_MODE, GQL_ENDPOINT } from './client'

/** Espelha o `ReportCatalog` do backend — sem entrada no catálogo, não há relatório */
export type TipoRelatorio =
  | 'FICHA_TECNICA_PRODUTO'
  | 'LISTA_PRECIFICACAO'
  | 'DESPESAS_FIXAS'
  | 'GESTAO_EMPRESAS_USUARIOS'

/**
 * `POST /api/relatorios/{tipo}` → `application/pdf`. Deriva do endpoint GraphQL
 * (mesmo host, mesmo JWT); `VITE_REPORT_ENDPOINT` sobrescreve quando necessário.
 */
export const REPORT_ENDPOINT: string =
  import.meta.env.VITE_REPORT_ENDPOINT ?? GQL_ENDPOINT.replace(/\/graphql\/?$/, '/api/relatorios')

const NOME_ARQUIVO: Record<TipoRelatorio, string> = {
  FICHA_TECNICA_PRODUTO: 'ficha-tecnica',
  LISTA_PRECIFICACAO: 'lista-precificacao',
  DESPESAS_FIXAS: 'despesas-fixas',
  GESTAO_EMPRESAS_USUARIOS: 'gestao-empresas-usuarios',
}

/** Por onde o documento saiu — o teste e a UI precisam distinguir */
export type OrigemRelatorio = 'backend-jasper' | 'impressao-local'

export interface ResultadoRelatorio {
  origem: OrigemRelatorio
  nomeArquivo: string
}

export interface OpcoesRelatorio {
  /** JWT da sessão; quando o auth real existir, vem do `authStore` */
  token?: string
  /** Sobrescreve o nome sugerido do arquivo (o backend manda o dele no header) */
  nomeArquivo?: string
}

export function nomeArquivoDe(tipo: TipoRelatorio, sufixo?: string): string {
  const data = new Date().toISOString().slice(0, 10)
  return `${NOME_ARQUIVO[tipo]}${sufixo ? `-${sufixo}` : ''}-${data}.pdf`
}

/**
 * Baixa o PDF do módulo de relatórios. Exportada em separado para poder ser
 * testada sem depender do valor de `MOCK_MODE`.
 */
export async function baixarRelatorioDoBackend(
  tipo: TipoRelatorio,
  parametros: Record<string, string> = {},
  opcoes: OpcoesRelatorio = {},
): Promise<ResultadoRelatorio> {
  const resposta = await fetch(`${REPORT_ENDPOINT}/${tipo}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/pdf',
      ...(opcoes.token ? { Authorization: `Bearer ${opcoes.token}` } : {}),
    },
    body: JSON.stringify(parametros),
  })

  // 401/403 aqui é a autorização do backend fazendo o trabalho dela (R05/R09):
  // relatar, nunca cair num PDF montado localmente como consolo.
  if (!resposta.ok) {
    throw new Error(`Falha ao gerar o relatório (${resposta.status})`)
  }

  const blob = await resposta.blob()
  const nomeArquivo = opcoes.nomeArquivo ?? nomeArquivoDe(tipo, parametros.produtoId)

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)

  return { origem: 'backend-jasper', nomeArquivo }
}

/**
 * Gera o relatório. Com o backend ligado, pede ao módulo Jasper; em `MOCK_MODE`,
 * imprime a tela.
 */
export async function gerarRelatorioPdf(
  tipo: TipoRelatorio,
  parametros: Record<string, string> = {},
  opcoes: OpcoesRelatorio = {},
): Promise<ResultadoRelatorio> {
  if (MOCK_MODE) {
    window.print()
    return {
      origem: 'impressao-local',
      nomeArquivo: opcoes.nomeArquivo ?? nomeArquivoDe(tipo, parametros.produtoId),
    }
  }
  return baixarRelatorioDoBackend(tipo, parametros, opcoes)
}
