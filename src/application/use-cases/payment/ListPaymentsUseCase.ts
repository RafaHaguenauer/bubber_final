import { Payment } from '../../../domain/entities/Payment'
import type { IPaymentRepository } from '../../../domain/repositories/IPaymentRepository'

export class ListPaymentsUseCase {
  constructor(private readonly repo: IPaymentRepository) {}

  async execute(): Promise<Payment[]> {
    return this.repo.findAll()
  }
}
