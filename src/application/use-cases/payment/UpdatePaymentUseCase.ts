import { Payment, PaymentMethod, PaymentStatus } from '../../../domain/entities/Payment'
import { Money } from '../../../domain/value-objects/Money'
import type { IPaymentRepository } from '../../../domain/repositories/IPaymentRepository'
import { NotFoundError } from '../../../shared/errors/NotFoundError'

export interface UpdatePaymentInput {
  id: string
  status?: string | null
  method?: string | null
  amount?: number | null
}

export class UpdatePaymentUseCase {
  constructor(private readonly repo: IPaymentRepository) {}

  async execute(input: UpdatePaymentInput): Promise<Payment> {
    const existing = await this.repo.findById(input.id)
    if (!existing) throw new NotFoundError('Payment', input.id)

    const updated = new Payment(
      existing.id,
      existing.rideId,
      input.amount != null ? new Money(input.amount) : existing.amount,
      (input.method as PaymentMethod) ?? existing.method,
      (input.status as PaymentStatus) ?? existing.status,
      existing.createdAt,
      new Date(),
    )
    return this.repo.update(updated)
  }
}
