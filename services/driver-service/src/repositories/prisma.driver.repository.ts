import { PrismaClient } from '@prisma/client'
import type { IDriverRepository, DriverLocation, DriverFull } from './IDriverRepository'

export class PrismaDriverRepository implements IDriverRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ── Hot-state ──────────────────────────────────────────────────────────────

  async save(driver: DriverLocation): Promise<void> {
    await this.prisma.driver.update({
      where: { id: driver.id },
      data: { name: driver.name, lat: driver.lat, lng: driver.lng, isAvailable: driver.isAvailable },
    })
  }

  async findById(id: string): Promise<DriverLocation | null> {
    const row = await this.prisma.driver.findUnique({ where: { id } })
    return row ? this.toLocation(row) : null
  }

  async updateLocation(id: string, lat: number, lng: number): Promise<boolean> {
    try {
      await this.prisma.driver.update({ where: { id }, data: { lat, lng } })
      return true
    } catch {
      return false
    }
  }

  async setAvailability(id: string, isAvailable: boolean): Promise<boolean> {
    try {
      await this.prisma.driver.update({ where: { id }, data: { isAvailable } })
      return true
    } catch {
      return false
    }
  }

  async listAvailable(): Promise<DriverLocation[]> {
    const rows = await this.prisma.driver.findMany({ where: { isAvailable: true } })
    return rows.map(r => this.toLocation(r))
  }

  async findNearby(lat: number, lng: number, radiusKm: number): Promise<Array<DriverLocation & { distanceKm: number }>> {
    const available = await this.prisma.driver.findMany({
      where: { isAvailable: true, NOT: { lat: 0, lng: 0 } },
    })
    return available
      .map(d => ({ ...this.toLocation(d), distanceKm: PrismaDriverRepository.haversine(lat, lng, d.lat, d.lng) }))
      .filter(d => d.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
  }

  // ── Full CRUD ──────────────────────────────────────────────────────────────

  async create(driver: DriverFull): Promise<DriverFull> {
    const row = await this.prisma.driver.create({
      data: {
        id:          driver.id,
        name:        driver.name,
        email:       driver.email,
        phone:       driver.phone,
        password:    driver.password,
        rating:      driver.rating,
        isActive:    driver.isActive,
        lat:         driver.lat,
        lng:         driver.lng,
        isAvailable: driver.isAvailable,
      },
    })
    return this.toFull(row)
  }

  async findFullById(id: string): Promise<DriverFull | null> {
    const row = await this.prisma.driver.findUnique({ where: { id } })
    return row ? this.toFull(row) : null
  }

  async findByEmail(email: string): Promise<DriverFull | null> {
    const row = await this.prisma.driver.findUnique({ where: { email } })
    return row ? this.toFull(row) : null
  }

  async findAll(): Promise<DriverFull[]> {
    const rows = await this.prisma.driver.findMany()
    return rows.map(r => this.toFull(r))
  }

  async update(id: string, data: Partial<DriverFull>): Promise<DriverFull> {
    const row = await this.prisma.driver.update({
      where: { id },
      data: {
        ...(data.name      !== undefined && { name:     data.name }),
        ...(data.email     !== undefined && { email:    data.email }),
        ...(data.phone     !== undefined && { phone:    data.phone }),
        ...(data.rating    !== undefined && { rating:   data.rating }),
        ...(data.isActive  !== undefined && { isActive: data.isActive }),
      },
    })
    return this.toFull(row)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.driver.delete({ where: { id } })
  }

  // ── Mappers ────────────────────────────────────────────────────────────────

  private toLocation(row: {
    id: string; name: string; lat: number; lng: number; isAvailable: boolean; updatedAt: Date
  }): DriverLocation {
    return { id: row.id, name: row.name, lat: row.lat, lng: row.lng, isAvailable: row.isAvailable, updatedAt: row.updatedAt }
  }

  private toFull(row: {
    id: string; name: string; email: string; phone: string; password: string;
    rating: number; isActive: boolean; lat: number; lng: number; isAvailable: boolean;
    createdAt: Date; updatedAt: Date
  }): DriverFull {
    return {
      id: row.id, name: row.name, email: row.email, phone: row.phone,
      password: row.password, rating: row.rating, isActive: row.isActive,
      lat: row.lat, lng: row.lng, isAvailable: row.isAvailable,
      createdAt: row.createdAt, updatedAt: row.updatedAt,
    }
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
