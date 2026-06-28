import { Vehicle } from '../../../domain/entities/Vehicle'
import type { IDriverServicePort } from '../../../domain/ports/IDriverServicePort'
import { NotFoundError } from '../../../shared/errors/NotFoundError'

export class GetVehicleUseCase {
  constructor(private readonly driverPort: IDriverServicePort) {}

  async execute(id: string): Promise<Vehicle> {
    const vehicle = await this.driverPort.getVehicle(id)
    if (!vehicle) throw new NotFoundError('Vehicle', id)
    return vehicle
  }
}
