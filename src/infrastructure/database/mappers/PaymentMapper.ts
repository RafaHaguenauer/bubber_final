import { Payment, PaymentMethod, PaymentStatus } from '../../../domain/entities/Payment'
import { Money } from '../../../domain/value-objects/Money'

interface PrismaPayment {
  id: string
  rideId: string
  amount: { toString(): string }
  method: string
  status: string
  createdAt: Date
  updatedAt: Date
}

export class PaymentMapper {
  static toDomain(raw: PrismaPayment): Payment {
    return new Payment(
      raw.id,
      raw.rideId,
      new Money(Number(raw.amount)),
      raw.method as PaymentMethod,
      raw.status as PaymentStatus,
      raw.createdAt,
      raw.updatedAt,
    )
  }

  static toPersistence(payment: Payment) {
    return {
      id: payment.id,
      rideId: payment.rideId,
      amount: payment.amount.amount,
      method: payment.method,
      status: payment.status,
    }
  }
}
