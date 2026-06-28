import { describe, it, expect, vi } from 'vitest'
import { RequestRideUseCase } from '../../../application/use-cases/ride/RequestRideUseCase'
import { RidePricingService } from '../../../domain/services/RidePricingService'
import { makeMockRideRepo, makeMockDriverPort, makeMockRoutingPort } from '../../helpers/mockRepositories'
import { Ride, RideStatus } from '../../../domain/entities/Ride'
import { DomainError } from '../../../shared/errors/DomainError'
import { BASE_PRICE, PRICE_PER_KM } from '../../../shared/constants'

const rideInput = {
  userId: 'user-1',
  originLat: -22.91,
  originLng: -43.17,
  originAddress: 'Av. Rio Branco, RJ',
  destLat: -22.95,
  destLng: -43.21,
  destAddress: 'Santa Teresa, RJ',
}

describe('RequestRideUseCase — orquestração completa', () => {
  const pricingService = new RidePricingService()

  it('deve criar corrida com motorista e preço calculados', async () => {
    const rideRepo = makeMockRideRepo()
    const driverPort = makeMockDriverPort()
    const routingPort = makeMockRoutingPort()
    const useCase = new RequestRideUseCase(rideRepo, driverPort, routingPort, pricingService)

    const result = await useCase.execute(rideInput)

    expect(result.ride).toBeInstanceOf(Ride)
    expect(result.ride.userId).toBe('user-1')
    expect(result.ride.driverId).toBe('driver-1')
    expect(result.ride.status).toBe(RideStatus.PENDING)
  })

  it('deve calcular preço com base na distância da rota completa', async () => {
    const distanceKm = 5.3
    const rideRepo = makeMockRideRepo()
    const driverPort = makeMockDriverPort()
    const routingPort = makeMockRoutingPort({
      calculateRoute: vi.fn(async () => ({
        distanceKm,
        durationMinutes: 12,
        polyline: 'abc',
      })),
    })
    const useCase = new RequestRideUseCase(rideRepo, driverPort, routingPort, pricingService)

    const result = await useCase.execute(rideInput)

    const expectedPrice = BASE_PRICE + distanceKm * PRICE_PER_KM
    expect(result.ride.price?.amount).toBeCloseTo(expectedPrice)
  })

  it('deve retornar rotas driverToOrigin e fullRoute', async () => {
    const rideRepo = makeMockRideRepo()
    const driverPort = makeMockDriverPort()
    const routingPort = makeMockRoutingPort()
    const useCase = new RequestRideUseCase(rideRepo, driverPort, routingPort, pricingService)

    const result = await useCase.execute(rideInput)

    expect(result.driverToOriginRoute.distanceKm).toBe(5.3)
    expect(result.fullRoute.distanceKm).toBe(5.3)
    expect(result.fullRoute.polyline).toBe('encoded-polyline')
  })

  it('deve calcular 2 rotas em paralelo', async () => {
    const rideRepo = makeMockRideRepo()
    const driverPort = makeMockDriverPort()
    const routingPort = makeMockRoutingPort()
    const useCase = new RequestRideUseCase(rideRepo, driverPort, routingPort, pricingService)

    await useCase.execute(rideInput)

    expect(routingPort.calculateRoute).toHaveBeenCalledTimes(2)
  })

  it('deve marcar motorista como indisponível após criar corrida', async () => {
    const rideRepo = makeMockRideRepo()
    const driverPort = makeMockDriverPort()
    const routingPort = makeMockRoutingPort()
    const useCase = new RequestRideUseCase(rideRepo, driverPort, routingPort, pricingService)

    await useCase.execute(rideInput)

    expect(driverPort.setAvailability).toHaveBeenCalledWith('driver-1', false)
  })

  it('deve persistir a corrida no repositório', async () => {
    const rideRepo = makeMockRideRepo()
    const driverPort = makeMockDriverPort()
    const routingPort = makeMockRoutingPort()
    const useCase = new RequestRideUseCase(rideRepo, driverPort, routingPort, pricingService)

    await useCase.execute(rideInput)

    expect(rideRepo.create).toHaveBeenCalledOnce()
  })

  it('deve lançar DomainError quando não há motoristas disponíveis', async () => {
    const rideRepo = makeMockRideRepo()
    const driverPort = makeMockDriverPort({
      findNearestDriver: vi.fn(async () => ({ found: false, driver: null, distanceKm: 0 })),
    })
    const routingPort = makeMockRoutingPort()
    const useCase = new RequestRideUseCase(rideRepo, driverPort, routingPort, pricingService)

    await expect(useCase.execute(rideInput)).rejects.toThrow(DomainError)
    await expect(useCase.execute(rideInput)).rejects.toThrow('No available drivers')
    expect(rideRepo.create).not.toHaveBeenCalled()
  })

  it('deve usar raio padrão quando radiusKm não é fornecido', async () => {
    const rideRepo = makeMockRideRepo()
    const driverPort = makeMockDriverPort()
    const routingPort = makeMockRoutingPort()
    const useCase = new RequestRideUseCase(rideRepo, driverPort, routingPort, pricingService)

    await useCase.execute(rideInput)

    expect(driverPort.findNearestDriver).toHaveBeenCalledWith(
      rideInput.originLat,
      rideInput.originLng,
      10, // DEFAULT_SEARCH_RADIUS_KM
    )
  })

  it('deve usar raio personalizado quando fornecido', async () => {
    const rideRepo = makeMockRideRepo()
    const driverPort = makeMockDriverPort()
    const routingPort = makeMockRoutingPort()
    const useCase = new RequestRideUseCase(rideRepo, driverPort, routingPort, pricingService)

    await useCase.execute({ ...rideInput, radiusKm: 25 })

    expect(driverPort.findNearestDriver).toHaveBeenCalledWith(
      rideInput.originLat,
      rideInput.originLng,
      25,
    )
  })
})
