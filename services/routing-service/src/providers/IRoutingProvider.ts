export interface RouteResult {
  distanceKm: number
  durationMinutes: number
  polyline: string
}

// Porta de saída — dependa desta abstração, nunca da implementação concreta
export interface IRoutingProvider {
  calculateRoute(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
  ): Promise<RouteResult>
}
