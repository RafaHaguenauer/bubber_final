import type { IDriverServicePort } from '../../../domain/ports/IDriverServicePort'
import { NotFoundError } from '../../../shared/errors/NotFoundError'

export class DeleteDriverUseCase {
  constructor(private readonly driverPort: IDriverServicePort) {}

  async execute(id: string): Promise<boolean> {
    const existing = await this.driverPort.getDriver(id)
    if (!existing) throw new NotFoundError('Driver', id)
    await this.driverPort.deleteDriver(id)
    return true
  }
}
