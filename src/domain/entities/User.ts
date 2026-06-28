export class User {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly email: string,
    readonly phone: string,
    readonly password: string,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  static create(
    id: string,
    name: string,
    email: string,
    phone: string,
    password: string,
  ): User {
    const now = new Date()
    return new User(id, name, email, phone, password, now, now)
  }
}
