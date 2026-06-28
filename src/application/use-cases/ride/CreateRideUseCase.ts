import { randomUUID } from 'crypto'
import { Ride } from '../../../domain/entities/Ride'
import { Coordinates } from '../../../domain/value-objects/Coordinates'
import type { IRideRepository } from '../../../domain/repositories/IRideRepository'

export interface CreateRideInput {
  userId: string
  originLat: number
  originLng: number
  originAddress: string
  destLat: number
  destLng: number
  destAddress: string
}

export class CreateRideUseCase {
  constructor(private readonly repo: IRideRepository) {}

  async execute(input: CreateRideInput): Promise<Ride> {
    const ride = Ride.create(
      randomUUID(),
      input.userId,
      null,
      new Coordinates(input.originLat, input.originLng),
      input.originAddress,
      new Coordinates(input.destLat, input.destLng),
      input.destAddress,
    )
    return this.repo.create(ride)
  }
}
