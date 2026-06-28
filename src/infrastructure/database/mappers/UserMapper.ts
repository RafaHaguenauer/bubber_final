import { User } from '../../../domain/entities/User'

interface PrismaUser {
  id: string
  name: string
  email: string
  phone: string
  password: string
  createdAt: Date
  updatedAt: Date
}

export class UserMapper {
  static toDomain(raw: PrismaUser): User {
    return new User(
      raw.id,
      raw.name,
      raw.email,
      raw.phone,
      raw.password,
      raw.createdAt,
      raw.updatedAt,
    )
  }

  static toPersistence(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: user.password,
    }
  }
}
