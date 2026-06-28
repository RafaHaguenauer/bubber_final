import { User } from '../../../domain/entities/User'
import type { IUserRepository } from '../../../domain/repositories/IUserRepository'
import { NotFoundError } from '../../../shared/errors/NotFoundError'

export class GetUserUseCase {
  constructor(private readonly repo: IUserRepository) {}

  async execute(id: string): Promise<User> {
    const user = await this.repo.findById(id)
    if (!user) throw new NotFoundError('User', id)
    return user
  }
}
