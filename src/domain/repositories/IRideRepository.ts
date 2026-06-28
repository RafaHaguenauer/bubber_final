import type { Ride } from '../entities/Ride'

export interface IRideRepository {
  findById(id: string): Promise<Ride | null>
  findByUserId(userId: string): Promise<Ride[]>
  findByDriverId(driverId: string): Promise<Ride[]>
  findAll(): Promise<Ride[]>
  create(ride: Ride): Promise<Ride>
  update(ride: Ride): Promise<Ride>
  delete(id: string): Promise<void>
}
