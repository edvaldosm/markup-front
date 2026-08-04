/**
 * O que este componente não pode fazer: aparecer sem dizer por quê. Um "—" mudo
 * parece bug; um motivo explícito diz que é limitação temporária e registrada.
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import IndisponivelBackend from './IndisponivelBackend.vue'

describe('IndisponivelBackend', () => {
  it('sempre renderiza o motivo recebido (padrão: tooltip)', () => {
    const wrapper = mount(IndisponivelBackend, {
      props: { motivo: 'Campo X não existe no contrato ainda.' },
    })
    expect(wrapper.text()).toContain('Indisponível')
    expect(wrapper.attributes('title')).toBe('Campo X não existe no contrato ainda.')
  })

  it('tamanho="linha" põe o motivo no title (tooltip), não solto no texto', () => {
    const wrapper = mount(IndisponivelBackend, {
      props: { motivo: 'Motivo específico da linha', tamanho: 'linha' },
    })
    expect(wrapper.find('.indisponivel--linha').attributes('title')).toBe('Motivo específico da linha')
  })

  it('tamanho="bloco" imprime o motivo por extenso, visível sem hover', () => {
    const wrapper = mount(IndisponivelBackend, {
      props: { motivo: 'Motivo explicado por extenso', tamanho: 'bloco' },
    })
    expect(wrapper.text()).toContain('Motivo explicado por extenso')
  })

  it('avisa em runtime se algum lugar omitir o motivo', () => {
    const avisos: unknown[] = []
    const original = console.warn
    console.warn = (...args: unknown[]) => { avisos.push(args) }
    try {
      // @ts-expect-error — motivo é obrigatório; o teste prova que Vue barra em runtime também
      mount(IndisponivelBackend, { props: {} })
    } finally {
      console.warn = original
    }
    expect(avisos.some(a => String(a).includes('motivo'))).toBe(true)
  })
})
