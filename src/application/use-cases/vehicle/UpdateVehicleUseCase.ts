import { Vehicle } from '../../../domain/entities/Vehicle'
import type { IDriverServicePort } from '../../../domain/ports/IDriverServicePort'
import { NotFoundError } from '../../../shared/errors/NotFoundError'

export interface UpdateVehicleInput {
  id: string
  plate?: string | null
  brand?: string | null
  model?: string | null
  year?: number | null
  color?: string | null
}

export class UpdateVehicleUseCase {
  constructor(private readonly driverPort: IDriverServicePort) {}

  async execute(input: UpdateVehicleInput): Promise<Vehicle> {
    const existing = await this.driverPort.getVehicle(input.id)
    if (!existing) throw new NotFoundError('Vehicle', input.id)
    return this.driverPort.updateVehicle(input.id, {
      plate: input.plate ?? undefined,
      brand: input.brand ?? undefined,
      model: input.model ?? undefined,
      year:  input.year  ?? undefined,
      color: input.color ?? undefined,
    })
  }
}
