/**
 * Estado de tela para pedir relatório ao backend (FR11) — usado por toda
 * superfície que gera documento (ficha de produto, Relatórios, Gestão do
 * Site). Fica fora do Pinia de propósito: é estado efêmero de uma ação de UI
 * (carregando/erro/modal aberta), não domínio compartilhado entre telas.
 */
import { ref } from 'vue'
import {
  baixarRelatorioDoBackend, visualizarRelatorioPdf, baixarBlobVisualizado,
  type TipoRelatorio, type FormatoRelatorio,
} from '@/graphql/relatorios'

export interface PdfAberto {
  url: string
  nomeArquivo: string
}

export function useRelatorio() {
  const carregando = ref(false)
  const erro = ref<string | null>(null)
  /** Preenchido enquanto a modal de pré-visualização está aberta. */
  const pdfAberto = ref<PdfAberto | null>(null)

  function mensagemDeErro(e: unknown): string {
    return e instanceof Error ? e.message : 'Falha ao gerar o relatório.'
  }

  /** Abre a pré-visualização em modal (PDF, `modo=inline`). */
  async function visualizarPdf(tipo: TipoRelatorio, parametros: Record<string, string> = {}): Promise<void> {
    carregando.value = true
    erro.value = null
    try {
      const r = await visualizarRelatorioPdf(tipo, parametros)
      // Troca de relatório sem fechar: revoga o blob anterior antes de guardar o novo.
      if (pdfAberto.value) URL.revokeObjectURL(pdfAberto.value.url)
      pdfAberto.value = { url: r.blobUrl, nomeArquivo: r.nomeArquivo }
    } catch (e) {
      erro.value = mensagemDeErro(e)
    } finally {
      carregando.value = false
    }
  }

  /** Fecha a modal e libera o Object URL — nunca vaza memória entre relatórios. */
  function fecharPdf(): void {
    if (pdfAberto.value) URL.revokeObjectURL(pdfAberto.value.url)
    pdfAberto.value = null
  }

  /** Baixa o PDF já pré-visualizado, sem nova requisição ao backend. */
  function baixarPdfAberto(): void {
    if (!pdfAberto.value) return
    baixarBlobVisualizado(pdfAberto.value.url, pdfAberto.value.nomeArquivo)
  }

  /** Baixa direto (sem pré-visualização) — PDF ou XLSX, `modo=download`. */
  async function baixar(
    tipo: TipoRelatorio,
    formato: FormatoRelatorio,
    parametros: Record<string, string> = {},
  ): Promise<void> {
    carregando.value = true
    erro.value = null
    try {
      await baixarRelatorioDoBackend(tipo, parametros, { formato })
    } catch (e) {
      erro.value = mensagemDeErro(e)
    } finally {
      carregando.value = false
    }
  }

  return { carregando, erro, pdfAberto, visualizarPdf, fecharPdf, baixarPdfAberto, baixar }
}
