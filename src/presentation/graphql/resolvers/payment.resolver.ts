import * as container from '../../../composition-root/container'
import { cache, CacheKey, TTL } from '../../../infrastructure/cache/cache'
import type { Payment } from '../../../domain/entities/Payment'

export const paymentResolvers = {
  Query: {
    payment: (_: unknown, { id }: { id: string }) => {
      if (!cache) return container.getPayment.execute(id)
      return cache.getOrFetch(CacheKey.payment(id), TTL.PAYMENT, () => container.getPayment.execute(id))
    },
    payments: () => {
      if (!cache) return container.listPayments.execute()
      return cache.getOrFetch(CacheKey.payments(), TTL.PAYMENTS_LIST, () => container.listPayments.execute())
    },
    paymentByRide: (_: unknown, { rideId }: { rideId: string }) =>
      container.getPayment.byRideId(rideId),
  },
  Mutation: {
    createPayment: async (_: unknown, { input }: { input: any }) => {
      const payment = await container.createPayment.execute(input)
      await cache?.del(CacheKey.payments())
      return payment
    },
    updatePayment: async (_: unknown, { id, input }: { id: string; input: any }) => {
      const payment = await container.updatePayment.execute({ id, ...input })
      await cache?.del(CacheKey.payment(id), CacheKey.payments())
      return payment
    },
    deletePayment: async (_: unknown, { id }: { id: string }) => {
      const result = await container.deletePayment.execute(id)
      await cache?.del(CacheKey.payment(id), CacheKey.payments())
      return result
    },
  },
  Payment: {
    amount: (parent: Payment) => parent.amount.amount,
    ride: (parent: Payment) => container.getRide.execute(parent.rideId),
  },
}
