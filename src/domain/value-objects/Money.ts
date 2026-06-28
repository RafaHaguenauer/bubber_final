import { ValidationError } from '../../shared/errors/ValidationError'
import { DomainError } from '../../shared/errors/DomainError'

export class Money {
  readonly amount: number
  readonly currency: string

  constructor(amount: number, currency = 'BRL') {
    if (amount < 0) throw new ValidationError('Money amount cannot be negative')
    this.amount = Math.round(amount * 100) / 100
    this.currency = currency
    Object.freeze(this)
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new DomainError(`Cannot add ${this.currency} and ${other.currency}`)
    }
    return new Money(this.amount + other.amount, this.currency)
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency
  }

  toString(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`
  }
}
