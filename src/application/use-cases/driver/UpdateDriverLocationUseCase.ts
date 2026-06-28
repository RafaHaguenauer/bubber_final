import type { IDriverServicePort } from '../../../domain/ports/IDriverServicePort'

export class UpdateDriverLocationUseCase {
  constructor(private readonly driverPort: IDriverServicePort) {}

  async execute(driverId: string, lat: number, lng: number): Promise<boolean> {
    await this.driverPort.updateLocation(driverId, lat, lng)
    return true
  }
}
