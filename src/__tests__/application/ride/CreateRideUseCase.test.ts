import { describe, it, expect } from 'vitest'
import { CreateRideUseCase } from '../../../application/use-cases/ride/CreateRideUseCase'
import { makeMockRideRepo } from '../../helpers/mockRepositories'
import { Ride, RideStatus } from '../../../domain/entities/Ride'

const input = {
  userId: 'user-1',
  originLat: -22.91,
  originLng: -43.17,
  originAddress: 'Origem',
  destLat: -22.95,
  destLng: -43.21,
  destAddress: 'Destino',
}

describe('CreateRideUseCase', () => {
  it('deve criar corrida com status PENDING sem motorista', async () => {
    const repo = makeMockRideRepo()
    const useCase = new CreateRideUseCase(repo)

    const result = await useCase.execute(input)

    expect(result).toBeInstanceOf(Ride)
    expect(result.status).toBe(RideStatus.PENDING)
    expect(result.driverId).toBeNull()
    expect(result.price).toBeNull()
  })

  it('deve armazenar coordenadas corretamente nos VOs', async () => {
    const repo = makeMockRideRepo()
    const useCase = new CreateRideUseCase(repo)

    const result = await useCase.execute(input)

    expect(result.origin.lat).toBe(-22.91)
    expect(result.origin.lng).toBe(-43.17)
    expect(result.destination.lat).toBe(-22.95)
    expect(result.destination.lng).toBe(-43.21)
  })

  it('deve persistir a corrida no repositório', async () => {
    const repo = makeMockRideRepo()
    const useCase = new CreateRideUseCase(repo)

    await useCase.execute(input)

    expect(repo.create).toHaveBeenCalledOnce()
  })
})
