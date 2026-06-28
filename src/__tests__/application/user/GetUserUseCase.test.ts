import { describe, it, expect, vi } from 'vitest'
import { GetUserUseCase } from '../../../application/use-cases/user/GetUserUseCase'
import { makeMockUserRepo } from '../../helpers/mockRepositories'
import { User } from '../../../domain/entities/User'
import { NotFoundError } from '../../../shared/errors/NotFoundError'

describe('GetUserUseCase', () => {
  it('deve retornar o usuário quando encontrado', async () => {
    const user = User.create('user-1', 'João', 'joao@email.com', '21999', 'senha')
    const repo = makeMockUserRepo({ findById: vi.fn(async () => user) })
    const useCase = new GetUserUseCase(repo)

    const result = await useCase.execute('user-1')

    expect(result).toEqual(user)
    expect(repo.findById).toHaveBeenCalledWith('user-1')
  })

  it('deve lançar NotFoundError quando usuário não existe', async () => {
    const repo = makeMockUserRepo({ findById: vi.fn(async () => null) })
    const useCase = new GetUserUseCase(repo)

    await expect(useCase.execute('id-inexistente')).rejects.toThrow(NotFoundError)
    await expect(useCase.execute('id-inexistente')).rejects.toThrow('User')
  })
})
