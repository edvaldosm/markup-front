/**
 * Servidor GraphQL falso — o backend, do ponto de vista dos testes.
 *
 * Substitui `globalThis.fetch`, então **a cadeia real de links roda**: header de
 * autorização, renovação, repetição da operação, classificação de erro. Um mock
 * colocado acima disso (no store ou no cliente) testaria o teste, não o código
 * que vai para produção.
 *
 * Sem dependência nova (msw): o contrato exercitado aqui são cinco operações e
 * um cabeçalho — a superfície não paga uma biblioteca.
 *
 * As regras que ele aplica são as do backend de verdade, de propósito:
 * - só usuário **ativo** autentica;
 * - `minhasEmpresas` devolve o conjunto autorizado (dono ∪ vínculos; ADMIN ⇒
 *   todas) — a filtragem que **saiu do front** (B9) mora aqui;
 * - token ausente, expirado ou desconhecido ⇒ `UNAUTHORIZED` com **HTTP 200**,
 *   igual ao Spring for GraphQL.
 */
import { vi } from 'vitest'
import type { Empresa, Perfil, Usuario } from '@/types'
import {
  mockEmpresas, mockUsuarios, mockPerfis,
  mockMateriais, mockImpostos, mockDespesasFixas, mockProdutos,
  type MaterialRegistro, type ImpostoRegistro, type ProdutoRegistro,
  type DespesaFixaRegistro,
} from '@/test/fixtures'

/** Senha única das contas de teste — o seed de desenvolvimento usa a mesma. */
export const SENHA_PADRAO = 'markup123'

interface CorpoRequisicao {
  operationName?: string
  query?: string
  variables?: Record<string, unknown>
}

interface Sessao {
  usuarioId: string
  accessToken: string
  refreshToken: string
  /** Access marcado como vencido por `expirarAccessToken()` */
  accessExpirado: boolean
  encerrada: boolean
}

export interface ServidorFalso {
  /** Faz o próximo access token ser recusado, como se tivesse expirado. */
  expirarAccessToken(): void
  /** Invalida o refresh: a renovação passa a falhar (sessão perdida). */
  invalidarRefreshToken(): void
  /** Backend fora do ar: `fetch` passa a rejeitar. */
  derrubar(): void
  /** Volta a responder. */
  levantar(): void
  /** Quantas vezes cada operação foi chamada — prova de repetição/single-flight. */
  chamadas: Record<string, number>
  restaurar(): void
}

/**
 * `Response` de verdade, não um objeto com `json()`: o `HttpLink` do Apollo lê o
 * corpo por `text()`. Um dublê incompleto faria toda resposta virar erro de
 * rede — inclusive as bem-sucedidas.
 */
