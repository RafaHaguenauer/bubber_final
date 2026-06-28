import type { IDriverServicePort } from '../../../domain/ports/IDriverServicePort'

export class SetDriverAvailabilityUseCase {
  constructor(private readonly driverPort: IDriverServicePort) {}

  async execute(driverId: string, isAvailable: boolean): Promise<boolean> {
    await this.driverPort.setAvailability(driverId, isAvailable)
    return true
  }
}
