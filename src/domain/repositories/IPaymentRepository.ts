import type { Payment } from '../entities/Payment'

export interface IPaymentRepository {
  findById(id: string): Promise<Payment | null>
  findByRideId(rideId: string): Promise<Payment | null>
  findAll(): Promise<Payment[]>
  create(payment: Payment): Promise<Payment>
  update(payment: Payment): Promise<Payment>
  delete(id: string): Promise<void>
}
