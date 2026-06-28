import { describe, it, expect } from 'vitest'
import { Payment, PaymentMethod, PaymentStatus } from '../../../domain/entities/Payment'
import { Money } from '../../../domain/value-objects/Money'
import { DomainError } from '../../../shared/errors/DomainError'

const makePayment = (status = PaymentStatus.PENDING) =>
  new Payment('pay-1', 'ride-1', new Money(50), PaymentMethod.PIX, status, new Date(), new Date())

describe('Payment (Entity)', () => {
  describe('Payment.create()', () => {
    it('deve criar pagamento com status PENDING', () => {
      const p = Payment.create('p-1', 'r-1', new Money(100), PaymentMethod.CREDIT_CARD)
      expect(p.status).toBe(PaymentStatus.PENDING)
      expect(p.amount.amount).toBe(100)
    })
  })

  describe('complete()', () => {
    it('deve marcar pagamento como COMPLETED', () => {
      const p = makePayment()
      p.complete()
      expect(p.status).toBe(PaymentStatus.COMPLETED)
    })
  })

  describe('fail()', () => {
    it('deve marcar pagamento como FAILED', () => {
      const p = makePayment()
      p.fail()
      expect(p.status).toBe(PaymentStatus.FAILED)
    })
  })

  describe('refund()', () => {
    it('deve reembolsar pagamento COMPLETED', () => {
      const p = makePayment(PaymentStatus.COMPLETED)
      p.refund()
      expect(p.status).toBe(PaymentStatus.REFUNDED)
    })

    it('deve rejeitar reembolso de pagamento PENDING', () => {
      const p = makePayment(PaymentStatus.PENDING)
      expect(() => p.refund()).toThrow(DomainError)
      expect(() => p.refund()).toThrow('COMPLETED')
    })

    it('deve rejeitar reembolso de pagamento FAILED', () => {
      const p = makePayment(PaymentStatus.FAILED)
      expect(() => p.refund()).toThrow(DomainError)
    })
  })
})
