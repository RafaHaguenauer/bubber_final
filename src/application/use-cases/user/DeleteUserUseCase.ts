import type { IUserRepository } from '../../../domain/repositories/IUserRepository'
import { NotFoundError } from '../../../shared/errors/NotFoundError'

export class DeleteUserUseCase {
  constructor(private readonly repo: IUserRepository) {}

  async execute(id: string): Promise<boolean> {
    const existing = await this.repo.findById(id)
    if (!existing) throw new NotFoundError('User', id)
    await this.repo.delete(id)
    return true
  }
}
