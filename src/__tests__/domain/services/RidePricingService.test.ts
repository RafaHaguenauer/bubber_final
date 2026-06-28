import { describe, it, expect } from 'vitest'
import { RidePricingService } from '../../../domain/services/RidePricingService'
import { BASE_PRICE, PRICE_PER_KM } from '../../../shared/constants'

describe('RidePricingService (Domain Service)', () => {
  const service = new RidePricingService()

  it('deve calcular preço = base + km * tarifa', () => {
    const price = service.estimate(10)
    const expected = BASE_PRICE + 10 * PRICE_PER_KM
    expect(price.amount).toBeCloseTo(expected)
  })

  it('deve retornar Money com moeda BRL', () => {
    const price = service.estimate(5)
    expect(price.currency).toBe('BRL')
  })

  it('deve retornar preço base para distância zero', () => {
    const price = service.estimate(0)
    expect(price.amount).toBe(BASE_PRICE)
  })

  it('deve calcular corretamente para distância de 1 km', () => {
    const price = service.estimate(1)
    expect(price.amount).toBe(BASE_PRICE + PRICE_PER_KM)
  })

  it('deve arredondar para 2 casas decimais', () => {
    const price = service.estimate(1.333)
    expect(price.amount.toString()).toMatch(/^\d+\.\d{1,2}$/)
  })
})
