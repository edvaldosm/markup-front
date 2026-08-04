// ─── Domínio ─────────────────────────────────────────────────────────────────

/** Segmento de negócio — define identidade visual, rótulos e comportamento tributário */
export type SegmentoNegocio = 'CONFEITARIA' | 'INDUSTRIA' | 'SERVICOS' | 'COMERCIO'

export type RegimeTributario = 'SIMPLES_NACIONAL' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL' | 'MEI'
export type AnexoSimples = 'ANEXO_I' | 'ANEXO_II' | 'ANEXO_III' | 'ANEXO_IV' | 'ANEXO_V'

export interface Empresa {
  id: string
  razaoSocial: string
  cnpj?: string
  segmento: SegmentoNegocio
  regimeTributario: RegimeTributario
  /**
   * Anexo informado no cadastro. Para serviços no Simples ele é apenas o ponto
   * de partida: o anexo que vale é derivado do Fator R e vem em
   * `ResultadoPrecificacao.anexoAplicado` (B10).
   */
  anexoCadastrado?: AnexoSimples
  faturamentoMedioMensal: number
  /** Folha de pagamento mensal (salários + pró-labore + encargos) — numerador do Fator R (serviços) */
  folhaPagamentoMensal?: number
  /** Rateio das despesas fixas sobre o faturamento (C2) — **calculado pelo backend** (B1) */
  percentualDespesasFixas: number
  /** Dono da empresa — o usuário que a cadastrou (R09). No backend: `dono_usuario_id` */
  donoUsuarioId: string
  // `despesasFixas` existe no schema como campo aninhado de Empresa; o front
  // continua lendo-as pelo store próprio (`despesasFixas(empresaId)`) até a
  // fatia 2 da integração, então não é espelhado aqui ainda.
}

/** Campos que o front envia ao salvar uma empresa — espelha `EmpresaInput`. */
export type EmpresaEntrada = Omit<
  Empresa,
  'id' | 'donoUsuarioId' | 'percentualDespesasFixas'
> & { id?: string }

export type CategoriaDespesa =
  | 'ALUGUEL' | 'ENERGIA' | 'GAS' | 'INTERNET' | 'PROLABORE' | 'CONTADOR' | 'OUTRO'

/**
 * Nenhum destes tipos tem `empresaId`: a empresa é **argumento da consulta**
 * (`materiais(empresaId:)`), não atributo do registro. O servidor devolve o
 * conjunto já autorizado (B2/B9), e guardar o id de volta no objeto só serviria
 * para o front refazer um filtro que não é dele.
 */
export interface DespesaFixa {
  id: string
  descricao: string
  valorMensal: number
  categoria: CategoriaDespesa
  ativa: boolean
}

export type UnidadeMedida = 'KG' | 'G' | 'L' | 'ML' | 'UN' | 'CX' | 'PCT' | 'H' | 'PC' | 'TON' | 'M' | 'M2'

/** INSUMO: matéria-prima/ingrediente. MAO_DE_OBRA: hora técnica (serviços) */
export type TipoMaterial = 'INSUMO' | 'MAO_DE_OBRA'

export interface Material {
  id: string
  nome: string
  unidade: UnidadeMedida
  custoUnitario: number
  fornecedor?: string
  /** Descritivo; não entra em cálculo */
  estoque?: number
  tipo: TipoMaterial
}

export interface Imposto {
  id: string
  nome: string
  chave: string
  aliquotaPercentual: number
  descricao?: string
  ativo: boolean
}

/**
 * Um item da ficha técnica traz o **material inteiro**, resolvido pelo servidor.
 *
 * Antes o front guardava `materialId` e cruzava contra a lista em memória — e
 * quando o material não estava lá, o item era ignorado em silêncio, subestimando
 * o custo. No backend isso é erro explícito (guarda V6); aqui, deixa de existir.
 */
export interface ItemFichaTecnica {
  material: Material
  quantidadeUtilizada: number
  unidade: UnidadeMedida
}

/** PRODUTO: item físico vendido. SERVICO: serviço prestado (hora/projeto) */
export type TipoProduto = 'PRODUTO' | 'SERVICO'

export interface Produto {
  id: string
  nome: string
  descricao?: string
  /** Agrupamento de catálogo, sem efeito no preço */
  categoria?: string
  tipo: TipoProduto
  margemLucro: number
  descontoMaximo: number
  /**
   * Somente leitura: `ProdutoInput` não tem o campo e não há mutation de
   * alternância — pendência registrada para o markup-back.
   */
  ativo: boolean
  ficha: ItemFichaTecnica[]
  /** Impostos vinculados; a alíquota é a **do cadastro**, não uma cópia por produto */
  impostos: Imposto[]
  /** Calculado pelo servidor — C1 (B1) */
  custoBase: number
  /** Calculado pelo servidor — C3 (B1) */
  percentualImpostos: number
}

// ─── Entradas de escrita (espelham os `input` do schema) ──────────────────────
//
// Toda escrita declara `empresaId`, pelo mesmo motivo das consultas: a empresa é
// argumento do cliente, nunca estado implícito de sessão. `id` nulo = criação.

export interface ItemFichaTecnicaEntrada {
  materialId: string
  quantidadeUtilizada: number
  unidade: UnidadeMedida
}

