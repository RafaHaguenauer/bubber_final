import { PrismaClient } from '@prisma/client'
import type { IVehicleRepository, VehicleRecord } from './IDriverRepository'

export class PrismaVehicleRepository implements IVehicleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<VehicleRecord | null> {
    const row = await this.prisma.vehicle.findUnique({ where: { id } })
    return row ? this.toDomain(row) : null
  }

  async findByPlate(plate: string): Promise<VehicleRecord | null> {
    const row = await this.prisma.vehicle.findUnique({ where: { plate } })
    return row ? this.toDomain(row) : null
  }

  async findByDriverId(driverId: string): Promise<VehicleRecord[]> {
    const rows = await this.prisma.vehicle.findMany({ where: { driverId } })
    return rows.map(r => this.toDomain(r))
  }

  async create(vehicle: VehicleRecord): Promise<VehicleRecord> {
    const row = await this.prisma.vehicle.create({
      data: {
        id:       vehicle.id,
        driverId: vehicle.driverId,
        plate:    vehicle.plate,
        brand:    vehicle.brand,
        model:    vehicle.model,
        year:     vehicle.year,
        color:    vehicle.color,
      },
    })
    return this.toDomain(row)
  }

  async update(id: string, data: Partial<VehicleRecord>): Promise<VehicleRecord> {
    const row = await this.prisma.vehicle.update({
      where: { id },
      data: {
        ...(data.plate !== undefined && { plate: data.plate }),
        ...(data.brand !== undefined && { brand: data.brand }),
        ...(data.model !== undefined && { model: data.model }),
        ...(data.year  !== undefined && { year:  data.year }),
        ...(data.color !== undefined && { color: data.color }),
      },
    })
    return this.toDomain(row)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.vehicle.delete({ where: { id } })
  }

  private toDomain(row: {
    id: string; driverId: string; plate: string; brand: string;
    model: string; year: number; color: string; createdAt: Date; updatedAt: Date
  }): VehicleRecord {
    return {
      id:        row.id,
      driverId:  row.driverId,
      plate:     row.plate,
      brand:     row.brand,
      model:     row.model,
      year:      row.year,
      color:     row.color,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }
}
