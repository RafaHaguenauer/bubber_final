import type { IRoutingProvider, RouteResult } from './IRoutingProvider'

// Strategy concreta: roteamento via OSRM (Open Source Routing Machine)
export class OsrmRoutingProvider implements IRoutingProvider {
  constructor(private readonly baseUrl: string) {}

  async calculateRoute(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
  ): Promise<RouteResult> {
    // OSRM recebe coordenadas no formato lng,lat
    const coords = `${originLng},${originLat};${destLng},${destLat}`
    const url = `${this.baseUrl}/route/v1/driving/${coords}?overview=full&geometries=polyline`

    const res = await fetch(url)
    if (!res.ok) throw new Error(`OSRM retornou HTTP ${res.status}`)

    const data = (await res.json()) as any
    if (data.code !== 'Ok' || !data.routes?.length) {
      throw new Error(`OSRM sem rota disponível: ${data.code}`)
    }

    const route = data.routes[0]
    return {
      distanceKm: route.distance / 1000,
      durationMinutes: route.duration / 60,
      polyline: route.geometry ?? '',
    }
  }
}
