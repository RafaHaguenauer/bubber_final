import type { IPaymentRepository } from '../../../domain/repositories/IPaymentRepository'
import { NotFoundError } from '../../../shared/errors/NotFoundError'

export class DeletePaymentUseCase {
  constructor(private readonly repo: IPaymentRepository) {}

  async execute(id: string): Promise<boolean> {
    const existing = await this.repo.findById(id)
    if (!existing) throw new NotFoundError('Payment', id)
    await this.repo.delete(id)
    return true
  }
}
