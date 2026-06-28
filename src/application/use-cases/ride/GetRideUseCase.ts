import { Ride } from '../../../domain/entities/Ride'
import type { IRideRepository } from '../../../domain/repositories/IRideRepository'
import { NotFoundError } from '../../../shared/errors/NotFoundError'

export class GetRideUseCase {
  constructor(private readonly repo: IRideRepository) {}

  async execute(id: string): Promise<Ride> {
    const ride = await this.repo.findById(id)
    if (!ride) throw new NotFoundError('Ride', id)
    return ride
  }
}
