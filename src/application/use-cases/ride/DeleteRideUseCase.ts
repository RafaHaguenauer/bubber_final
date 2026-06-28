import type { IRideRepository } from '../../../domain/repositories/IRideRepository'
import { NotFoundError } from '../../../shared/errors/NotFoundError'

export class DeleteRideUseCase {
  constructor(private readonly repo: IRideRepository) {}

  async execute(id: string): Promise<boolean> {
    const existing = await this.repo.findById(id)
    if (!existing) throw new NotFoundError('Ride', id)
    await this.repo.delete(id)
    return true
  }
}
