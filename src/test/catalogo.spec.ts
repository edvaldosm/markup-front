/**
 * Catálogo contra o servidor falso.
 *
 * O que estes testes protegem, acima de tudo: **dado de uma empresa não aparece
 * na tela de outra**. O servidor filtra certo; o risco mora no cliente, na
 * ordem em que as respostas chegam.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useMateriaisStore } from '@/stores/materiais'
import { useProdutosStore } from '@/stores/produtos'
import { useDespesasStore } from '@/stores/despesas'
import { useUsuariosStore } from '@/stores/usuarios'
import { useEmpresaStore } from '@/stores/empresa'
import { prepararAmbiente, entrarComo } from './app-harness'
import { mockMateriais, mockProdutos, mockUsuarios } from '@/test/fixtures'
import { type ServidorFalso } from './servidor-falso'

let servidor: ServidorFalso

/** Deixa o watch de empresa ativa disparar e a consulta assentar. */
async function assentarTroca() {
  await new Promise(r => setTimeout(r, 0))
  await new Promise(r => setTimeout(r, 0))
}

beforeEach(() => {
  servidor = prepararAmbiente()
})

afterEach(() => {
  servidor.restaurar()
})

describe('store de materiais — modelo dos stores de catálogo', () => {
  it('carrega os materiais da empresa ativa', async () => {
    await entrarComo('ana@docesdaana.com.br')
    const empresa = useEmpresaStore()
    await empresa.fetchEmpresas()
    empresa.selecionarEmpresa('1')

    const materiais = useMateriaisStore()
    await materiais.fetchMateriais()

    expect(materiais.materiais.length).toBeGreaterThan(0)
    expect(materiais.erro).toBeNull()
    // O servidor já filtrou: a lista é menor que o catálogo inteiro
    expect(materiais.materiais.length).toBeLessThan(mockMateriais.length)
  })

  it('trocar de empresa troca o catálogo, sem sobra da anterior', async () => {
    await entrarComo('ana@docesdaana.com.br')
    const empresa = useEmpresaStore()
    await empresa.fetchEmpresas()
    empresa.selecionarEmpresa('1')

    const materiais = useMateriaisStore()
    await materiais.fetchMateriais()
    const daConfeitaria = materiais.materiais.map(m => m.id)
    expect(daConfeitaria.length).toBeGreaterThan(0)

    empresa.selecionarEmpresa('3')
    await assentarTroca()

    expect(materiais.materiais.length).toBeGreaterThan(0)
    // Nenhum material da empresa anterior sobreviveu à troca
    expect(materiais.materiais.some(m => daConfeitaria.includes(m.id))).toBe(false)
  })

  it('salvar grava no servidor e o item volta na lista', async () => {
    await entrarComo('ana@docesdaana.com.br')
    const empresa = useEmpresaStore()
    await empresa.fetchEmpresas()
    empresa.selecionarEmpresa('1')

    const materiais = useMateriaisStore()
    await materiais.fetchMateriais()
    const antes = materiais.materiais.length

    const salvo = await materiais.salvar({
      nome: 'Chocolate belga 70%',
      unidade: 'KG',
      custoUnitario: 89.9,
      tipo: 'INSUMO',
    })

    expect(salvo).not.toBeNull()
    expect(materiais.materiais).toHaveLength(antes + 1)

    // Sobrevive a um novo carregamento — está no "banco", não só na tela
    await materiais.fetchMateriais()
    expect(materiais.materiais.some(m => m.id === salvo!.id)).toBe(true)

    mockMateriais.splice(mockMateriais.findIndex(m => m.id === salvo!.id), 1)
  })

  it('servidor fora do ar não vira "nenhum material cadastrado"', async () => {
    await entrarComo('ana@docesdaana.com.br')
    const empresa = useEmpresaStore()
    await empresa.fetchEmpresas()
    empresa.selecionarEmpresa('1')

    const materiais = useMateriaisStore()
    servidor.derrubar()
    await materiais.fetchMateriais()

    expect(materiais.materiais).toEqual([])
    expect(materiais.erro).toMatch(/servidor/i)
  })

  it('logout esvazia o catálogo', async () => {
    const auth = await entrarComo('ana@docesdaana.com.br')
    const empresa = useEmpresaStore()
    await empresa.fetchEmpresas()
    empresa.selecionarEmpresa('1')

    const materiais = useMateriaisStore()
    await materiais.fetchMateriais()
    expect(materiais.materiais.length).toBeGreaterThan(0)

    await auth.logout()

    expect(materiais.materiais).toEqual([])
  })
})

/** Deixa a empresa 1 (Doces da Ana) ativa e o catálogo carregado. */
async function comConfeitariaAtiva() {
  await entrarComo('ana@docesdaana.com.br')
  const empresa = useEmpresaStore()
  await empresa.fetchEmpresas()
  empresa.selecionarEmpresa('1')
  await assentarTroca()
  return empresa
}

