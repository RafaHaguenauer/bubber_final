export class Vehicle {
  constructor(
    readonly id: string,
    readonly driverId: string,
    readonly plate: string,
    readonly brand: string,
    readonly model: string,
    readonly year: number,
    readonly color: string,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  static create(
    id: string,
    driverId: string,
    plate: string,
    brand: string,
    model: string,
    year: number,
    color: string,
  ): Vehicle {
    const now = new Date()
    return new Vehicle(id, driverId, plate, brand, model, year, color, now, now)
  }
}
