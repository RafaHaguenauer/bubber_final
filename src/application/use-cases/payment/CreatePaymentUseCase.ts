import { randomUUID } from 'crypto'
import { Payment, PaymentMethod } from '../../../domain/entities/Payment'
import { Money } from '../../../domain/value-objects/Money'
import type { IPaymentRepository } from '../../../domain/repositories/IPaymentRepository'

export interface CreatePaymentInput {
  rideId: string
  amount: number
  method: string
}

export class CreatePaymentUseCase {
  constructor(private readonly repo: IPaymentRepository) {}

  async execute(input: CreatePaymentInput): Promise<Payment> {
    const payment = Payment.create(
      randomUUID(),
      input.rideId,
      new Money(input.amount),
      input.method as PaymentMethod,
    )
    return this.repo.create(payment)
  }
}
