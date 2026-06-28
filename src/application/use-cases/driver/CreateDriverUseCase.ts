import { randomUUID } from 'crypto'
import { Driver } from '../../../domain/entities/Driver'
import type { IDriverServicePort } from '../../../domain/ports/IDriverServicePort'
import { DomainError } from '../../../shared/errors/DomainError'

export interface CreateDriverInput {
  name: string
  email: string
  phone: string
  password: string
}

export class CreateDriverUseCase {
  constructor(private readonly driverPort: IDriverServicePort) {}

  async execute(input: CreateDriverInput): Promise<Driver> {
    const existing = await this.driverPort.getDriverByEmail(input.email)
    if (existing) throw new DomainError(`Email "${input.email}" is already in use`)
    const driver = Driver.create(randomUUID(), input.name, input.email, input.phone, input.password)
    return this.driverPort.createDriver(driver)
  }
}
