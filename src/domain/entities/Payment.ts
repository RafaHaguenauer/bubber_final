import { Money } from '../value-objects/Money'
import { DomainError } from '../../shared/errors/DomainError'

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  CASH = 'CASH',
  PIX = 'PIX',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export class Payment {
  private _status: PaymentStatus

  constructor(
    readonly id: string,
    readonly rideId: string,
    readonly amount: Money,
    readonly method: PaymentMethod,
    status: PaymentStatus,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {
    this._status = status
  }

  get status(): PaymentStatus { return this._status }

  complete(): void {
    this._status = PaymentStatus.COMPLETED
  }

  fail(): void {
    this._status = PaymentStatus.FAILED
  }

  refund(): void {
    if (this._status !== PaymentStatus.COMPLETED) {
      throw new DomainError('Only COMPLETED payments can be refunded')
    }
    this._status = PaymentStatus.REFUNDED
  }

  static create(id: string, rideId: string, amount: Money, method: PaymentMethod): Payment {
    const now = new Date()
    return new Payment(id, rideId, amount, method, PaymentStatus.PENDING, now, now)
  }
}
