import { describe, it, expect } from 'vitest'
import { Coordinates } from '../../../domain/value-objects/Coordinates'
import { ValidationError } from '../../../shared/errors/ValidationError'

describe('Coordinates (Value Object)', () => {
  describe('criação válida', () => {
    it('deve criar coordenadas válidas', () => {
      const coords = new Coordinates(-22.9068, -43.1729)
      expect(coords.lat).toBe(-22.9068)
      expect(coords.lng).toBe(-43.1729)
    })

    it('deve aceitar limites extremos válidos', () => {
      expect(() => new Coordinates(90, 180)).not.toThrow()
      expect(() => new Coordinates(-90, -180)).not.toThrow()
      expect(() => new Coordinates(0, 0)).not.toThrow()
    })
  })

  describe('validação de limites', () => {
    it('deve rejeitar latitude > 90', () => {
      expect(() => new Coordinates(91, 0)).toThrow(ValidationError)
    })

    it('deve rejeitar latitude < -90', () => {
      expect(() => new Coordinates(-91, 0)).toThrow(ValidationError)
    })

    it('deve rejeitar longitude > 180', () => {
      expect(() => new Coordinates(0, 181)).toThrow(ValidationError)
    })

    it('deve rejeitar longitude < -180', () => {
      expect(() => new Coordinates(0, -181)).toThrow(ValidationError)
    })
  })

  describe('imutabilidade', () => {
    it('deve ser congelado', () => {
      expect(Object.isFrozen(new Coordinates(0, 0))).toBe(true)
    })
  })

  describe('equals()', () => {
    it('deve ser igual com mesmas coordenadas', () => {
      const a = new Coordinates(-22.9, -43.1)
      const b = new Coordinates(-22.9, -43.1)
      expect(a.equals(b)).toBe(true)
    })

    it('não deve ser igual com coordenadas diferentes', () => {
      const a = new Coordinates(-22.9, -43.1)
      const b = new Coordinates(-23.0, -43.2)
      expect(a.equals(b)).toBe(false)
    })
  })
})
