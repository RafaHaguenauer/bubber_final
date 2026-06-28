import type { PrismaClient } from '@prisma/client'
import { Payment } from '../../../domain/entities/Payment'
import type { IPaymentRepository } from '../../../domain/repositories/IPaymentRepository'
import { PaymentMapper } from '../mappers/PaymentMapper'

export class PrismaPaymentRepository implements IPaymentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Payment | null> {
    const raw = await this.prisma.payment.findUnique({ where: { id } })
    return raw ? PaymentMapper.toDomain(raw) : null
  }

  async findByRideId(rideId: string): Promise<Payment | null> {
    const raw = await this.prisma.payment.findUnique({ where: { rideId } })
    return raw ? PaymentMapper.toDomain(raw) : null
  }

  async findAll(): Promise<Payment[]> {
    const raws = await this.prisma.payment.findMany()
    return raws.map(PaymentMapper.toDomain)
  }

  async create(payment: Payment): Promise<Payment> {
    const raw = await this.prisma.payment.create({ data: PaymentMapper.toPersistence(payment) })
    return PaymentMapper.toDomain(raw)
  }

  async update(payment: Payment): Promise<Payment> {
    const raw = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        amount: payment.amount.amount,
        method: payment.method,
        status: payment.status,
      },
    })
    return PaymentMapper.toDomain(raw)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.payment.delete({ where: { id } })
  }
}
