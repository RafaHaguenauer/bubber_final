import { describe, it, expect } from 'vitest'
import { Money } from '../../../domain/value-objects/Money'
import { ValidationError } from '../../../shared/errors/ValidationError'
import { DomainError } from '../../../shared/errors/DomainError'

describe('Money (Value Object)', () => {
  describe('criação', () => {
    it('deve criar com valor positivo', () => {
      const money = new Money(50)
      expect(money.amount).toBe(50)
      expect(money.currency).toBe('BRL')
    })

    it('deve aceitar valor zero', () => {
      const money = new Money(0)
      expect(money.amount).toBe(0)
    })

    it('deve arredondar para 2 casas decimais', () => {
      const money = new Money(10.555)
      expect(money.amount).toBe(10.56)
    })

    it('deve rejeitar valor negativo', () => {
      expect(() => new Money(-1)).toThrow(ValidationError)
      expect(() => new Money(-1)).toThrow('cannot be negative')
    })

    it('deve aceitar moeda personalizada', () => {
      const money = new Money(100, 'USD')
      expect(money.currency).toBe('USD')
    })
  })

  describe('imutabilidade', () => {
    it('deve ser congelado (imutável)', () => {
      const money = new Money(10)
      expect(Object.isFrozen(money)).toBe(true)
    })
  })

  describe('add()', () => {
    it('deve somar dois valores da mesma moeda', () => {
      const a = new Money(30)
      const b = new Money(20)
      const result = a.add(b)
      expect(result.amount).toBe(50)
    })

    it('deve retornar nova instância ao somar', () => {
      const a = new Money(30)
      const b = new Money(20)
      const result = a.add(b)
      expect(result).not.toBe(a)
      expect(result).not.toBe(b)
    })

    it('deve lançar DomainError ao somar moedas diferentes', () => {
      const brl = new Money(10, 'BRL')
      const usd = new Money(10, 'USD')
      expect(() => brl.add(usd)).toThrow(DomainError)
    })
  })

  describe('equals()', () => {
    it('deve ser igual a outro Money com mesmo valor e moeda', () => {
      expect(new Money(10).equals(new Money(10))).toBe(true)
    })

    it('não deve ser igual com valores diferentes', () => {
      expect(new Money(10).equals(new Money(20))).toBe(false)
    })
  })
})
