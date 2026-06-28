import type { IDriverRepository, DriverLocation, DriverFull } from '../repositories/IDriverRepository'

type DistanceCalculator = (
  lat1: number, lng1: number,
  lat2: number, lng2: number,
) => Promise<{ distance_km: number }>

export interface NearestDriverResult {
  found: boolean
  driver: DriverLocation | null
  distanceKm: number
}

// SRP: regras de negócio do domínio de motoristas
// DIP: depende de IDriverRepository (abstração)
export class DriverService {
  constructor(
    private readonly repo: IDriverRepository,
    private readonly calculateDistance: DistanceCalculator,
  ) {}

  // ── Hot-state ────────────────────────────────────────────────────────────────

  async register(id: string, name: string): Promise<DriverLocation> {
    const existing = await this.repo.findById(id)
    if (existing) return existing
    const driver: DriverFull = {
      id, name, email: '', phone: '', password: '',
      rating: 5.0, isActive: true,
      lat: 0, lng: 0, isAvailable: false,
      createdAt: new Date(), updatedAt: new Date(),
    }
    const created = await this.repo.create(driver)
    return { id: created.id, name: created.name, lat: created.lat, lng: created.lng, isAvailable: created.isAvailable, updatedAt: created.updatedAt }
  }

  async updateLocation(id: string, lat: number, lng: number): Promise<boolean> {
    return this.repo.updateLocation(id, lat, lng)
  }

  async setAvailability(id: string, isAvailable: boolean): Promise<boolean> {
    return this.repo.setAvailability(id, isAvailable)
  }

  async listAvailable(): Promise<DriverLocation[]> {
    return this.repo.listAvailable()
  }

  async findNearestDriver(originLat: number, originLng: number, radiusKm: number): Promise<NearestDriverResult> {
    const nearby = await this.repo.findNearby(originLat, originLng, radiusKm)
    if (nearby.length === 0) return { found: false, driver: null, distanceKm: 0 }

    try {
      const candidates = await Promise.all(
        nearby.slice(0, 5).map(async d => {
          const result = await this.calculateDistance(d.lat, d.lng, originLat, originLng)
          return { driver: d, distanceKm: result.distance_km }
        }),
      )
      const best = candidates.sort((a, b) => a.distanceKm - b.distanceKm)[0]
      return { found: true, driver: best.driver, distanceKm: best.distanceKm }
    } catch {
      return { found: true, driver: nearby[0], distanceKm: nearby[0].distanceKm }
    }
  }

  // ── Driver CRUD ───────────────────────────────────────────────────────────────

  async createDriver(driver: DriverFull): Promise<DriverFull> {
    const existing = await this.repo.findByEmail(driver.email)
    if (existing) throw new Error(`Email "${driver.email}" já cadastrado`)
    return this.repo.create(driver)
  }

  async getDriver(id: string): Promise<DriverFull | null> {
    return this.repo.findFullById(id)
  }

  async getDriverByEmail(email: string): Promise<DriverFull | null> {
    return this.repo.findByEmail(email)
  }

  async listDrivers(): Promise<DriverFull[]> {
    return this.repo.findAll()
  }

  async updateDriver(id: string, data: Partial<DriverFull>): Promise<DriverFull> {
    const existing = await this.repo.findFullById(id)
    if (!existing) throw new Error(`Motorista ${id} não encontrado`)
    return this.repo.update(id, data)
  }

  async deleteDriver(id: string): Promise<void> {
    const existing = await this.repo.findFullById(id)
    if (!existing) throw new Error(`Motorista ${id} não encontrado`)
    return this.repo.delete(id)
  }
}
