import { describe, it, expect, vi } from 'vitest'
import { RegisterDriverInServiceUseCase } from '../../../application/use-cases/driver/RegisterDriverInServiceUseCase'
import { makeMockDriverPort } from '../../helpers/mockRepositories'
import { Driver } from '../../../domain/entities/Driver'
import { NotFoundError } from '../../../shared/errors/NotFoundError'

const driver = Driver.create('driver-1', 'Carlos', 'carlos@email.com', '21888', 'senha')

describe('RegisterDriverInServiceUseCase', () => {
  it('deve registrar motorista no serviço gRPC', async () => {
    const driverPort = makeMockDriverPort({
      getDriver: vi.fn(async () => driver),
    })
    const useCase = new RegisterDriverInServiceUseCase(driverPort)

    const result = await useCase.execute('driver-1')

    expect(result).toBe(true)
    expect(driverPort.registerDriver).toHaveBeenCalledWith('driver-1', 'Carlos')
  })

  it('deve lançar NotFoundError quando motorista não existe no Driver Service', async () => {
    const driverPort = makeMockDriverPort()  // getDriver retorna null por padrão
    const useCase = new RegisterDriverInServiceUseCase(driverPort)

    await expect(useCase.execute('nao-existe')).rejects.toThrow(NotFoundError)
    expect(driverPort.registerDriver).not.toHaveBeenCalled()
  })

  it('deve buscar motorista no Driver Service antes de registrar', async () => {
    const driverPort = makeMockDriverPort({
      getDriver: vi.fn(async () => driver),
    })
    const useCase = new RegisterDriverInServiceUseCase(driverPort)

    await useCase.execute('driver-1')

    expect(driverPort.getDriver).toHaveBeenCalledWith('driver-1')
    expect(driverPort.getDriver).toHaveBeenCalledBefore(vi.mocked(driverPort.registerDriver))
  })
})
