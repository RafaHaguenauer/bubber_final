import { User } from '../../../domain/entities/User'
import type { IUserRepository } from '../../../domain/repositories/IUserRepository'

export class ListUsersUseCase {
  constructor(private readonly repo: IUserRepository) {}

  async execute(): Promise<User[]> {
    return this.repo.findAll()
  }
}
