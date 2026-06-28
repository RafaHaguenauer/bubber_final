import type { Driver } from '../entities/Driver'

export interface IDriverRepository {
  findById(id: string): Promise<Driver | null>
  findByEmail(email: string): Promise<Driver | null>
  findAll(): Promise<Driver[]>
  create(driver: Driver): Promise<Driver>
  update(driver: Driver): Promise<Driver>
  delete(id: string): Promise<void>
}
