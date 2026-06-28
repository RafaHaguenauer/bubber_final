import { randomUUID } from 'crypto'
import { User } from '../../../domain/entities/User'
import type { IUserRepository } from '../../../domain/repositories/IUserRepository'
import { DomainError } from '../../../shared/errors/DomainError'

export interface CreateUserInput {
  name: string
  email: string
  phone: string
  password: string
}

export class CreateUserUseCase {
  constructor(private readonly repo: IUserRepository) {}

  async execute(input: CreateUserInput): Promise<User> {
    const existing = await this.repo.findByEmail(input.email)
    if (existing) throw new DomainError(`Email "${input.email}" is already in use`)
    const user = User.create(randomUUID(), input.name, input.email, input.phone, input.password)
    return this.repo.create(user)
  }
}
