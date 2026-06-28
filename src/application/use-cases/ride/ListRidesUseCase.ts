import { Ride } from '../../../domain/entities/Ride'
import type { IRideRepository } from '../../../domain/repositories/IRideRepository'

export class ListRidesUseCase {
  constructor(private readonly repo: IRideRepository) {}

  async execute(filter?: { userId?: string; driverId?: string }): Promise<Ride[]> {
    if (filter?.userId) return this.repo.findByUserId(filter.userId)
    if (filter?.driverId) return this.repo.findByDriverId(filter.driverId)
    return this.repo.findAll()
  }
}
