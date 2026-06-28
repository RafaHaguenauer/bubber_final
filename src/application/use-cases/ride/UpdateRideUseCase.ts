import { Ride, RideStatus } from '../../../domain/entities/Ride'
import { Money } from '../../../domain/value-objects/Money'
import type { IRideRepository } from '../../../domain/repositories/IRideRepository'
import { NotFoundError } from '../../../shared/errors/NotFoundError'

export interface UpdateRideInput {
  id: string
  status?: string | null
  driverId?: string | null
  price?: number | null
}

export class UpdateRideUseCase {
  constructor(private readonly repo: IRideRepository) {}

  async execute(input: UpdateRideInput): Promise<Ride> {
    const existing = await this.repo.findById(input.id)
    if (!existing) throw new NotFoundError('Ride', input.id)

    const updated = new Ride(
      existing.id,
      existing.userId,
      input.driverId !== undefined ? input.driverId : existing.driverId,
      (input.status as RideStatus) ?? existing.status,
      existing.origin,
      existing.originAddress,
      existing.destination,
      existing.destAddress,
      input.price != null ? new Money(input.price) : existing.price,
      existing.startedAt,
      existing.finishedAt,
      existing.createdAt,
      new Date(),
    )
    return this.repo.update(updated)
  }
}
