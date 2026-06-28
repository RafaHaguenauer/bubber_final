import { Ride, RideStatus } from '../../../domain/entities/Ride'
import { Coordinates } from '../../../domain/value-objects/Coordinates'
import { Money } from '../../../domain/value-objects/Money'

interface PrismaRide {
  id: string
  userId: string
  driverId: string | null
  status: string
  originLat: number
  originLng: number
  originAddress: string
  destLat: number
  destLng: number
  destAddress: string
  price: { toString(): string } | null
  startedAt: Date | null
  finishedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export class RideMapper {
  static toDomain(raw: PrismaRide): Ride {
    return new Ride(
      raw.id,
      raw.userId,
      raw.driverId,
      raw.status as RideStatus,
      new Coordinates(raw.originLat, raw.originLng),
      raw.originAddress,
      new Coordinates(raw.destLat, raw.destLng),
      raw.destAddress,
      raw.price != null ? new Money(Number(raw.price)) : null,
      raw.startedAt,
      raw.finishedAt,
      raw.createdAt,
      raw.updatedAt,
    )
  }

  static toPersistence(ride: Ride) {
    return {
      id: ride.id,
      userId: ride.userId,
      driverId: ride.driverId,
      status: ride.status,
      originLat: ride.origin.lat,
      originLng: ride.origin.lng,
      originAddress: ride.originAddress,
      destLat: ride.destination.lat,
      destLng: ride.destination.lng,
      destAddress: ride.destAddress,
      price: ride.price?.amount ?? null,
      startedAt: ride.startedAt,
      finishedAt: ride.finishedAt,
    }
  }
}
