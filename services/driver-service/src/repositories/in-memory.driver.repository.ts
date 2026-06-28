import type { IDriverRepository, DriverLocation, DriverFull } from './IDriverRepository'

// Implementação em memória — usada em testes e legada.
// Em produção, substituída por PrismaDriverRepository.
export class InMemoryDriverRepository implements IDriverRepository {
  private readonly store = new Map<string, DriverFull>()

  async save(driver: DriverLocation): Promise<void> {
    const existing = this.store.get(driver.id)
    if (existing) {
      existing.name = driver.name
      existing.lat = driver.lat
      existing.lng = driver.lng
      existing.isAvailable = driver.isAvailable
      existing.updatedAt = driver.updatedAt
    }
  }

  async create(driver: DriverFull): Promise<DriverFull> {
    this.store.set(driver.id, { ...driver })
    return driver
  }

  async findById(id: string): Promise<DriverLocation | null> {
    const d = this.store.get(id)
    return d ? { id: d.id, name: d.name, lat: d.lat, lng: d.lng, isAvailable: d.isAvailable, updatedAt: d.updatedAt } : null
  }

  async findFullById(id: string): Promise<DriverFull | null> {
    return this.store.get(id) ?? null
  }

  async findByEmail(email: string): Promise<DriverFull | null> {
    return Array.from(this.store.values()).find(d => d.email === email) ?? null
  }

  async findAll(): Promise<DriverFull[]> {
    return Array.from(this.store.values())
  }

  async update(id: string, data: Partial<DriverFull>): Promise<DriverFull> {
    const driver = this.store.get(id)
    if (!driver) throw new Error(`Driver ${id} not found`)
    Object.assign(driver, data, { updatedAt: new Date() })
    return driver
  }

  async updateLocation(id: string, lat: number, lng: number): Promise<boolean> {
    const driver = this.store.get(id)
    if (!driver) return false
    driver.lat = lat
    driver.lng = lng
    driver.updatedAt = new Date()
    return true
  }

  async setAvailability(id: string, isAvailable: boolean): Promise<boolean> {
    const driver = this.store.get(id)
    if (!driver) return false
    driver.isAvailable = isAvailable
    return true
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id)
  }

  async listAvailable(): Promise<DriverLocation[]> {
    return Array.from(this.store.values())
      .filter(d => d.isAvailable)
      .map(d => ({ id: d.id, name: d.name, lat: d.lat, lng: d.lng, isAvailable: d.isAvailable, updatedAt: d.updatedAt }))
  }

  async findNearby(lat: number, lng: number, radiusKm: number): Promise<Array<DriverLocation & { distanceKm: number }>> {
    return Array.from(this.store.values())
      .filter(d => d.isAvailable && d.lat !== 0)
      .map(d => ({ id: d.id, name: d.name, lat: d.lat, lng: d.lng, isAvailable: d.isAvailable, updatedAt: d.updatedAt, distanceKm: InMemoryDriverRepository.haversine(lat, lng, d.lat, d.lng) }))
      .filter(d => d.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
  }

  private static haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }
}
