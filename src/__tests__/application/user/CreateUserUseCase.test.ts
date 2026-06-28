import { describe, it, expect, vi } from 'vitest'
import { CreateUserUseCase } from '../../../application/use-cases/user/CreateUserUseCase'
import { makeMockUserRepo } from '../../helpers/mockRepositories'
import { User } from '../../../domain/entities/User'
import { DomainError } from '../../../shared/errors/DomainError'

const input = {
  name: 'João Silva',
  email: 'joao@email.com',
  phone: '21999999999',
  password: 'senha123',
}

describe('CreateUserUseCase', () => {
  it('deve criar usuário quando email não existe', async () => {
    const repo = makeMockUserRepo()
    const useCase = new CreateUserUseCase(repo)

    const result = await useCase.execute(input)

    expect(result).toBeInstanceOf(User)
    expect(result.name).toBe(input.name)
    expect(result.email).toBe(input.email)
    expect(repo.create).toHaveBeenCalledOnce()
  })

  it('deve gerar um id único (uuid)', async () => {
    const repo = makeMockUserRepo()
    const useCase = new CreateUserUseCase(repo)

    const result = await useCase.execute(input)

    expect(result.id).toBeTruthy()
    expect(result.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    )
  })

  it('deve lançar DomainError quando email já está em uso', async () => {
    const existingUser = User.create('existing-id', 'Outro', input.email, '21888888888', 'abc')
    const repo = makeMockUserRepo({
      findByEmail: vi.fn(async () => existingUser),
    })
    const useCase = new CreateUserUseCase(repo)

    await expect(useCase.execute(input)).rejects.toThrow(DomainError)
    await expect(useCase.execute(input)).rejects.toThrow('already in use')
    expect(repo.create).not.toHaveBeenCalled()
  })

  it('deve verificar email antes de criar', async () => {
    const repo = makeMockUserRepo()
    const useCase = new CreateUserUseCase(repo)

    await useCase.execute(input)

    expect(repo.findByEmail).toHaveBeenCalledWith(input.email)
  })
})
