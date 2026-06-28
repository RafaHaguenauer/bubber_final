import { Driver } from '../../../domain/entities/Driver'
import type { IDriverServicePort } from '../../../domain/ports/IDriverServicePort'
import { NotFoundError } from '../../../shared/errors/NotFoundError'

export interface UpdateDriverInput {
  id: string
  name?: string | null
  email?: string | null
  phone?: string | null
  rating?: number | null
  isActive?: boolean | null
}

export class UpdateDriverUseCase {
  constructor(private readonly driverPort: IDriverServicePort) {}

  async execute(input: UpdateDriverInput): Promise<Driver> {
    const existing = await this.driverPort.getDriver(input.id)
    if (!existing) throw new NotFoundError('Driver', input.id)
    return this.driverPort.updateDriver(input.id, {
      name:     input.name     ?? undefined,
      email:    input.email    ?? undefined,
      phone:    input.phone    ?? undefined,
      rating:   input.rating   ?? undefined,
      isActive: input.isActive ?? undefined,
    })
  }
}
