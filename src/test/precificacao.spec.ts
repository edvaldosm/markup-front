/**
 * Store de precificação contra o servidor falso.
 *
 * O que estes testes protegem: a lista da empresa ativa vem de **uma única**
 * consulta (`precificarTodos`), não de N chamadas por produto — e erro do
 * servidor (V1, divisor inviável) chega como mensagem, nunca como preço zero
 * silencioso.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { usePrecificacaoStore } from '@/stores/precificacao'
import { useEmpresaStore } from '@/stores/empresa'
import { prepararAmbiente, entrarComo } from './app-harness'
import { type ServidorFalso } from './servidor-falso'

let servidor: ServidorFalso

beforeEach(() => {
  servidor = prepararAmbiente()
})

afterEach(() => {
  servidor.restaurar()
})

async function comConfeitariaAtiva() {
  await entrarComo('ana@docesdaana.com.br')
  const empresa = useEmpresaStore()
  await empresa.fetchEmpresas()
  empresa.selecionarEmpresa('1')
  return empresa
}

describe('precificação — lista da empresa (REQ-01, REQ-02)', () => {
  it('busca a lista inteira numa única consulta de rede', async () => {
    await comConfeitariaAtiva()
    const precificacao = usePrecificacaoStore()

    await precificacao.buscarTodos()

    expect(precificacao.todos.length).toBeGreaterThan(0)
    expect(servidor.chamadas.precificarTodos).toBe(1)
    // nenhuma chamada individual disparada para montar a lista
    expect(servidor.chamadas.precificarProduto).toBeUndefined()
  })

  it('cada resultado traz o produto embutido, ficha já resolvida', async () => {
    await comConfeitariaAtiva()
    const precificacao = usePrecificacaoStore()
    await precificacao.buscarTodos()

    const comFicha = precificacao.todos.find(r => r.produto.ficha.length > 0)!
    expect(comFicha.produto.ficha[0].material.nome).toBeTruthy()
    expect(comFicha.faixaNegociacao.degraus.length).toBeGreaterThan(0)
  })

  it('erro do servidor esvazia a lista com mensagem, nunca preço zero silencioso', async () => {
    await comConfeitariaAtiva()
    const precificacao = usePrecificacaoStore()
    servidor.derrubar()

    await precificacao.buscarTodos()

    expect(precificacao.todos).toEqual([])
    expect(precificacao.erro).toMatch(/servidor/i)
  })
})

describe('precificação — produto individual (REQ-01, REQ-04)', () => {
  it('busca e guarda por produto, reaproveitável entre telas', async () => {
    await comConfeitariaAtiva()
    const precificacao = usePrecificacaoStore()
    await precificacao.buscarTodos()
    const alvo = precificacao.todos[0].produto.id

    const resultado = await precificacao.buscarProduto(alvo)

    expect(resultado).not.toBeNull()
    expect(precificacao.resultadoDe(alvo)?.precoVenda).toBe(resultado!.precoVenda)
  })

  it('produto inexistente devolve erro, não resultado vazio', async () => {
    await comConfeitariaAtiva()
    const precificacao = usePrecificacaoStore()

    const resultado = await precificacao.buscarProduto('produto-que-nao-existe')

    expect(resultado).toBeNull()
    expect(precificacao.erroProduto).toBeTruthy()
  })

  it('trocar de empresa esvazia o cache por produto — nada de outra empresa sobra', async () => {
    await comConfeitariaAtiva()
    const empresa = useEmpresaStore()
    const precificacao = usePrecificacaoStore()
    await precificacao.buscarTodos()
    const alvo = precificacao.todos[0].produto.id
    await precificacao.buscarProduto(alvo)
    expect(precificacao.resultadoDe(alvo)).toBeDefined()

    empresa.selecionarEmpresa('3')
    await new Promise(r => setTimeout(r, 0))

    expect(precificacao.resultadoDe(alvo)).toBeUndefined()
  })
})

describe('logout esvazia a precificação', () => {
  it('reset limpa lista e cache por produto', async () => {
    await comConfeitariaAtiva()
    const precificacao = usePrecificacaoStore()
    await precificacao.buscarTodos()
    await precificacao.buscarProduto(precificacao.todos[0].produto.id)
    expect(precificacao.todos.length).toBeGreaterThan(0)

    precificacao.reset()

    expect(precificacao.todos).toEqual([])
    expect(precificacao.porProdutoId.size).toBe(0)
  })
})
