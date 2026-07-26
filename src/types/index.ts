// ─── Domínio ─────────────────────────────────────────────────────────────────

/** Segmento de negócio — define identidade visual, rótulos e comportamento tributário */
export type SegmentoNegocio = 'CONFEITARIA' | 'INDUSTRIA' | 'SERVICOS'

export type RegimeTributario = 'SIMPLES_NACIONAL' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL' | 'MEI'
export type AnexoSimples = 'ANEXO_I' | 'ANEXO_II' | 'ANEXO_III' | 'ANEXO_IV' | 'ANEXO_V'

export interface Empresa {
  id: string
  razaoSocial: string
  cnpj: string
  segmento: SegmentoNegocio
  regimeTributario: RegimeTributario
  anexoSimples?: AnexoSimples
  faturamentoMedioMensal: number
  /** Folha de pagamento mensal (salários + pró-labore + encargos) — numerador do Fator R (serviços) */
  folhaPagamentoMensal?: number
  createdAt: string
}

export interface DespesaFixa {
  id: string
  empresaId: string
  descricao: string
  valorMensal: number
  categoria: 'ALUGUEL' | 'ENERGIA' | 'GAS' | 'INTERNET' | 'PROLABORE' | 'CONTADOR' | 'OUTRO'
  ativa: boolean
}

export type UnidadeMedida = 'KG' | 'G' | 'L' | 'ML' | 'UN' | 'CX' | 'PCT' | 'H' | 'PC' | 'TON' | 'M' | 'M2'

export interface Material {
  id: string
  empresaId: string
  nome: string
  unidade: UnidadeMedida
  custoUnitario: number
  fornecedor?: string
  estoque?: number
  /** INSUMO: matéria-prima/ingrediente. MAO_DE_OBRA: hora técnica (serviços) */
  tipo?: 'INSUMO' | 'MAO_DE_OBRA'
}

export interface Imposto {
  id: string
  nome: string
  chave: string
  aliquotaPercentual: number
  descricao: string
  ativo: boolean
}

export interface ProdutoMaterial {
  materialId: string
  material?: Material
  quantidadeUtilizada: number
  unidade: string
}

export interface ProdutoImposto {
  impostoId: string
  imposto?: Imposto
  aliquotaPercentual: number
}

export interface Produto {
  id: string
  empresaId: string
  nome: string
  descricao?: string
  categoria?: string
  /** PRODUTO: item físico vendido. SERVICO: serviço prestado (precificado por hora/projeto) */
  tipo?: 'PRODUTO' | 'SERVICO'
  margemLucro: number
  descontoMaximo: number
  ativo: boolean
  materiais: ProdutoMaterial[]
  impostos: ProdutoImposto[]
  createdAt: string
}

export interface ResultadoPrecificacao {
  custoBase: number
  percentualImpostos: number
  percentualDespesasFixas: number
  percentualMargemLucro: number
  percentualDesconto: number
  somaTotalPercentuais: number
  divisorMarkup: number
  precoVenda: number
  /** Fator R (%) — apenas serviços no Simples: folha / faturamento */
  fatorR?: number
  /** Anexo efetivamente aplicado após avaliar o Fator R */
  anexoAplicado?: AnexoSimples
  breakdown: {
    custoRecuperado: number
    valorImpostos: number
    valorDespesasFixas: number
    valorDesconto: number
    lucroLiquido: number
  }
}

// ─── Usuários / RBAC ──────────────────────────────────────────────────────────

export type PermissaoChave =
  | 'PRODUTO_READ' | 'PRODUTO_WRITE'
  | 'MATERIAL_READ' | 'MATERIAL_WRITE'
  | 'DESPESA_READ' | 'DESPESA_WRITE'
  | 'IMPOSTO_READ' | 'IMPOSTO_WRITE'
  | 'RELATORIO_READ'
  | 'USUARIO_READ' | 'USUARIO_WRITE'
  | 'EMPRESA_READ' | 'EMPRESA_WRITE'
  | 'PERFIL_READ' | 'PERFIL_WRITE'

export interface Permissao {
  id: string
  chave: PermissaoChave
  descricao: string
  modulo: string
}

export interface Perfil {
  id: string
  nome: string
  descricao: string
  permissoes: Permissao[]
}

export interface Usuario {
  id: string
  nome: string
  email: string
  avatarUrl?: string
  ativo: boolean
  empresas: { empresaId: string; empresa?: Empresa; perfilId: string; perfil?: Perfil }[]
  createdAt: string
}

// ─── GraphQL helpers ──────────────────────────────────────────────────────────

export interface PageInfo {
  hasNextPage: boolean
  hasPreviousPage: boolean
  totalCount: number
}

export interface PaginatedResult<T> {
  nodes: T[]
  pageInfo: PageInfo
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  nome: string
  email: string
  avatarUrl?: string
  perfil: Perfil
  empresa: Empresa
}
