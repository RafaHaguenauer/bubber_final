import { describe, it, expect, vi } from 'vitest'
import { UpdateUserUseCase } from '../../../application/use-cases/user/UpdateUserUseCase'
import { makeMockUserRepo } from '../../helpers/mockRepositories'
import { User } from '../../../domain/entities/User'
import { NotFoundError } from '../../../shared/errors/NotFoundError'

const existingUser = User.create('user-1', 'João', 'joao@email.com', '21999', 'senha')

describe('UpdateUserUseCase', () => {
  it('deve atualizar campos fornecidos', async () => {
    const repo = makeMockUserRepo({ findById: vi.fn(async () => existingUser) })
    const useCase = new UpdateUserUseCase(repo)

    await useCase.execute({ id: 'user-1', name: 'João Atualizado' })

    const updatedUser = vi.mocked(repo.update).mock.calls[0][0]
    expect(updatedUser.name).toBe('João Atualizado')
    expect(updatedUser.email).toBe('joao@email.com')
  })

  it('deve manter campos não fornecidos', async () => {
    const repo = makeMockUserRepo({ findById: vi.fn(async () => existingUser) })
    const useCase = new UpdateUserUseCase(repo)

    await useCase.execute({ id: 'user-1', email: 'novo@email.com' })

    const updatedUser = vi.mocked(repo.update).mock.calls[0][0]
    expect(updatedUser.name).toBe('João')
    expect(updatedUser.email).toBe('novo@email.com')
    expect(updatedUser.phone).toBe('21999')
  })

  it('deve lançar NotFoundError quando usuário não existe', async () => {
    const repo = makeMockUserRepo()
    const useCase = new UpdateUserUseCase(repo)

    await expect(useCase.execute({ id: 'nao-existe' })).rejects.toThrow(NotFoundError)
    expect(repo.update).not.toHaveBeenCalled()
  })
})
