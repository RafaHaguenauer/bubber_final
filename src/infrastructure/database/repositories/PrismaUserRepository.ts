import type { PrismaClient } from '@prisma/client'
import { User } from '../../../domain/entities/User'
import type { IUserRepository } from '../../../domain/repositories/IUserRepository'
import { UserMapper } from '../mappers/UserMapper'

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({ where: { id } })
    return raw ? UserMapper.toDomain(raw) : null
  }

  async findByEmail(email: string): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({ where: { email } })
    return raw ? UserMapper.toDomain(raw) : null
  }

  async findAll(): Promise<User[]> {
    const raws = await this.prisma.user.findMany()
    return raws.map(UserMapper.toDomain)
  }

  async create(user: User): Promise<User> {
    const raw = await this.prisma.user.create({ data: UserMapper.toPersistence(user) })
    return UserMapper.toDomain(raw)
  }

  async update(user: User): Promise<User> {
    const raw = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    })
    return UserMapper.toDomain(raw)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } })
  }
}
