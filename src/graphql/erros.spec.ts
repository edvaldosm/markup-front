/**
 * O que estes testes protegem: que o usuário nunca receba a mensagem errada
 * sobre o próprio acesso. Em especial, que **queda de servidor não seja
 * confundida com ausência de dados** — o erro que faz alguém achar que perdeu o
 * cadastro.
 */
import { describe, it, expect } from 'vitest'
import { classificarErro, mensagemDeErro, ehSessaoExpirada } from './erros'

function erroGraphQL(classification: string, message = 'Unauthorized') {
  return { graphQLErrors: [{ message, extensions: { classification } }] }
}

describe('classificação de erro da API', () => {
  it('UNAUTHORIZED em login é credencial, não sessão expirada', () => {
    const erro = classificarErro(erroGraphQL('UNAUTHORIZED'), 'login')
    expect(erro.tipo).toBe('CREDENCIAL')
    expect(erro.mensagem).toMatch(/senha/i)
  })

  it('UNAUTHORIZED em qualquer outra operação é sessão expirada', () => {
    const erro = classificarErro(erroGraphQL('UNAUTHORIZED'), 'minhasEmpresas')
    expect(erro.tipo).toBe('SESSAO_EXPIRADA')
    expect(erro.mensagem).toMatch(/sess/i)
  })

  it('FORBIDDEN é falta de autorização, não de autenticação', () => {
    expect(classificarErro(erroGraphQL('FORBIDDEN'), 'todasEmpresas').tipo).toBe('SEM_AUTORIZACAO')
  })

  it('BAD_REQUEST preserva a mensagem do domínio', () => {
    const erro = classificarErro(
      erroGraphQL('BAD_REQUEST', 'Alíquota deve ser positiva.'),
      'salvarImposto',
    )
    expect(erro.tipo).toBe('ENTRADA_INVALIDA')
    expect(erro.mensagem).toBe('Alíquota deve ser positiva.')
  })

  it('servidor inacessível não vira lista vazia nem erro genérico', () => {
    const erro = classificarErro({ networkError: new Error('Failed to fetch') }, 'minhasEmpresas')
    expect(erro.tipo).toBe('SERVIDOR_INACESSIVEL')
    expect(erro.mensagem).toMatch(/servidor/i)
  })

  it('erro com resposta do servidor prevalece sobre falha de rede', () => {
    // Apollo pode preencher os dois campos; o erro do domínio é mais específico.
    const erro = classificarErro(
      { networkError: new Error('500'), ...erroGraphQL('FORBIDDEN') },
      'todasEmpresas',
    )
    expect(erro.tipo).toBe('SEM_AUTORIZACAO')
  })

  it('erro desconhecido tem mensagem, nunca `undefined` na tela', () => {
    expect(mensagemDeErro(null)).toBeTruthy()
    expect(mensagemDeErro({})).toBeTruthy()
  })
})

describe('detecção de sessão expirada (gatilho da renovação)', () => {
  it('reconhece UNAUTHORIZED entre os erros', () => {
    expect(ehSessaoExpirada([{ extensions: { classification: 'UNAUTHORIZED' } }])).toBe(true)
  })

  it('não dispara para erro de autorização nem para lista vazia', () => {
    expect(ehSessaoExpirada([{ extensions: { classification: 'FORBIDDEN' } }])).toBe(false)
    expect(ehSessaoExpirada([])).toBe(false)
    expect(ehSessaoExpirada(undefined)).toBe(false)
  })
})
