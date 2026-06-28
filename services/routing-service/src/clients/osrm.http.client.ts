const OSRM_URL = process.env.OSRM_URL ?? 'http://localhost:5000'

export interface OsrmResult {
  distanceKm: number
  durationMinutes: number
  polyline: string
}

export async function queryOsrm(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
): Promise<OsrmResult> {
  // OSRM usa formato lng,lat (longitude primeiro)
  const coords = `${originLng},${originLat};${destLng},${destLat}`
  const url = `${OSRM_URL}/route/v1/driving/${coords}?overview=full&geometries=polyline`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`OSRM retornou HTTP ${res.status}`)

  const data = (await res.json()) as any

  if (data.code !== 'Ok' || !data.routes?.length) {
    throw new Error(`OSRM sem rota: ${data.code}`)
  }

  const route = data.routes[0]
  return {
    distanceKm: route.distance / 1000,
    durationMinutes: route.duration / 60,
    polyline: route.geometry ?? '',
  }
}

// Haversine como fallback quando OSRM não está disponível
export function haversineFallback(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): OsrmResult {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  const distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const avgSpeedKmh = 30
  return {
    distanceKm,
    durationMinutes: (distanceKm / avgSpeedKmh) * 60,
    polyline: '',
  }
}
