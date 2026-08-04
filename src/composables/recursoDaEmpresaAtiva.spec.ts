/**
 * O que estes testes protegem: que **nunca apareça dado de uma empresa na tela
 * de outra**. É a garantia B2/B9 no cliente — o servidor filtra certo, mas uma
 * resposta que chega fora de ordem consegue estragar isso sem erro nenhum.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import { recursoDaEmpresaAtiva } from './recursoDaEmpresaAtiva'
import { useEmpresaStore } from '@/stores/empresa'

/** Promise que o teste resolve na hora que quiser — para forçar a ordem. */
function promessaControlada<T>() {
  let resolver!: (valor: T) => void
  const promessa = new Promise<T>(r => { resolver = r })
  return { promessa, resolver }
}

function comEmpresaAtiva(id: string) {
  const empresa = useEmpresaStore()
  empresa.empresaAtivaId = id
  return empresa
}

describe('recurso da empresa ativa', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('carrega e aplica o resultado da empresa ativa', async () => {
    comEmpresaAtiva('1')
    const aplicados: string[] = []

    const recurso = recursoDaEmpresaAtiva({
      buscar: async (empresaId) => `dados-${empresaId}`,
      aplicar: (dados) => aplicados.push(dados),
      limpar: () => {},
      aoFalhar: () => {},
    })

    await recurso.carregar()

    expect(aplicados).toEqual(['dados-1'])
    expect(recurso.carregado.value).toBe(true)
  })

  it('descarta a resposta da empresa anterior quando ela chega atrasada', async () => {
    const empresa = comEmpresaAtiva('1')
    const aplicados: string[] = []
    const pendentes = new Map<string, ReturnType<typeof promessaControlada<string>>>()

    const recurso = recursoDaEmpresaAtiva({
      buscar: (empresaId) => {
        const controlada = promessaControlada<string>()
        pendentes.set(empresaId, controlada)
        return controlada.promessa
      },
      aplicar: (dados) => aplicados.push(dados),
      limpar: () => {},
      aoFalhar: () => {},
    })

    // Consulta da empresa 1 sai e fica pendente
    const daPrimeira = recurso.carregar()

    // Usuário troca de empresa: o watch dispara a consulta da 3
    empresa.empresaAtivaId = '3'
    await nextTick()

    // A resposta da 3 chega primeiro; a da 1 chega depois — a ordem que quebra
    pendentes.get('3')!.resolver('dados-3')
    await new Promise(r => setTimeout(r, 0))
    pendentes.get('1')!.resolver('dados-1')
    await daPrimeira

    // A lista final é da empresa ativa. Sem o descarte, 'dados-1' entraria por
    // último e o usuário veria o catálogo da empresa que ele acabou de deixar.
    expect(aplicados).toEqual(['dados-3'])
  })

  it('trocar de empresa esvazia antes de buscar', async () => {
    const empresa = comEmpresaAtiva('1')
    const eventos: string[] = []

    recursoDaEmpresaAtiva({
      buscar: async (empresaId) => {
        eventos.push(`buscou-${empresaId}`)
        return empresaId
      },
      aplicar: (dados) => eventos.push(`aplicou-${dados}`),
      limpar: () => eventos.push('limpou'),
      aoFalhar: () => {},
    })

    empresa.empresaAtivaId = '3'
    await nextTick()
    await new Promise(r => setTimeout(r, 0))

    // Limpar antes de buscar é o que impede a tela de exibir o catálogo antigo
    // enquanto o novo carrega.
    expect(eventos).toEqual(['limpou', 'buscou-3', 'aplicou-3'])
  })

  it('sem empresa ativa, esvazia e não consulta', async () => {
    comEmpresaAtiva('')
    let buscas = 0

    const recurso = recursoDaEmpresaAtiva({
      buscar: async () => { buscas += 1; return 'x' },
      aplicar: () => {},
      limpar: () => {},
      aoFalhar: () => {},
    })

    await recurso.carregar()

    expect(buscas).toBe(0)
    expect(recurso.carregado.value).toBe(false)
  })

  it('falha vira mensagem e esvazia — nunca lista velha na tela', async () => {
    comEmpresaAtiva('1')
    let mensagem: unknown = null
    let limpou = false

    const recurso = recursoDaEmpresaAtiva({
      buscar: async () => { throw new Error('rede caiu') },
      aplicar: () => {},
      limpar: () => { limpou = true },
      aoFalhar: (erro) => { mensagem = erro },
    })

    await recurso.carregar()

    expect(limpou).toBe(true)
    expect(mensagem).toBeInstanceOf(Error)
    expect(recurso.carregado.value).toBe(false)
  })

  it('falha da empresa anterior não vira mensagem na tela da atual', async () => {
    const empresa = comEmpresaAtiva('1')
    let mensagem: unknown = null
    let rejeitar!: (erro: unknown) => void
    const daEmpresaUm = new Promise<string>((_, rej) => { rejeitar = rej })

    const recurso = recursoDaEmpresaAtiva({
      buscar: (empresaId) => (empresaId === '1' ? daEmpresaUm : Promise.resolve('ok')),
      aplicar: () => {},
      limpar: () => {},
      aoFalhar: (erro) => { mensagem = erro },
    })

    const daPrimeira = recurso.carregar()
    empresa.empresaAtivaId = '3'
    await nextTick()

    // A consulta abandonada falha depois da troca. Exibir esse erro acusaria a
    // tela da empresa 3 de um problema que não é dela.
    rejeitar(new Error('rede caiu na consulta abandonada'))
    await daPrimeira

    expect(mensagem).toBeNull()
  })
})
