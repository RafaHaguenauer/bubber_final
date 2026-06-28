import type { PrismaClient } from '@prisma/client'
import { Ride } from '../../../domain/entities/Ride'
import type { IRideRepository } from '../../../domain/repositories/IRideRepository'
import { RideMapper } from '../mappers/RideMapper'

export class PrismaRideRepository implements IRideRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Ride | null> {
    const raw = await this.prisma.ride.findUnique({ where: { id } })
    return raw ? RideMapper.toDomain(raw) : null
  }

  async findByUserId(userId: string): Promise<Ride[]> {
    const raws = await this.prisma.ride.findMany({ where: { userId } })
    return raws.map(RideMapper.toDomain)
  }

  async findByDriverId(driverId: string): Promise<Ride[]> {
    const raws = await this.prisma.ride.findMany({ where: { driverId } })
    return raws.map(RideMapper.toDomain)
  }

  async findAll(): Promise<Ride[]> {
    const raws = await this.prisma.ride.findMany()
    return raws.map(RideMapper.toDomain)
  }

  async create(ride: Ride): Promise<Ride> {
    const raw = await this.prisma.ride.create({ data: RideMapper.toPersistence(ride) })
    return RideMapper.toDomain(raw)
  }

  async update(ride: Ride): Promise<Ride> {
    const raw = await this.prisma.ride.update({
      where: { id: ride.id },
      data: RideMapper.toPersistence(ride),
    })
    return RideMapper.toDomain(raw)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.ride.delete({ where: { id } })
  }
}
