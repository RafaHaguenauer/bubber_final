import { ValidationError } from '../../shared/errors/ValidationError'

export class Email {
  readonly value: string

  constructor(email: string) {
    const trimmed = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      throw new ValidationError(`Invalid email: ${email}`)
    }
    this.value = trimmed
    Object.freeze(this)
  }

  equals(other: Email): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
