import type { IDriverServicePort } from '../../../domain/ports/IDriverServicePort'
import { NotFoundError } from '../../../shared/errors/NotFoundError'

export class DeleteVehicleUseCase {
  constructor(private readonly driverPort: IDriverServicePort) {}

  async execute(id: string): Promise<boolean> {
    const existing = await this.driverPort.getVehicle(id)
    if (!existing) throw new NotFoundError('Vehicle', id)
    await this.driverPort.deleteVehicle(id)
    return true
  }
}