function resposta(corpo: unknown): Response {
  return new Response(JSON.stringify(corpo), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

/** Erro de domínio: o backend responde **HTTP 200** com o erro no corpo. */
function erroGraphQL(mensagem: string, classification: string): Response {
  return resposta({ errors: [{ message: mensagem, extensions: { classification } }], data: null })
}

function dados(payload: unknown): Response {
  return resposta({ data: payload })
}

/**
 * O Apollo pede `__typename` em toda seleção e normaliza o cache por ele; sem o
 * campo, os objetos voltam mutilados do cache (o sintoma é `id: undefined`).
 * O backend real responde com ele, então o servidor falso também responde.
 */
function perfilGql(perfil: Perfil | undefined) {
  if (!perfil) return null
  return {
    __typename: 'Perfil',
    ...perfil,
    permissoes: perfil.permissoes.map(p => ({ __typename: 'Permissao', ...p })),
  }
}

/**
 * O `Usuario` do contrato traz o **vínculo** (empresaId + perfil), não a empresa
 * inteira nem o `perfilId` solto que o mock carrega.
 */
function usuarioGql(usuario: Usuario) {
  return {
    __typename: 'Usuario',
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    ativo: usuario.ativo,
    empresas: usuario.empresas.map(v => ({
      __typename: 'UsuarioEmpresa',
      empresaId: v.empresaId,
      perfil: perfilGql(v.perfil),
    })),
    perfilGlobal: perfilGql(usuario.perfilGlobal),
  }
}

/**
 * C2 — rateio das despesas fixas ativas sobre o faturamento.
 *
 * **Calculado na leitura**, como no backend: guardar o valor num campo do
 * registro faria uma despesa recém-inativada continuar contando no rateio até
 * alguém lembrar de recalcular. Foi exatamente o que um teste flagrou.
 */
function rateioDeDespesas(empresa: Empresa): number {
  if (empresa.faturamentoMedioMensal <= 0) return 0
  const ativas = mockDespesasFixas
    .filter(d => d.empresaId === empresa.id && d.ativa)
    .reduce((soma, d) => soma + d.valorMensal, 0)
  return (ativas / empresa.faturamentoMedioMensal) * 100
}

/**
 * Campo nulável ausente **não** é a mesma coisa que nulo: o GraphQL devolve
 * `null` explícito, e o Apollo trata campo faltando como resposta incompleta —
 * o objeto inteiro volta indefinido do cache. Por isso cada campo do fragmento
 * aparece aqui, mesmo vazio.
 */
function empresaGql(empresa: Empresa) {
  const aplicaFatorR = fatorRSeAplica(empresa)
  return {
    __typename: 'Empresa',
    id: empresa.id,
    razaoSocial: empresa.razaoSocial,
    cnpj: empresa.cnpj ?? null,
    segmento: empresa.segmento,
    regimeTributario: empresa.regimeTributario,
    anexoCadastrado: empresa.anexoCadastrado ?? null,
    faturamentoMedioMensal: empresa.faturamentoMedioMensal,
    folhaPagamentoMensal: empresa.folhaPagamentoMensal ?? null,
    percentualDespesasFixas: rateioDeDespesas(empresa),
    donoUsuarioId: empresa.donoUsuarioId,
    // C8/C9 — mesma regra de ResultadoPrecificacao.fatorR/anexoAplicado, só que
    // como estado salvo da empresa, não por produto (REQ-02, resolvido 06-08-2026).
    fatorR: aplicaFatorR ? fatorRDe(empresa) : null,
    anexoAplicado: aplicaFatorR ? anexoAplicadoDe(empresa) : null,
  }
}

// ─── Composição do catálogo ───────────────────────────────────────────────────
//
// Aqui mora a diferença entre o "banco" (linhas com id) e o contrato (objetos
// resolvidos). É trabalho de servidor, e por isso acontece do lado do servidor
// falso: se o mock já entregasse o produto montado, o front seria testado contra
// um formato que o backend real nunca produz.

function materialGql(registro: MaterialRegistro) {
  return {
    __typename: 'Material',
    id: registro.id,
    nome: registro.nome,
    unidade: registro.unidade,
    custoUnitario: registro.custoUnitario,
    fornecedor: registro.fornecedor ?? null,
    // `TipoMaterial!` no contrato: o servidor sempre devolve um valor. INSUMO é o
    // que o backend assume quando a escrita omite o campo (opcional no input).
    tipo: registro.tipo ?? 'INSUMO',
    estoque: registro.estoque ?? null,
  }
}

function impostoGql(registro: ImpostoRegistro) {
  return {
    __typename: 'Imposto',
    id: registro.id,
    chave: registro.chave,
    nome: registro.nome,
    descricao: registro.descricao ?? null,
    aliquotaPercentual: registro.aliquotaPercentual,
    ativo: registro.ativo,
  }
}

function despesaGql(registro: DespesaFixaRegistro) {
  return {
    __typename: 'DespesaFixa',
    id: registro.id,
    descricao: registro.descricao,
    valorMensal: registro.valorMensal,
    categoria: registro.categoria,
    ativa: registro.ativa,
  }
}

/**
 * Monta o produto do contrato a partir da linha.
 *
 * - **ficha**: resolve `materialId` no catálogo. Material inexistente é **erro**
 *   (guarda V6) — o front antigo ignorava em silêncio e subestimava o custo.
 * - **custoBase (C1)**: soma de quantidade x custo unitário.
 * - **percentualImpostos (C3)**: soma simples das alíquotas **dos impostos
 *   cadastrados**, sem filtrar por `ativo` — igual ao `Produto.java` do backend.
 *   É aqui que a `aliquotaEfetivaPorEmpresa` do mock deixa de ter efeito: a
 *   alíquota que vale é a do cadastro, não uma cópia por produto.
 */
function produtoGql(registro: ProdutoRegistro) {
  const ficha = registro.materiais.map(item => {
    const material = mockMateriais.find(m => m.id === item.materialId)
    if (!material) {
      throw new ErroDeDominio(
        `Material ${item.materialId} não existe no catálogo`, 'BAD_REQUEST',
      )
    }
    return {
      __typename: 'ItemFichaTecnica',
      material: materialGql(material),
      quantidadeUtilizada: item.quantidadeUtilizada,
      unidade: item.unidade,
    }
  })

  const impostos = registro.impostos
    .map(vinculo => mockImpostos.find(i => i.id === vinculo.impostoId))
    .filter((i): i is ImpostoRegistro => !!i)
    .map(impostoGql)

  const custoBase = registro.materiais.reduce((soma, item) => {
    const material = mockMateriais.find(m => m.id === item.materialId)!
    return soma + item.quantidadeUtilizada * material.custoUnitario
  }, 0)

  return {
    __typename: 'Produto',
    id: registro.id,
    nome: registro.nome,
    descricao: registro.descricao ?? null,
    categoria: registro.categoria ?? null,
    tipo: registro.tipo ?? 'PRODUTO',
    margemLucro: registro.margemLucro,
    descontoMaximo: registro.descontoMaximo,
    ativo: registro.ativo,
    ficha,
    impostos,
    custoBase,
    percentualImpostos: impostos.reduce((soma, i) => soma + i.aliquotaPercentual, 0),
  }
}

/** Limite do Fator R (C9/R10) — igual a `PoliticaTributaria.FATOR_R_LIMITE`. */
const FATOR_R_LIMITE = 28
const INTERVALOS_FAIXA = 4

/** C8 — folha/faturamento; V2/V4 tratam faturamento ≤ 0 devolvendo zero. */
function fatorRDe(empresa: Empresa): number {
  const folha = empresa.folhaPagamentoMensal ?? 0
  if (empresa.faturamentoMedioMensal <= 0) return 0
  return (folha / empresa.faturamentoMedioMensal) * 100
}

/** V5 — Fator R só se aplica a serviços no Simples; fora disso, `null`. */
function fatorRSeAplica(empresa: Empresa): boolean {
  return empresa.segmento === 'SERVICOS' && empresa.regimeTributario === 'SIMPLES_NACIONAL'
}

/** C9 — replica `PoliticaTributaria`: Fator R decide para quem se aplica. */
function anexoAplicadoDe(empresa: Empresa): string | null {
  if (fatorRSeAplica(empresa)) {
    return fatorRDe(empresa) >= FATOR_R_LIMITE ? 'ANEXO_III' : 'ANEXO_V'
  }
  return empresa.anexoCadastrado ?? null
}

/** C10–C12 — replica `FaixaNegociacao.java`, degrau a degrau. */
export function faixaNegociacaoGql(precoVenda: number, margemLucro: number, descontoMaximo: number) {
  const precoEm = (desconto: number) => precoVenda - precoVenda * (desconto / 100)
  const lucroEm = (desconto: number) => precoVenda * ((margemLucro + descontoMaximo - desconto) / 100)

  const intervalos = descontoMaximo === 0 ? 0 : INTERVALOS_FAIXA
  const degraus = Array.from({ length: intervalos + 1 }, (_, i) => {
    const desconto = intervalos === 0 ? 0 : (descontoMaximo * i) / intervalos
    const preco = precoEm(desconto)
    const lucro = lucroEm(desconto)
    return {
      __typename: 'DegrauDesconto',
      desconto,
      preco,
      lucro,
      margemEfetiva: preco > 0 ? (lucro / preco) * 100 : 0,
    }
  })

  return {
    __typename: 'FaixaNegociacao',
    descontoMinimo: 0,
    descontoMaximo,
    precoTabela: precoVenda,
    precoMinimo: precoEm(descontoMaximo),
    economiaMaxima: precoVenda - precoEm(descontoMaximo),
    lucroNoTeto: lucroEm(0),
    lucroNoPiso: lucroEm(descontoMaximo),
    degraus,
  }
}

/**
 * Replica `CalculadoraDeMarkup.precificar` inteira: `PV = CP / (1 - soma/100)`.
 *
 * Igual ao backend, não uma versão simplificada — é o que garante que os
 * testes provem o comportamento real, e não uma segunda fórmula que só existe
 * nos testes. Lança `ErroDeDominio` em V1 (divisor inviável) e V6 (material
 * órfão, propagado por `produtoGql`).
 */
export function precificarGql(registro: ProdutoRegistro, empresa: Empresa) {
  const produto = produtoGql(registro)   // lança em V6 (material órfão)

  const impostos = produto.percentualImpostos
  const despesasFixas = rateioDeDespesas(empresa)
  const margemLucro = registro.margemLucro
  const desconto = registro.descontoMaximo

  const soma = impostos + despesasFixas + margemLucro + desconto
  const divisor = 1 - soma / 100
  if (divisor <= 0) {
    throw new ErroDeDominio(
      `soma dos percentuais alcança ou passa de 100% (${soma}): preço inviável`,
      'BAD_REQUEST',
    )
  }

  const custoBase = produto.custoBase
  const precoVenda = custoBase / divisor
  const aplicaFatorR = fatorRSeAplica(empresa)

  return {
    __typename: 'ResultadoPrecificacao',
    produto,
    custoBase,
    percentualImpostos: impostos,
    percentualDespesasFixas: despesasFixas,
    percentualMargemLucro: margemLucro,
    percentualDesconto: desconto,
    somaTotalPercentuais: soma,
    divisorMarkup: divisor,
    precoVenda,
    fatorR: aplicaFatorR ? fatorRDe(empresa) : null,
    anexoAplicado: aplicaFatorR ? anexoAplicadoDe(empresa) : null,
    breakdown: {
      __typename: 'Breakdown',
      custoRecuperado: custoBase,
      valorImpostos: precoVenda * (impostos / 100),
      valorDespesasFixas: precoVenda * (despesasFixas / 100),
      valorDesconto: precoVenda * (desconto / 100),
      lucroLiquido: precoVenda * (margemLucro / 100),
    },
    faixaNegociacao: faixaNegociacaoGql(precoVenda, margemLucro, desconto),
  }
}

/** 1ª faixa do Simples — mesmas constantes de `SimularImpactoAnexo.java`. */
const ALIQUOTA_ANEXO_III_FAIXA_1 = 6
const ALIQUOTA_ANEXO_V_FAIXA_1 = 15.5

/**
 * Replica `CalculadoraDeMarkup.precificarComImpostoHipotetico`: mesmo custo
 * base/DF%/ML%/desconto reais, só o imposto é hipotético (o real, cadastrado
 * no produto, não muda sozinho quando o anexo muda).
 */
function precificarComImpostoHipoteticoGql(
  registro: ProdutoRegistro,
  empresa: Empresa,
  impostoHipotetico: number,
  anexoHipotetico: string,
) {
  const produto = produtoGql(registro)
  const despesasFixas = rateioDeDespesas(empresa)
  const margemLucro = registro.margemLucro
  const desconto = registro.descontoMaximo

  const soma = impostoHipotetico + despesasFixas + margemLucro + desconto
  const divisor = 1 - soma / 100
  if (divisor <= 0) {
    throw new ErroDeDominio(
      `soma dos percentuais alcança ou passa de 100% (${soma}): preço inviável`,
      'BAD_REQUEST',
    )
  }

  const custoBase = produto.custoBase
  const precoVenda = custoBase / divisor

  return {
    __typename: 'ResultadoPrecificacao',
    produto,
    custoBase,
    percentualImpostos: impostoHipotetico,
    percentualDespesasFixas: despesasFixas,
    percentualMargemLucro: margemLucro,
    percentualDesconto: desconto,
    somaTotalPercentuais: soma,
    divisorMarkup: divisor,
    precoVenda,
    fatorR: fatorRSeAplica(empresa) ? fatorRDe(empresa) : null,
    anexoAplicado: anexoHipotetico,
    breakdown: {
      __typename: 'Breakdown',
      custoRecuperado: custoBase,
      valorImpostos: precoVenda * (impostoHipotetico / 100),
      valorDespesasFixas: precoVenda * (despesasFixas / 100),
      valorDesconto: precoVenda * (desconto / 100),
      lucroLiquido: precoVenda * (margemLucro / 100),
    },
    faixaNegociacao: faixaNegociacaoGql(precoVenda, margemLucro, desconto),
  }
}

/** Erro que o servidor falso devolve com a classificação do contrato. */
class ErroDeDominio extends Error {
  constructor(mensagem: string, readonly classificacao: string) {
    super(mensagem)
  }
}

/**
 * Executa uma composição que pode esbarrar numa guarda de domínio (V6, material
 * órfão) e traduz para erro de contrato — como o `ErrosDeDominioResolver` faz no
 * backend. Sem isto, a guarda viraria exceção crua e o teste veria "erro de
 * rede", escondendo o que realmente aconteceu.
 */
function comErroDeDominio(montar: () => unknown): Response {
  try {
    return dados(montar())
  } catch (erro) {
    if (erro instanceof ErroDeDominio) return erroGraphQL(erro.message, erro.classificacao)
    throw erro
  }
}

/** Entrada de `salvarProduto` — espelha `ProdutoInput`. */
interface EntradaDeProduto {
  id?: string | null
  empresaId: string
  nome: string
  descricao?: string
  categoria?: string
  tipo: ProdutoRegistro['tipo']
  margemLucro: number
  descontoMaximo: number
  ficha: ProdutoRegistro['materiais']
  impostoIds: string[]
}

/** Registro do "banco" que carrega a empresa dona da linha. */
interface RegistroDeEmpresa {
  id: string
  empresaId?: string
}

/**
 * Grava (cria ou edita) uma linha, garantindo que a edição **não mude a empresa
 * do registro**: um `id` de outra empresa somado a um `empresaId` autorizado
 * seria um caminho de escrita cruzada (R02/R09).
 */
function gravar<T extends RegistroDeEmpresa>(
  tabela: T[],
  entrada: T & { id?: string | null },
  empresaId: string,
  prefixo: string,
): T {
  if (entrada.id) {
    const existente = tabela.find(linha => linha.id === entrada.id)
    if (!existente) throw new ErroDeDominio('Registro não encontrado', 'NOT_FOUND')
    if (existente.empresaId && existente.empresaId !== empresaId) {
      throw new ErroDeDominio('Registro de outra empresa', 'FORBIDDEN')
    }
    return Object.assign(existente, entrada, { empresaId })
  }
  const novo = { ...entrada, id: `${prefixo}-novo-${tabela.length + 1}`, empresaId } as T
  tabela.push(novo)
  return novo
}

/**
 * Conjunto autorizado — a regra do R09 aplicada **no servidor**.
 * ADMIN (escopo global) vê todas; os demais veem as próprias mais as
 * compartilhadas por vínculo explícito.
 */
function empresasDoUsuario(usuario: Usuario): Empresa[] {
  if (usuario.perfilGlobal?.escopoGlobal) return [...mockEmpresas]
  return mockEmpresas.filter(
    emp =>
      emp.donoUsuarioId === usuario.id ||
      usuario.empresas.some(v => v.empresaId === emp.id),
  )
}

/**
 * Valida que o usuário alcança a empresa pedida e devolve o id; se não alcança,
 * devolve a resposta de erro pronta.
 *
 * **FORBIDDEN, não lista vazia:** pedir dado de empresa alheia é recusa, não
 * ausência de resultado. Devolver `[]` diria ao usuário que a empresa não tem
 * cadastro nenhum, o que é falso e esconde o erro de quem chamou.
 */
function exigirAlcance(usuario: Usuario, empresaId: unknown): string | Response {
  const id = String(empresaId ?? '')
  if (!id) return erroGraphQL('empresaId é obrigatório', 'BAD_REQUEST')
  if (!empresasDoUsuario(usuario).some(e => e.id === id)) {
    return erroGraphQL('Sem acesso a esta empresa', 'FORBIDDEN')
  }
  return id
}

/**
 * Usuários que este usuário enxerga: o ADMIN global vê a base inteira; os demais
 * veem quem compartilha ao menos uma empresa com eles.
 */
function usuariosVisiveis(usuario: Usuario): Usuario[] {
  if (usuario.perfilGlobal?.escopoGlobal) return [...mockUsuarios]
  const minhas = new Set(empresasDoUsuario(usuario).map(e => e.id))
  return mockUsuarios.filter(u => u.empresas.some(v => minhas.has(v.empresaId)))
}

/** Escopo global (B9/F10): quem não tem, leva FORBIDDEN — nunca base vazia. */
function exigirEscopoGlobal(usuario: Usuario): Response | null {
  if (usuario.perfilGlobal?.escopoGlobal) return null
  return erroGraphQL('Requer escopo global (Gestão do Site)', 'FORBIDDEN')
}

/**
 * Compõe `EmpresaAdmin` no servidor — dono, equipe e `totalUsuarios` prontos.
 * É a mesma junção que `admin.ts` fazia no cliente antes de migrar; agora
 * mora aqui, porque é aqui que ela pertence (o front só lê o resultado).
 */
function empresaAdminGql(empresa: Empresa) {
  const dono = mockUsuarios.find(u => u.id === empresa.donoUsuarioId) ?? null

  const equipe = mockUsuarios
    .filter(u => u.empresas.some(v => v.empresaId === empresa.id))
    .map(usuario => {
      const vinculo = usuario.empresas.find(v => v.empresaId === empresa.id)!
      return {
        __typename: 'MembroEquipe',
        usuario: usuarioGql(usuario),
        perfil: perfilGql(vinculo.perfil),
        dono: usuario.id === empresa.donoUsuarioId,
      }
    })

  // Dono sem vínculo explícito não deveria existir (R09), mas se acontecer o
  // gestor precisa ver isso, não uma equipe sem dono nenhum.
  if (dono && !equipe.some(m => m.dono)) {
    equipe.unshift({
      __typename: 'MembroEquipe',
      usuario: usuarioGql(dono),
      perfil: null,
      dono: true,
    })
  }

  return {
    __typename: 'EmpresaAdmin',
    empresa: empresaGql(empresa),
    dono: dono ? usuarioGql(dono) : null,
    totalUsuarios: equipe.length,
    equipe,
  }
}

/** `metricasDaBase` — agregados reais, calculados no servidor (aqui é onde se calcula). */
function metricasDaBaseGql() {
  return {
    __typename: 'MetricasBase',
    totalEmpresas: mockEmpresas.length,
    totalUsuarios: mockUsuarios.length,
    usuariosAtivos: mockUsuarios.filter(u => u.ativo).length,
    totalVinculos: mockUsuarios.reduce((soma, u) => soma + u.empresas.length, 0),
    faturamentoTotal: mockEmpresas.reduce((soma, e) => soma + e.faturamentoMedioMensal, 0),
  }
}

/** Uma versão de margem/desconto no histórico do produto (mock de `versao_produto`). */
interface VersaoRegistro {
  id: string
  produtoId: string
  margemLucro: number
  descontoMaximo: number
  dataInicio: string
  dataFim: string | null
}

export function instalarServidorFalso(): ServidorFalso {
  const sessoes = new Map<string, Sessao>()   // accessToken → sessão
  const porRefresh = new Map<string, Sessao>()
  let sequencia = 0
  let noAr = true
  const mockVersoesProduto: VersaoRegistro[] = []
  let sequenciaVersao = 0

  /**
   * Replica `CatalogoPersistencia.registrarNovaVersao` — idempotente: se a
   * versão aberta já tem esta margem/desconto, não faz nada. Senão, fecha a
   * aberta e abre uma nova (spec versionamento-margem-produto, REQ-01).
   */
  function registrarVersao(produtoId: string, margemLucro: number, descontoMaximo: number): void {
    const agora = new Date().toISOString()
    const aberta = mockVersoesProduto.find(v => v.produtoId === produtoId && v.dataFim === null)
    if (aberta && aberta.margemLucro === margemLucro && aberta.descontoMaximo === descontoMaximo) {
      return
    }
    if (aberta) aberta.dataFim = agora
    sequenciaVersao += 1
    mockVersoesProduto.push({
      id: `versao-${sequenciaVersao}`,
      produtoId,
      margemLucro,
      descontoMaximo,
      dataInicio: agora,
      dataFim: null,
    })
  }

  const chamadas: Record<string, number> = {}

  function abrirSessao(usuarioId: string): Sessao {
    sequencia += 1
    const sessao: Sessao = {
      usuarioId,
      accessToken: `access-${usuarioId}-${sequencia}`,
      refreshToken: `refresh-${usuarioId}-${sequencia}`,
      accessExpirado: false,
      encerrada: false,
    }
    sessoes.set(sessao.accessToken, sessao)
    porRefresh.set(sessao.refreshToken, sessao)
    return sessao
  }

  /** Última sessão aberta — a que os controles do teste manipulam. */
  function sessaoCorrente(): Sessao | undefined {
    const abertas = [...sessoes.values()]
    return abertas[abertas.length - 1]
  }

  function usuarioDoToken(cabecalhos: Headers | undefined): Usuario | null {
    const autorizacao = cabecalhos?.get('authorization') ?? ''
    const token = autorizacao.replace(/^Bearer\s+/i, '')
    const sessao = sessoes.get(token)
    if (!sessao || sessao.accessExpirado || sessao.encerrada) return null
    return mockUsuarios.find(u => u.id === sessao.usuarioId) ?? null
  }

  function payloadDeAutenticacao(sessao: Sessao, usuario: Usuario) {
    return {
      __typename: 'AuthPayload',
      token: sessao.accessToken,
      refreshToken: sessao.refreshToken,
      expiraEmSegundos: 900,
      usuario: usuarioGql(usuario),
    }
  }

  const original = globalThis.fetch

  globalThis.fetch = vi.fn(async (_entrada: unknown, init?: RequestInit) => {
    if (!noAr) throw new TypeError('Failed to fetch')

    const corpo: CorpoRequisicao = JSON.parse(String(init?.body ?? '{}'))
    const operacao = corpo.operationName ?? ''
    const variaveis = corpo.variables ?? {}
    chamadas[operacao] = (chamadas[operacao] ?? 0) + 1

    const cabecalhos = new Headers(init?.headers as HeadersInit)

    switch (operacao) {
      case 'login': {
        const usuario = mockUsuarios.find(u => u.email === variaveis.email)
        // Usuário inativo é recusado com a mesma mensagem de credencial: dizer
        // "sua conta está desativada" confirmaria a existência do e-mail.
        if (!usuario || !usuario.ativo || variaveis.senha !== SENHA_PADRAO) {
          return erroGraphQL('Credenciais inválidas', 'UNAUTHORIZED')
        }
        return dados({ login: payloadDeAutenticacao(abrirSessao(usuario.id), usuario) })
      }

      case 'renovarSessao': {
        const anterior = porRefresh.get(String(variaveis.refreshToken))
        if (!anterior || anterior.encerrada) {
          return erroGraphQL('Sessão inválida', 'UNAUTHORIZED')
        }
        // Rotação: o refresh usado não vale mais, como no backend.
        porRefresh.delete(anterior.refreshToken)
        sessoes.delete(anterior.accessToken)
        const usuario = mockUsuarios.find(u => u.id === anterior.usuarioId)!
        return dados({ renovarSessao: payloadDeAutenticacao(abrirSessao(usuario.id), usuario) })
      }

      case 'encerrarSessao': {
        const sessao = sessaoCorrente()
        if (sessao) sessao.encerrada = true
        return dados({ encerrarSessao: true })
      }
    }

    // Daqui para baixo, tudo exige autenticação.
    const usuario = usuarioDoToken(cabecalhos)
    if (!usuario) return erroGraphQL('Unauthorized', 'UNAUTHORIZED')

    switch (operacao) {
      case 'me':
        return dados({ me: usuarioGql(usuario) })

      // -- Catalogo --------------------------------------------------------
      // Toda consulta exige `empresaId` e e validada contra o alcance do
      // usuario (R02/R09): id de empresa nao autorizada e FORBIDDEN, nunca
      // lista vazia -- lista vazia diria "voce nao tem material cadastrado".

      case 'materiais': {
        const alcance = exigirAlcance(usuario, variaveis.empresaId)
        if (alcance instanceof Response) return alcance
        return dados({
          materiais: mockMateriais.filter(m => m.empresaId === alcance).map(materialGql),
        })
      }

      case 'impostos': {
        const alcance = exigirAlcance(usuario, variaveis.empresaId)
        if (alcance instanceof Response) return alcance
        return dados({
          impostos: mockImpostos
            .filter(i => !i.empresaId || i.empresaId === alcance)
            .map(impostoGql),
        })
      }

      case 'despesasFixas': {
        const alcance = exigirAlcance(usuario, variaveis.empresaId)
        if (alcance instanceof Response) return alcance
        return dados({
          despesasFixas: mockDespesasFixas
            .filter(d => d.empresaId === alcance)
            .map(despesaGql),
        })
      }

      case 'produtos': {
        const alcance = exigirAlcance(usuario, variaveis.empresaId)
        if (alcance instanceof Response) return alcance
        return comErroDeDominio(() => ({
          produtos: mockProdutos.filter(p => p.empresaId === alcance).map(produtoGql),
        }))
      }

      case 'produto': {
        const registro = mockProdutos.find(p => p.id === variaveis.id)
        if (!registro) return erroGraphQL('Produto nao encontrado', 'NOT_FOUND')
        const alcance = exigirAlcance(usuario, registro.empresaId)
        if (alcance instanceof Response) return alcance
        return comErroDeDominio(() => ({ produto: produtoGql(registro) }))
      }

      // -- Precificacao ------------------------------------------------------
      // A formula inteira roda aqui, replicando CalculadoraDeMarkup.java: nao
      // e uma versao simplificada para teste, e a mesma conta (ver precificarGql).

      case 'precificarProduto': {
        const registro = mockProdutos.find(p => p.id === variaveis.produtoId)
        if (!registro) return erroGraphQL('Produto nao encontrado', 'NOT_FOUND')
        const alcance = exigirAlcance(usuario, registro.empresaId)
        if (alcance instanceof Response) return alcance
        const empresa = mockEmpresas.find(e => e.id === alcance)!
        return comErroDeDominio(() => ({ precificarProduto: precificarGql(registro, empresa) }))
      }

      case 'precificarTodos': {
        const alcance = exigirAlcance(usuario, variaveis.empresaId)
        if (alcance instanceof Response) return alcance
        const empresa = mockEmpresas.find(e => e.id === alcance)!
        return comErroDeDominio(() => ({
          precificarTodos: mockProdutos
            .filter(p => p.empresaId === alcance)
            .map(registro => precificarGql(registro, empresa)),
        }))
      }

      case 'simularMarkup': {
        const custoBase = Number(variaveis.custoBase)
        const impostos = Number(variaveis.percentualImpostos)
        const despesasFixas = Number(variaveis.percentualDespesasFixas)
        const margemLucro = Number(variaveis.percentualMargemLucro)
        const desconto = Number(variaveis.percentualDesconto)

        return comErroDeDominio(() => {
          const soma = impostos + despesasFixas + margemLucro + desconto
          const divisor = 1 - soma / 100
          if (divisor <= 0) {
            throw new ErroDeDominio(
              `soma dos percentuais alcança ou passa de 100% (${soma}): preço inviável`,
              'BAD_REQUEST',
            )
          }
          const precoVenda = custoBase / divisor
          return {
            simularMarkup: {
              __typename: 'SimulacaoMarkup',
              custoBase,
              percentualImpostos: impostos,
              percentualDespesasFixas: despesasFixas,
              percentualMargemLucro: margemLucro,
              percentualDesconto: desconto,
              somaTotalPercentuais: soma,
              divisorMarkup: divisor,
              precoVenda,
              breakdown: {
                __typename: 'Breakdown',
                custoRecuperado: custoBase,
                valorImpostos: precoVenda * (impostos / 100),
                valorDespesasFixas: precoVenda * (despesasFixas / 100),
                valorDesconto: precoVenda * (desconto / 100),
                lucroLiquido: precoVenda * (margemLucro / 100),
              },
              faixaNegociacao: faixaNegociacaoGql(precoVenda, margemLucro, desconto),
            },
          }
        })
      }

      case 'simularImpactoAnexo': {
        const registro = mockProdutos.find(p => p.id === variaveis.produtoId)
        if (!registro) return erroGraphQL('Produto nao encontrado', 'NOT_FOUND')
        const alcance = exigirAlcance(usuario, registro.empresaId)
        if (alcance instanceof Response) return alcance
        const empresa = mockEmpresas.find(e => e.id === alcance)!
        return comErroDeDominio(() => ({
          simularImpactoAnexo: {
            __typename: 'ImpactoAnexo',
            nomeProduto: registro.nome,
            comoAnexoIII: precificarComImpostoHipoteticoGql(
              registro, empresa, ALIQUOTA_ANEXO_III_FAIXA_1, 'ANEXO_III'),
            comoAnexoV: precificarComImpostoHipoteticoGql(
              registro, empresa, ALIQUOTA_ANEXO_V_FAIXA_1, 'ANEXO_V'),
          },
        }))
      }

      // -- Acesso ----------------------------------------------------------

      case 'perfis':
        return dados({ perfis: mockPerfis.map(perfilGql) })

      case 'usuarios':
        return dados({ usuarios: usuariosVisiveis(usuario).map(usuarioGql) })

      case 'convidarUsuario': {
        const alcance = exigirAlcance(usuario, variaveis.empresaId)
        if (alcance instanceof Response) return alcance
        if (mockUsuarios.some(u => u.email === variaveis.email)) {
          return erroGraphQL('E-mail ja cadastrado', 'BAD_REQUEST')
        }
        const perfil = mockPerfis.find(p => p.id === variaveis.perfilId)
        if (!perfil) return erroGraphQL('Perfil nao encontrado', 'NOT_FOUND')

        sequencia += 1
        const convidado: Usuario = {
          id: `usr-convidado-${sequencia}`,
          nome: String(variaveis.nome),
          email: String(variaveis.email),
          ativo: true,
          empresas: [{ empresaId: alcance, perfil }],
        }
        mockUsuarios.push(convidado)
        return dados({
          convidarUsuario: {
            __typename: 'Convidado',
            // Exibida uma unica vez: o servidor nao a devolve de novo.
            senhaProvisoria: `prov-${sequencia}`,
            usuario: usuarioGql(convidado),
          },
        })
      }

      case 'minhasEmpresas':
        return dados({ minhasEmpresas: empresasDoUsuario(usuario).map(empresaGql) })

      case 'simularFatorR': {
        const alcance = exigirAlcance(usuario, variaveis.empresaId)
        if (alcance instanceof Response) return alcance
        const real = mockEmpresas.find(e => e.id === alcance)
        if (!real) return erroGraphQL('Empresa não encontrada', 'NOT_FOUND')

        // Stateless: monta uma empresa hipotética só para o cálculo, não grava
        // nada em mockEmpresas — mesmo espírito de Empresa.substituir no backend.
        const hipotetica: Empresa = {
          ...real,
          faturamentoMedioMensal: Number(variaveis.faturamentoMedioMensal),
          folhaPagamentoMensal: Number(variaveis.folhaPagamentoMensal),
        }
        const aplicavel = fatorRSeAplica(hipotetica)
        return dados({
          simularFatorR: {
            __typename: 'SimulacaoFatorR',
            fatorR: aplicavel ? fatorRDe(hipotetica) : null,
            anexoAplicado: aplicavel ? anexoAplicadoDe(hipotetica) : null,
            aplicavel,
          },
        })
      }

      case 'salvarEmpresa': {
        const entrada = variaveis.input as Partial<Empresa> & { id?: string | null }
        if (entrada.id) {
          const existente = mockEmpresas.find(e => e.id === entrada.id)
          if (!existente) return erroGraphQL('Empresa não encontrada', 'NOT_FOUND')
          Object.assign(existente, entrada)
          return dados({ salvarEmpresa: empresaGql(existente) })
        }
        const nova: Empresa = {
          ...(entrada as Omit<Empresa, 'id' | 'donoUsuarioId' | 'percentualDespesasFixas'>),
          id: `emp-nova-${sequencia}`,
          // Empresa nova ainda não tem despesa fixa: o rateio (C2) nasce zero
          percentualDespesasFixas: 0,
          // Quem cria vira dono — decidido pelo servidor a partir do token (R09)
          donoUsuarioId: usuario.id,
        }
        mockEmpresas.push(nova)
        return dados({ salvarEmpresa: empresaGql(nova) })
      }

      // -- Gestao do Site (escopo global — B9/F10) --------------------------

      case 'todasEmpresas': {
        const negado = exigirEscopoGlobal(usuario)
        if (negado) return negado
        return dados({ todasEmpresas: mockEmpresas.map(empresaAdminGql) })
      }

      case 'empresaAdmin': {
        const negado = exigirEscopoGlobal(usuario)
        if (negado) return negado
        const empresa = mockEmpresas.find(e => e.id === String(variaveis.empresaId))
        if (!empresa) return erroGraphQL('Empresa não encontrada', 'NOT_FOUND')
        return dados({ empresaAdmin: empresaAdminGql(empresa) })
      }

      case 'todosUsuarios': {
        const negado = exigirEscopoGlobal(usuario)
        if (negado) return negado
        return dados({ todosUsuarios: mockUsuarios.map(usuarioGql) })
      }

      case 'metricasDaBase': {
        const negado = exigirEscopoGlobal(usuario)
        if (negado) return negado
        return dados({ metricasDaBase: metricasDaBaseGql() })
      }

      case 'vincularUsuario': {
        const negado = exigirEscopoGlobal(usuario)
        if (negado) return negado
        const alvo = mockUsuarios.find(u => u.id === String(variaveis.usuarioId))
        const empresa = mockEmpresas.find(e => e.id === String(variaveis.empresaId))
        const perfil = mockPerfis.find(p => p.id === String(variaveis.perfilId))
        if (!alvo || !empresa) return erroGraphQL('Registro não encontrado', 'NOT_FOUND')
        if (!perfil) return erroGraphQL('Perfil não encontrado', 'NOT_FOUND')
        if (alvo.empresas.some(v => v.empresaId === empresa.id)) {
          return erroGraphQL('Usuário já tem acesso a esta empresa', 'BAD_REQUEST')
        }
        const vinculo = { empresaId: empresa.id, perfil }
        alvo.empresas.push(vinculo)
        return dados({
          vincularUsuario: { __typename: 'UsuarioEmpresa', empresaId: vinculo.empresaId, perfil: perfilGql(perfil) },
        })
      }

      case 'desvincularUsuario': {
        const negado = exigirEscopoGlobal(usuario)
        if (negado) return negado
        const alvo = mockUsuarios.find(u => u.id === String(variaveis.usuarioId))
        const empresa = mockEmpresas.find(e => e.id === String(variaveis.empresaId))
        if (!alvo || !empresa) return erroGraphQL('Registro não encontrado', 'NOT_FOUND')
        // O dono não pode ser desvinculado da própria empresa (R09): ela
        // ficaria sem responsável. Regra do domínio, não guarda numerada.
        if (empresa.donoUsuarioId === alvo.id) {
          return erroGraphQL('O dono não pode ser desvinculado da própria empresa', 'BAD_REQUEST')
        }
        const idx = alvo.empresas.findIndex(v => v.empresaId === empresa.id)
        if (idx < 0) return erroGraphQL('Vínculo não encontrado', 'NOT_FOUND')
        alvo.empresas.splice(idx, 1)
        return dados({ desvincularUsuario: true })
      }

      case 'definirPerfilNoVinculo': {
        const negado = exigirEscopoGlobal(usuario)
        if (negado) return negado
        const alvo = mockUsuarios.find(u => u.id === String(variaveis.usuarioId))
        const perfil = mockPerfis.find(p => p.id === String(variaveis.perfilId))
        const vinculo = alvo?.empresas.find(v => v.empresaId === String(variaveis.empresaId))
        if (!alvo || !perfil || !vinculo) return erroGraphQL('Registro não encontrado', 'NOT_FOUND')
        vinculo.perfil = perfil
        return dados({
          definirPerfilNoVinculo: { __typename: 'UsuarioEmpresa', empresaId: vinculo.empresaId, perfil: perfilGql(perfil) },
        })
      }

      case 'definirUsuarioAtivo': {
        const negado = exigirEscopoGlobal(usuario)
        if (negado) return negado
        const alvo = mockUsuarios.find(u => u.id === String(variaveis.usuarioId))
        if (!alvo) return erroGraphQL('Usuário não encontrado', 'NOT_FOUND')
        alvo.ativo = Boolean(variaveis.ativo)
        return dados({ definirUsuarioAtivo: usuarioGql(alvo) })
      }
    }

    switch (operacao) {
      case 'salvarMaterial': {
        const entrada = variaveis.input as MaterialRegistro & { id?: string | null }
        const alcance = exigirAlcance(usuario, entrada.empresaId)
        if (alcance instanceof Response) return alcance
        const salvo = gravar(mockMateriais, entrada, alcance, 'mat')
        return dados({ salvarMaterial: materialGql(salvo) })
      }

      case 'salvarImposto': {
        const entrada = variaveis.input as ImpostoRegistro & { id?: string | null }
        const alcance = exigirAlcance(usuario, entrada.empresaId)
        if (alcance instanceof Response) return alcance
        const salvo = gravar(mockImpostos, entrada, alcance, 'imp')
        return dados({ salvarImposto: impostoGql(salvo) })
      }

      case 'salvarDespesaFixa': {
        const entrada = variaveis.input as DespesaFixaRegistro & { id?: string | null }
        const alcance = exigirAlcance(usuario, entrada.empresaId)
        if (alcance instanceof Response) return alcance
        const salvo = gravar(mockDespesasFixas, entrada, alcance, 'df')
        return dados({ salvarDespesaFixa: despesaGql(salvo) })
      }

      case 'toggleDespesaFixa': {
        const despesa = mockDespesasFixas.find(d => d.id === variaveis.id)
        if (!despesa) return erroGraphQL('Despesa nao encontrada', 'NOT_FOUND')
        const alcance = exigirAlcance(usuario, despesa.empresaId)
        if (alcance instanceof Response) return alcance
        despesa.ativa = Boolean(variaveis.ativa)
        return dados({ toggleDespesaFixa: despesaGql(despesa) })
      }

      case 'salvarProduto': {
        const entrada = variaveis.input as EntradaDeProduto
        const alcance = exigirAlcance(usuario, entrada.empresaId)
        if (alcance instanceof Response) return alcance

        const existente = entrada.id ? mockProdutos.find(p => p.id === entrada.id) : undefined
        if (entrada.id && !existente) return erroGraphQL('Produto nao encontrado', 'NOT_FOUND')

        sequencia += 1
        const campos = {
          empresaId: alcance,
          nome: entrada.nome,
          descricao: entrada.descricao,
          categoria: entrada.categoria,
          tipo: entrada.tipo,
          margemLucro: entrada.margemLucro,
          descontoMaximo: entrada.descontoMaximo,
          materiais: entrada.ficha.map(item => ({
            materialId: item.materialId,
            quantidadeUtilizada: item.quantidadeUtilizada,
            unidade: item.unidade,
          })),
          // Referencia ao imposto; a aliquota e a do cadastro, resolvida na
          // leitura -- nao uma copia guardada por produto.
          impostos: entrada.impostoIds.map(impostoId => ({ impostoId })),
        }

        const registro: ProdutoRegistro = existente
          ? Object.assign(existente, campos)
          : {
              id: `prod-novo-${sequencia}`,
              // `ativo` nao vem do input (o contrato nao o tem): nasce ativo
              ativo: true,
              createdAt: new Date().toISOString(),
              ...campos,
            }
        if (!existente) mockProdutos.push(registro)
        registrarVersao(registro.id, registro.margemLucro, registro.descontoMaximo)

        return comErroDeDominio(() => ({ salvarProduto: produtoGql(registro) }))
      }

      case 'ajustarMargem': {
        const produto = mockProdutos.find(p => p.id === variaveis.produtoId)
        if (!produto) return erroGraphQL('Produto nao encontrado', 'NOT_FOUND')
        const alcance = exigirAlcance(usuario, produto.empresaId)
        if (alcance instanceof Response) return alcance
        produto.margemLucro = Number(variaveis.margemLucro)
        registrarVersao(produto.id, produto.margemLucro, produto.descontoMaximo)
        return comErroDeDominio(() => ({ ajustarMargem: produtoGql(produto) }))
      }

      /** "Salvar" da Simulação Manual: margem e desconto juntos, uma versão só. */
      case 'ajustarMargemEDesconto': {
        const produto = mockProdutos.find(p => p.id === variaveis.produtoId)
        if (!produto) return erroGraphQL('Produto nao encontrado', 'NOT_FOUND')
        const alcance = exigirAlcance(usuario, produto.empresaId)
        if (alcance instanceof Response) return alcance
        produto.margemLucro = Number(variaveis.margemLucro)
        produto.descontoMaximo = Number(variaveis.descontoMaximo)
        registrarVersao(produto.id, produto.margemLucro, produto.descontoMaximo)
        return comErroDeDominio(() => ({ ajustarMargemEDesconto: produtoGql(produto) }))
      }

      case 'historicoDoProduto': {
        const produto = mockProdutos.find(p => p.id === variaveis.produtoId)
        if (!produto) return erroGraphQL('Produto nao encontrado', 'NOT_FOUND')
        const alcance = exigirAlcance(usuario, produto.empresaId)
        if (alcance instanceof Response) return alcance
        const versoes = mockVersoesProduto
          .filter(v => v.produtoId === produto.id)
          .sort((a, b) => (a.dataInicio < b.dataInicio ? 1 : -1))
          .map(v => ({ __typename: 'VersaoProduto', ...v }))
        return dados({ historicoDoProduto: versoes })
      }

      case 'reativarVersaoProduto': {
        const versao = mockVersoesProduto.find(v => v.id === variaveis.versaoId)
        if (!versao) return erroGraphQL('Versao nao encontrada', 'NOT_FOUND')
        const produto = mockProdutos.find(p => p.id === versao.produtoId)
        if (!produto) return erroGraphQL('Produto nao encontrado', 'NOT_FOUND')
        const alcance = exigirAlcance(usuario, produto.empresaId)
        if (alcance instanceof Response) return alcance
        produto.margemLucro = versao.margemLucro
        produto.descontoMaximo = versao.descontoMaximo
        registrarVersao(produto.id, produto.margemLucro, produto.descontoMaximo)
        return comErroDeDominio(() => ({ reativarVersaoProduto: produtoGql(produto) }))
      }

      /** Exclusão de verdade (emenda de REQ-02) — a vigente é sempre recusada. */
      case 'excluirVersaoProduto': {
        const versao = mockVersoesProduto.find(v => v.id === variaveis.versaoId)
        if (!versao) return erroGraphQL('Versao nao encontrada', 'NOT_FOUND')
        const produto = mockProdutos.find(p => p.id === versao.produtoId)
        if (!produto) return erroGraphQL('Produto nao encontrado', 'NOT_FOUND')
        const alcance = exigirAlcance(usuario, produto.empresaId)
        if (alcance instanceof Response) return alcance
        if (versao.dataFim === null) {
          return erroGraphQL('a versão vigente não pode ser excluída', 'BAD_REQUEST')
        }
        const indice = mockVersoesProduto.indexOf(versao)
        mockVersoesProduto.splice(indice, 1)
        return dados({ excluirVersaoProduto: true })
      }
    }

    return erroGraphQL(`Operacao nao suportada no servidor falso: ${operacao}`, 'BAD_REQUEST')
  }) as typeof fetch

  return {
    chamadas,
    expirarAccessToken() {
      const sessao = sessaoCorrente()
      if (sessao) sessao.accessExpirado = true
    },
    invalidarRefreshToken() {
      porRefresh.clear()
    },
    derrubar() {
      noAr = false
    },
    levantar() {
      noAr = true
    },
    restaurar() {
      globalThis.fetch = original
    },
  }
}
