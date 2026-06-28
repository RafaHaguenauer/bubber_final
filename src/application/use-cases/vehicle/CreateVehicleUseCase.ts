import { randomUUID } from 'crypto'
import { Vehicle } from '../../../domain/entities/Vehicle'
import type { IDriverServicePort } from '../../../domain/ports/IDriverServicePort'
import { DomainError } from '../../../shared/errors/DomainError'

export interface CreateVehicleInput {
  driverId: string
  plate: string
  brand: string
  model: string
  year: number
  color: string
}

export class CreateVehicleUseCase {
  constructor(private readonly driverPort: IDriverServicePort) {}

  async execute(input: CreateVehicleInput): Promise<Vehicle> {
    const existing = await this.driverPort.getVehicleByPlate(input.plate)
    if (existing) throw new DomainError(`Plate "${input.plate}" already registered`)
    const vehicle = Vehicle.create(
      randomUUID(),
      input.driverId,
      input.plate,
      input.brand,
      input.model,
      input.year,
      input.color,
    )
    return this.driverPort.createVehicle(vehicle)
  }
}
