import type { Vehicle } from '../entities/Vehicle'

export interface IVehicleRepository {
  findById(id: string): Promise<Vehicle | null>
  findByDriverId(driverId: string): Promise<Vehicle[]>
  findByPlate(plate: string): Promise<Vehicle | null>
  findAll(): Promise<Vehicle[]>
  create(vehicle: Vehicle): Promise<Vehicle>
  update(vehicle: Vehicle): Promise<Vehicle>
  delete(id: string): Promise<void>
}
