import type { SegmentoNegocio } from '@/types'

/**
 * Identidade visual e rótulos por segmento de negócio.
 * Fonte única da verdade para ícones, cores e nomenclatura contextual
 * (um "material" em serviços é uma "hora técnica"; um "produto" é um "serviço").
 */
export interface SegmentoConfig {
  chave: SegmentoNegocio
  nome: string
  /** Emoji-ícone com significado direto ao segmento */
  icone: string
  /** Ícone SVG (path) para uso em contextos monocromáticos */
  descricao: string
  /** Cor de acento (hex) usada em pills, badges e realces */
  cor: string
  corSuave: string
  gradiente: [string, string]
  /** Rótulos contextuais de UI */
  rotulos: {
    produto: string
    produtos: string
    material: string
    /** Plural gramaticalmente correto do rótulo de material (para contadores) */
    materialPlural: string
    materiais: string
    fichaTecnica: string
    unidadePrincipal: string
  }
}

export const SEGMENTOS: Record<SegmentoNegocio, SegmentoConfig> = {
  CONFEITARIA: {
    chave: 'CONFEITARIA',
    nome: 'Confeitaria',
    icone: '🧁',
    descricao: 'Doces, bolos e confeitaria artesanal',
    cor: '#db2777',       // rosa/magenta
    corSuave: '#fce7f3',
    gradiente: ['#f472b6', '#db2777'],
    rotulos: {
      produto: 'Produto',
      produtos: 'Produtos',
      material: 'Ingrediente',
      materialPlural: 'Ingredientes',
      materiais: 'Ingredientes & Insumos',
      fichaTecnica: 'Ficha Técnica',
      unidadePrincipal: 'KG',
    },
  },
  INDUSTRIA: {
    chave: 'INDUSTRIA',
    nome: 'Indústria',
    icone: '🏭',
    descricao: 'Fabricação e transformação industrial',
    cor: '#0284c7',       // azul aço
    corSuave: '#e0f2fe',
    gradiente: ['#38bdf8', '#0284c7'],
    rotulos: {
      produto: 'Produto',
      produtos: 'Produtos Fabricados',
      material: 'Matéria-prima',
      materialPlural: 'Matérias-primas',
      materiais: 'Matérias-primas & Insumos',
      fichaTecnica: 'Ficha de Produção',
      unidadePrincipal: 'UN',
    },
  },
  SERVICOS: {
    chave: 'SERVICOS',
    nome: 'Serviços',
    icone: '🛠️',
    descricao: 'Prestação de serviços (consultoria, TI, engenharia)',
    cor: '#059669',       // verde/teal
    corSuave: '#d1fae5',
    gradiente: ['#34d399', '#059669'],
    rotulos: {
      produto: 'Serviço',
      produtos: 'Serviços',
      material: 'Custo direto',
      materialPlural: 'Custos diretos',
      materiais: 'Mão de obra & Custos diretos',
      fichaTecnica: 'Composição do Serviço',
      unidadePrincipal: 'H',
    },
  },
  COMERCIO: {
    chave: 'COMERCIO',
    nome: 'Comércio',
    icone: '🏬',
    descricao: 'Revenda de mercadorias (varejo e atacado)',
    cor: '#d97706',       // âmbar
    corSuave: '#fef3c7',
    gradiente: ['#fbbf24', '#d97706'],
    rotulos: {
      // Comércio revende: o custo é o de aquisição, não uma composição de
      // insumos. A "ficha" existe para casos de kit/cesta, com uma linha só.
      produto: 'Mercadoria',
      produtos: 'Mercadorias',
      material: 'Custo de aquisição',
      materialPlural: 'Custos de aquisição',
      materiais: 'Mercadorias & Custos de aquisição',
      fichaTecnica: 'Composição da Mercadoria',
      unidadePrincipal: 'UN',
    },
  },
}

export function segmentoConfig(seg: SegmentoNegocio | undefined): SegmentoConfig {
  return SEGMENTOS[seg ?? 'CONFEITARIA']
}
