import { Coordinates } from '../value-objects/Coordinates'
import { Money } from '../value-objects/Money'
import { DomainError } from '../../shared/errors/DomainError'

export enum RideStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class Ride {
  private _status: RideStatus
  private _driverId: string | null
  private _price: Money | null
  private _startedAt: Date | null
  private _finishedAt: Date | null

  constructor(
    readonly id: string,
    readonly userId: string,
    driverId: string | null,
    status: RideStatus,
    readonly origin: Coordinates,
    readonly originAddress: string,
    readonly destination: Coordinates,
    readonly destAddress: string,
    price: Money | null,
    startedAt: Date | null,
    finishedAt: Date | null,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {
    this._status = status
    this._driverId = driverId
    this._price = price
    this._startedAt = startedAt
    this._finishedAt = finishedAt
  }

  get status(): RideStatus { return this._status }
  get driverId(): string | null { return this._driverId }
  get price(): Money | null { return this._price }
  get startedAt(): Date | null { return this._startedAt }
  get finishedAt(): Date | null { return this._finishedAt }

  // Convenience getters so GraphQL field resolvers work without extra mapping
  get originLat(): number { return this.origin.lat }
  get originLng(): number { return this.origin.lng }
  get destLat(): number { return this.destination.lat }
  get destLng(): number { return this.destination.lng }

  accept(driverId: string): void {
    if (this._status !== RideStatus.PENDING) {
      throw new DomainError('Only PENDING rides can be accepted')
    }
    this._driverId = driverId
    this._status = RideStatus.ACCEPTED
  }

  start(): void {
    if (this._status !== RideStatus.ACCEPTED) {
      throw new DomainError('Only ACCEPTED rides can be started')
    }
    this._startedAt = new Date()
    this._status = RideStatus.IN_PROGRESS
  }

  complete(price: Money): void {
    if (this._status !== RideStatus.IN_PROGRESS) {
      throw new DomainError('Only IN_PROGRESS rides can be completed')
    }
    this._price = price
    this._finishedAt = new Date()
    this._status = RideStatus.COMPLETED
  }

  cancel(): void {
    if (this._status === RideStatus.COMPLETED) {
      throw new DomainError('COMPLETED rides cannot be cancelled')
    }
    this._status = RideStatus.CANCELLED
  }

  setPrice(price: Money): void {
    this._price = price
  }

  setDriver(driverId: string): void {
    this._driverId = driverId
  }

  static create(
    id: string,
    userId: string,
    driverId: string | null,
    origin: Coordinates,
    originAddress: string,
    destination: Coordinates,
    destAddress: string,
    price: Money | null = null,
  ): Ride {
    const now = new Date()
    return new Ride(
      id,
      userId,
      driverId,
      RideStatus.PENDING,
      origin,
      originAddress,
      destination,
      destAddress,
      price,
      null,
      null,
      now,
      now,
    )
  }
}
