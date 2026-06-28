import { randomUUID } from 'crypto'
import { Ride } from '../../../domain/entities/Ride'
import { Coordinates } from '../../../domain/value-objects/Coordinates'
import { RidePricingService } from '../../../domain/services/RidePricingService'
import type { IRideRepository } from '../../../domain/repositories/IRideRepository'
import type { IDriverServicePort } from '../../../domain/ports/IDriverServicePort'
import type { IRoutingServicePort, RouteInfo } from '../../../domain/ports/IRoutingServicePort'
import { DomainError } from '../../../shared/errors/DomainError'
import { DEFAULT_SEARCH_RADIUS_KM } from '../../../shared/constants'

export interface RequestRideInput {
  userId: string
  originLat: number
  originLng: number
  originAddress: string
  destLat: number
  destLng: number
  destAddress: string
  radiusKm?: number | null
}

export interface RequestRideOutput {
  ride: Ride
  driverToOriginRoute: RouteInfo
  fullRoute: RouteInfo
}

export class RequestRideUseCase {
  constructor(
    private readonly rideRepo: IRideRepository,
    private readonly driverPort: IDriverServicePort,
    private readonly routingPort: IRoutingServicePort,
    private readonly pricingService: RidePricingService,
  ) {}

  async execute(input: RequestRideInput): Promise<RequestRideOutput> {
    const radius = input.radiusKm ?? DEFAULT_SEARCH_RADIUS_KM

    const nearestResult = await this.driverPort.findNearestDriver(
      input.originLat,
      input.originLng,
      radius,
    )

    if (!nearestResult.found || !nearestResult.driver) {
      throw new DomainError('No available drivers found in the area')
    }

    const driver = nearestResult.driver

    const [driverToOriginRoute, fullRoute] = await Promise.all([
      this.routingPort.calculateRoute(driver.lat, driver.lng, input.originLat, input.originLng),
      this.routingPort.calculateRoute(
        input.originLat,
        input.originLng,
        input.destLat,
        input.destLng,
      ),
    ])

    const price = this.pricingService.estimate(fullRoute.distanceKm)

    const ride = Ride.create(
      randomUUID(),
      input.userId,
      driver.id,
      new Coordinates(input.originLat, input.originLng),
      input.originAddress,
      new Coordinates(input.destLat, input.destLng),
      input.destAddress,
      price,
    )

    const savedRide = await this.rideRepo.create(ride)

    await this.driverPort.setAvailability(driver.id, false)

    return { ride: savedRide, driverToOriginRoute, fullRoute }
  }
}
