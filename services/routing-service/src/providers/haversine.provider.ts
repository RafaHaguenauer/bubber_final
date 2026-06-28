import type { IRoutingProvider, RouteResult } from './IRoutingProvider'

// Strategy concreta: distância em linha reta (fallback sem dependência externa)
export class HaversineRoutingProvider implements IRoutingProvider {
  private static readonly EARTH_RADIUS_KM = 6371
  private static readonly AVG_SPEED_KMH = 30

  async calculateRoute(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
  ): Promise<RouteResult> {
    const distanceKm = HaversineRoutingProvider.calculate(originLat, originLng, destLat, destLng)
    return {
      distanceKm,
      durationMinutes: (distanceKm / HaversineRoutingProvider.AVG_SPEED_KMH) * 60,
      polyline: '',
    }
  }

  private static calculate(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = HaversineRoutingProvider.EARTH_RADIUS_KM
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }
}