export interface ProdutoEntrada {
  id?: string
  empresaId: string
  nome: string
  descricao?: string
  categoria?: string
  tipo: TipoProduto
  margemLucro: number
  descontoMaximo: number
  ficha: ItemFichaTecnicaEntrada[]
  /** Referência, não cópia: a alíquota vem do imposto cadastrado */
  impostoIds: string[]
}

export interface MaterialEntrada {
  id?: string
  empresaId: string
  nome: string
  unidade: UnidadeMedida
  custoUnitario: number
  fornecedor?: string
  tipo?: TipoMaterial
  estoque?: number
}

export interface ImpostoEntrada {
  id?: string
  empresaId: string
  chave: string
  nome: string
  descricao?: string
  aliquotaPercentual: number
  ativo: boolean
}

export interface DespesaFixaEntrada {
  id?: string
  empresaId: string
  descricao: string
  valorMensal: number
  categoria: CategoriaDespesa
  ativa: boolean
}

/**
 * Saída de `precificarProduto`/`precificarTodos` — **calculada inteiramente
 * pelo backend** (`CalculadoraDeMarkup.java`, C1–C12). O front não reimplementa
 * nenhuma parte disto; ver Artigo III v2.5.0 da Constituição.
 */
export interface ResultadoPrecificacao {
  produto: Produto
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
  faixaNegociacao: FaixaNegociacao
}

/** Um ponto da faixa de negociação: quanto se pratica e o que sobra (C10–C12) */
export interface DegrauDesconto {
  /** Desconto aplicado sobre o preço de tabela (%) */
  desconto: number
  /** Preço praticado = PV × (1 − desconto/100) */
  preco: number
  /** Lucro no preço praticado — a reserva não usada vira lucro */
  lucro: number
  /** Lucro como % do preço praticado */
  margemEfetiva: number
}

/**
 * Faixa de negociação de um produto: do preço de tabela (desconto 0%) ao piso
 * (desconto máximo previsto). Dentro dela a margem de lucro está preservada,
 * porque `D` já foi reservado no divisor do markup.
 */
export interface FaixaNegociacao {
  /** Sempre 0 — o preço de tabela é o teto (o domínio não tem desconto mínimo) */
  descontoMinimo: number
  /** `produto.descontoMaximo` (D) */
  descontoMaximo: number
  precoTabela: number
  /** Piso: preço no desconto máximo — abaixo dele o desconto come a margem */
  precoMinimo: number
  /** Quanto o vendedor pode conceder em reais, no máximo */
  economiaMaxima: number
  /** Lucro vendendo sem desconto = PV × (ML + D)/100 */
  lucroNoTeto: number
  /** Lucro vendendo no piso = PV × ML/100 — a margem-alvo, intacta */
  lucroNoPiso: number
  degraus: DegrauDesconto[]
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
  /**
   * Escopo global (R09): o perfil ADMIN enxerga e opera **todas** as empresas,
   * ignorando dono/compartilhamento. `false` ⇒ escopo por empresa.
   */
  escopoGlobal: boolean
}

/** Vínculo explícito usuário↔empresa (no backend: tabela `USUARIO_EMPRESA`) */
/**
 * Referência por id de propósito: o objeto `Empresa` completo vem de
 * `minhasEmpresas`/`todasEmpresas`, para o payload de usuário não arrastar o
 * cadastro inteiro a cada vínculo. Resolver `empresaId` contra uma lista já
 * buscada é o uso pretendido do contrato — não é dado faltando.
 */
export interface VinculoEmpresa {
  empresaId: string
  perfil: Perfil
}

export interface Usuario {
  id: string
  nome: string
  email: string
  ativo: boolean
  empresas: VinculoEmpresa[]
  /**
   * Perfil de escopo global, sem empresa (R09) — só o ADMIN de suporte tem.
   * Quando presente, prevalece sobre o perfil dos vínculos.
   */
  perfilGlobal?: Perfil
}

// ─── Gestão do Site (escopo global — B9/F10) ───────────────────────────────────

/** Um membro da equipe de uma empresa: quem é, com que perfil e se é o dono */
export interface MembroEquipe {
  usuario: Usuario
  /** Nulo quando o vínculo não resolve perfil (estado inconsistente a exibir, não esconder) */
  perfil: Perfil | null
  dono: boolean
}

/**
 * Empresa vista pelo gestor do site — **composta pelo servidor**
 * (`todasEmpresas`/`empresaAdmin`), não montada no front cruzando listas.
 */
export interface EmpresaAdmin {
  empresa: Empresa
  dono: Usuario | null
  totalUsuarios: number
  equipe: MembroEquipe[]
}

/** Indicadores da base — `metricasDaBase`, calculados pelo servidor */
export interface MetricasBase {
  totalEmpresas: number
  totalUsuarios: number
  usuariosAtivos: number
  totalVinculos: number
  faturamentoTotal: number
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
//
// Não existe um tipo de "usuário da sessão" separado: o autenticado é o mesmo
// `Usuario` que o backend descreve. O perfil não cabe nele porque **não é
// atributo do usuário** — depende da empresa ativa (`perfilEfetivo`, REQ-09).
