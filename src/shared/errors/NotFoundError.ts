import { DomainError } from './DomainError'

export class NotFoundError extends DomainError {
  constructor(resource: string, id: string) {
    super(`${resource} with id "${id}" not found`)
    this.name = 'NotFoundError'
  }
}
