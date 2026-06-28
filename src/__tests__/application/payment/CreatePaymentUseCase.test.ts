import { describe, it, expect } from 'vitest'
import { CreatePaymentUseCase } from '../../../application/use-cases/payment/CreatePaymentUseCase'
import { makeMockPaymentRepo } from '../../helpers/mockRepositories'
import { Payment, PaymentMethod, PaymentStatus } from '../../../domain/entities/Payment'

const input = {
  rideId: 'ride-1',
  amount: 42.50,
  method: 'PIX',
}

describe('CreatePaymentUseCase', () => {
  it('deve criar pagamento com status PENDING', async () => {
    const repo = makeMockPaymentRepo()
    const useCase = new CreatePaymentUseCase(repo)

    const result = await useCase.execute(input)

    expect(result).toBeInstanceOf(Payment)
    expect(result.status).toBe(PaymentStatus.PENDING)
    expect(result.method).toBe(PaymentMethod.PIX)
    expect(result.rideId).toBe('ride-1')
  })

  it('deve criar Money VO com o valor correto', async () => {
    const repo = makeMockPaymentRepo()
    const useCase = new CreatePaymentUseCase(repo)

    const result = await useCase.execute(input)

    expect(result.amount.amount).toBe(42.50)
    expect(result.amount.currency).toBe('BRL')
  })

  it('deve persistir o pagamento', async () => {
    const repo = makeMockPaymentRepo()
    const useCase = new CreatePaymentUseCase(repo)

    await useCase.execute(input)

    expect(repo.create).toHaveBeenCalledOnce()
  })
})
