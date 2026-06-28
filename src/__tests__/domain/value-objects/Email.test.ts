import { describe, it, expect } from 'vitest'
import { Email } from '../../../domain/value-objects/Email'
import { ValidationError } from '../../../shared/errors/ValidationError'

describe('Email (Value Object)', () => {
  describe('criação válida', () => {
    it('deve aceitar email válido', () => {
      const email = new Email('joao@email.com')
      expect(email.value).toBe('joao@email.com')
    })

    it('deve normalizar para minúsculas', () => {
      const email = new Email('JOAO@EMAIL.COM')
      expect(email.value).toBe('joao@email.com')
    })

    it('deve remover espaços nas bordas', () => {
      const email = new Email('  joao@email.com  ')
      expect(email.value).toBe('joao@email.com')
    })
  })

  describe('validação', () => {
    it('deve rejeitar email sem @', () => {
      expect(() => new Email('emailinvalido')).toThrow(ValidationError)
    })

    it('deve rejeitar email sem domínio', () => {
      expect(() => new Email('joao@')).toThrow(ValidationError)
    })

    it('deve rejeitar email sem usuário', () => {
      expect(() => new Email('@email.com')).toThrow(ValidationError)
    })

    it('deve rejeitar string vazia', () => {
      expect(() => new Email('')).toThrow(ValidationError)
    })
  })

  describe('equals()', () => {
    it('deve ser igual a outro Email com mesmo valor', () => {
      const a = new Email('joao@email.com')
      const b = new Email('JOAO@EMAIL.COM')
      expect(a.equals(b)).toBe(true)
    })

    it('não deve ser igual a Email diferente', () => {
      const a = new Email('joao@email.com')
      const b = new Email('maria@email.com')
      expect(a.equals(b)).toBe(false)
    })
  })
})
