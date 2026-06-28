import { ValidationError } from '../../shared/errors/ValidationError'

export class Phone {
  readonly value: string

  constructor(phone: string) {
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10 || digits.length > 15) {
      throw new ValidationError(`Invalid phone number: ${phone}`)
    }
    this.value = digits
    Object.freeze(this)
  }

  equals(other: Phone): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
