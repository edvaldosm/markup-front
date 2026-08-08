/**
 * `useCpf` — máscara e validação de dígito verificador (REQ-05/11). O front
 * só dá feedback antes da viagem de rede; a autoridade continua sendo o
 * servidor (Artigo III — validação de formato, não cálculo de domínio).
 */
import { describe, it, expect } from 'vitest'
import { formatarCpf, validarCpf } from './useCpf'

describe('formatarCpf — máscara 000.000.000-00 enquanto digita', () => {
  it('aplica a máscara progressivamente', () => {
    expect(formatarCpf('5')).toBe('5')
    expect(formatarCpf('529')).toBe('529')
    expect(formatarCpf('5299')).toBe('529.9')
    expect(formatarCpf('529982')).toBe('529.982')
    expect(formatarCpf('5299822')).toBe('529.982.2')
    expect(formatarCpf('529982247')).toBe('529.982.247')
    expect(formatarCpf('5299822472')).toBe('529.982.247-2')
    expect(formatarCpf('52998224725')).toBe('529.982.247-25')
  })

  it('ignora caracteres não numéricos e trunca em 11 dígitos', () => {
    expect(formatarCpf('529.982.247-25')).toBe('529.982.247-25')
    expect(formatarCpf('abc529982247259999')).toBe('529.982.247-25')
  })
})

describe('validarCpf — dígito verificador (mesmo algoritmo do backend)', () => {
  it('aceita CPFs válidos, formatados ou não', () => {
    expect(validarCpf('529.982.247-25')).toBe(true)
    expect(validarCpf('52998224725')).toBe(true)
    expect(validarCpf('111.444.777-35')).toBe(true)
    expect(validarCpf('123.456.789-09')).toBe(true)
  })

  it('rejeita dígito verificador errado', () => {
    expect(validarCpf('529.982.247-26')).toBe(false)
    expect(validarCpf('111.444.777-36')).toBe(false)
  })

  it('rejeita tamanho errado', () => {
    expect(validarCpf('')).toBe(false)
    expect(validarCpf('123')).toBe(false)
    expect(validarCpf('529.982.247-255')).toBe(false)
    expect(validarCpf('5299822472')).toBe(false) // 10 dígitos
  })

  it('rejeita sequência de dígito repetido — passa no cálculo, mas não é CPF real', () => {
    for (const seq of ['00000000000', '11111111111', '22222222222', '99999999999']) {
      expect(validarCpf(seq), `${seq} deveria ser rejeitado`).toBe(false)
    }
  })
})
