import { Money } from '../value-objects/Money'
import { BASE_PRICE, PRICE_PER_KM } from '../../shared/constants'

export class RidePricingService {
  estimate(distanceKm: number): Money {
    const raw = BASE_PRICE + distanceKm * PRICE_PER_KM
    return new Money(Math.round(raw * 100) / 100)
  }
}
