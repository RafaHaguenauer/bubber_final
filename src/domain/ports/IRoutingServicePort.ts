export interface RouteInfo {
  distanceKm: number
  durationMinutes: number
  polyline: string
}

export interface IRoutingServicePort {
  calculateRoute(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
  ): Promise<RouteInfo>
}
