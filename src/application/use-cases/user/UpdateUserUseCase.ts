import { User } from '../../../domain/entities/User'
import type { IUserRepository } from '../../../domain/repositories/IUserRepository'
import { NotFoundError } from '../../../shared/errors/NotFoundError'

export interface UpdateUserInput {
  id: string
  name?: string | null
  email?: string | null
  phone?: string | null
}

export class UpdateUserUseCase {
  constructor(private readonly repo: IUserRepository) {}

  async execute(input: UpdateUserInput): Promise<User> {
    const existing = await this.repo.findById(input.id)
    if (!existing) throw new NotFoundError('User', input.id)

    const updated = new User(
      existing.id,
      input.name ?? existing.name,
      input.email ?? existing.email,
      input.phone ?? existing.phone,
      existing.password,
      existing.createdAt,
      new Date(),
    )
    return this.repo.update(updated)
  }
}
