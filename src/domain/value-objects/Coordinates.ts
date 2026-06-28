import { ValidationError } from '../../shared/errors/ValidationError'

export class Coordinates {
  constructor(readonly lat: number, readonly lng: number) {
    if (lat < -90 || lat > 90) throw new ValidationError(`Invalid latitude: ${lat}`)
    if (lng < -180 || lng > 180) throw new ValidationError(`Invalid longitude: ${lng}`)
    Object.freeze(this)
  }

  equals(other: Coordinates): boolean {
    return this.lat === other.lat && this.lng === other.lng
  }

  toString(): string {
    return `(${this.lat}, ${this.lng})`
  }
}
