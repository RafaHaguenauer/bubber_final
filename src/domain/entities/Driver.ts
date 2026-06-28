export class Driver {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly email: string,
    readonly phone: string,
    readonly password: string,
    readonly rating: number,
    readonly isActive: boolean,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  static create(
    id: string,
    name: string,
    email: string,
    phone: string,
    password: string,
  ): Driver {
    const now = new Date()
    return new Driver(id, name, email, phone, password, 5.0, true, now, now)
  }
}
