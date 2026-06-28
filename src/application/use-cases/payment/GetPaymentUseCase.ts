import { Payment } from '../../../domain/entities/Payment'
import type { IPaymentRepository } from '../../../domain/repositories/IPaymentRepository'
import { NotFoundError } from '../../../shared/errors/NotFoundError'

export class GetPaymentUseCase {
  constructor(private readonly repo: IPaymentRepository) {}

  async execute(id: string): Promise<Payment> {
    const payment = await this.repo.findById(id)
    if (!payment) throw new NotFoundError('Payment', id)
    return payment
  }

  async byRideId(rideId: string): Promise<Payment | null> {
    return this.repo.findByRideId(rideId)
  }
}