describe('escrita no catálogo (REQ-05, REQ-07, REQ-08)', () => {
  it('salvar produto grava a ficha e o custo volta calculado pelo servidor', async () => {
    const empresa = await comConfeitariaAtiva()
    const materiais = useMateriaisStore()
    const produtos = useProdutosStore()
    await materiais.fetchMateriais()
    await produtos.fetchProdutos()

    const insumo = materiais.materiais[0]
    const salvo = await produtos.salvar({
      nome: 'Bolo de teste',
      tipo: 'PRODUTO',
      margemLucro: 40,
      descontoMaximo: 5,
      ficha: [{ materialId: insumo.id, quantidadeUtilizada: 3, unidade: insumo.unidade }],
      impostoIds: [],
    })

    expect(salvo).not.toBeNull()
    // C1 é do servidor: o front não enviou custo nenhum
    expect(salvo!.custoBase).toBeCloseTo(insumo.custoUnitario * 3, 6)
    // A ficha volta resolvida, com o material inteiro
    expect(salvo!.ficha[0].material.nome).toBe(insumo.nome)
    expect(empresa.empresaAtivaId).toBe('1')

    mockProdutos.splice(mockProdutos.findIndex(p => p.id === salvo!.id), 1)
  })

  it('produto com material inexistente é recusado — guarda V6, não custo menor', async () => {
    await comConfeitariaAtiva()
    const produtos = useProdutosStore()

    const salvo = await produtos.salvar({
      nome: 'Produto impossível',
      tipo: 'PRODUTO',
      margemLucro: 40,
      descontoMaximo: 5,
      ficha: [{ materialId: 'material-que-nao-existe', quantidadeUtilizada: 1, unidade: 'KG' }],
      impostoIds: [],
    })

    // O front antigo ignorava o item e calculava um custo menor que o real
    expect(salvo).toBeNull()
    expect(produtos.erro).toBeTruthy()

    const orfao = mockProdutos.findIndex(p => p.nome === 'Produto impossível')
    if (orfao >= 0) mockProdutos.splice(orfao, 1)
  })

  it('ajustar margem usa mutation própria e não reenvia a ficha', async () => {
    await comConfeitariaAtiva()
    const produtos = useProdutosStore()
    await produtos.fetchProdutos()

    const alvo = produtos.produtos.find(p => p.ficha.length > 0)!
    const fichaAntes = alvo.ficha.length

    const ajustado = await produtos.ajustarMargem(alvo.id, 55)

    expect(ajustado!.margemLucro).toBe(55)
    // A composição continua intacta — nenhum formulário a sobrescreveu
    expect(ajustado!.ficha).toHaveLength(fichaAntes)

    await produtos.ajustarMargem(alvo.id, alvo.margemLucro)
  })

  it('inativar despesa muda o rateio da empresa (C2, do servidor)', async () => {
    const empresa = await comConfeitariaAtiva()
    const despesas = useDespesasStore()
    await despesas.fetchDespesas()

    const rateioAntes = empresa.empresa!.percentualDespesasFixas
    const ativa = despesas.despesas.find(d => d.ativa)!

    const alterada = await despesas.alternarAtiva(ativa.id, false)

    expect(alterada!.ativa).toBe(false)
    // O número não foi recalculado aqui: veio da empresa recarregada
    expect(empresa.empresa!.percentualDespesasFixas).toBeLessThan(rateioAntes)

    await despesas.alternarAtiva(ativa.id, true)
    expect(empresa.empresa!.percentualDespesasFixas).toBeCloseTo(rateioAntes, 6)
  })
})

describe('convite de usuário (REQ-14)', () => {
  it('devolve a senha provisória uma única vez', async () => {
    await comConfeitariaAtiva()
    const usuarios = useUsuariosStore()
    await usuarios.fetchUsuarios()

    const perfil = usuarios.perfis.find(p => p.nome === 'VENDEDOR')!
    const convidado = await usuarios.convidar('Novo Vendedor', 'novo@docesdaana.com.br', perfil.id)

    expect(convidado?.senhaProvisoria).toBeTruthy()
    // O store não guarda a senha: não há de onde exibi-la outra vez
    expect(JSON.stringify(usuarios.usuarios)).not.toContain(convidado!.senhaProvisoria)

    // E o convidado aparece na lista da empresa ativa
    expect(usuarios.usuarios.some(u => u.email === 'novo@docesdaana.com.br')).toBe(true)

    mockUsuarios.splice(mockUsuarios.findIndex(u => u.email === 'novo@docesdaana.com.br'), 1)
  })

  it('e-mail já cadastrado é recusado com mensagem', async () => {
    await comConfeitariaAtiva()
    const usuarios = useUsuariosStore()
    await usuarios.fetchUsuarios()

    const perfil = usuarios.perfis[0]
    const convidado = await usuarios.convidar('Duplicada', 'carla@docesdaana.com.br', perfil.id)

    expect(convidado).toBeNull()
    expect(usuarios.erro).toBeTruthy()
  })
})
