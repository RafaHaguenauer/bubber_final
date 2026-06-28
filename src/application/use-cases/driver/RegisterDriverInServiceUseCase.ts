import type { IDriverServicePort } from '../../../domain/ports/IDriverServicePort'
import { NotFoundError } from '../../../shared/errors/NotFoundError'

export class RegisterDriverInServiceUseCase {
  constructor(private readonly driverPort: IDriverServicePort) {}

  async execute(driverId: string): Promise<boolean> {
    const driver = await this.driverPort.getDriver(driverId)
    if (!driver) throw new NotFoundError('Driver', driverId)
    await this.driverPort.registerDriver(driverId, driver.name)
    return true
  }
}
