import { Driver } from '../../../domain/entities/Driver'
import type { IDriverServicePort } from '../../../domain/ports/IDriverServicePort'
import { NotFoundError } from '../../../shared/errors/NotFoundError'

export class GetDriverUseCase {
  constructor(private readonly driverPort: IDriverServicePort) {}

  async execute(id: string): Promise<Driver> {
    const driver = await this.driverPort.getDriver(id)
    if (!driver) throw new NotFoundError('Driver', id)
    return driver
  }
}
