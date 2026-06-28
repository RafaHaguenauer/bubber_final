import { Driver } from '../../../domain/entities/Driver'
import type { IDriverServicePort } from '../../../domain/ports/IDriverServicePort'

export class ListDriversUseCase {
  constructor(private readonly driverPort: IDriverServicePort) {}

  async execute(): Promise<Driver[]> {
    return this.driverPort.listDrivers()
  }
}
