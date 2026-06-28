export interface DriverLocation {
  id: string
  name: string
  lat: number
  lng: number
  isAvailable: boolean
  updatedAt: Date
}

class DriverStore {
  private readonly drivers = new Map<string, DriverLocation>()

  register(id: string, name: string): DriverLocation {
    if (this.drivers.has(id)) return this.drivers.get(id)!
    const driver: DriverLocation = { id, name, lat: 0, lng: 0, isAvailable: false, updatedAt: new Date() }
    this.drivers.set(id, driver)
    return driver
  }

  updateLocation(id: string, lat: number, lng: number): boolean {
    const d = this.drivers.get(id)
    if (!d) return false
    d.lat = lat
    d.lng = lng
    d.updatedAt = new Date()
    return true
  }

  setAvailability(id: string, isAvailable: boolean): boolean {
    const d = this.drivers.get(id)
    if (!d) return false
    d.isAvailable = isAvailable
    return true
  }

  listAvailable(): DriverLocation[] {
    return Array.from(this.drivers.values()).filter(d => d.isAvailable)
  }

  findNearby(lat: number, lng: number, radiusKm: number): Array<DriverLocation & { distanceKm: number }> {
    return Array.from(this.drivers.values())
      .filter(d => d.isAvailable && d.lat !== 0)
      .map(d => ({ ...d, distanceKm: haversine(lat, lng, d.lat, d.lng) }))
      .filter(d => d.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
  }
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export const driverStore = new DriverStore()
