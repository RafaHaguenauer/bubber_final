import { Vehicle } from '../../../domain/entities/Vehicle'
import type { IDriverServicePort } from '../../../domain/ports/IDriverServicePort'

export class ListVehiclesUseCase {
  constructor(private readonly driverPort: IDriverServicePort) {}

  async execute(filter?: { driverId?: string }): Promise<Vehicle[]> {
    if (filter?.driverId) return this.driverPort.listVehiclesByDriver(filter.driverId)
    return []  // listagem global de veículos não é suportada — use filtro por motorista
  }
}
