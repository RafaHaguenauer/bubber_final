import * as container from '../../../composition-root/container'
import { cache, CacheKey, TTL } from '../../../infrastructure/cache/cache'
import { publisher } from '../../../infrastructure/messaging/publisher'
import type { Ride } from '../../../domain/entities/Ride'

// Invalida todas as caches de lista afetadas por mudança em uma corrida
async function invalidateRideCaches(ride: Ride): Promise<void> {
  if (!cache) return
  await cache.del(CacheKey.ride(ride.id))
  await cache.delPattern(`cache:rides:user:${ride.userId}`)
  if (ride.driverId) await cache.delPattern(`cache:rides:driver:${ride.driverId}`)
}

export const rideResolvers = {
  Query: {
    ride: async (_: unknown, { id }: { id: string }) => {
      if (!cache) return container.getRide.execute(id)

      // Verifica o cache — mas primeiro verifica se o status é cacheável
      const cached = await cache.get<Ride>(CacheKey.ride(id))
      if (cached && cache.rideIsCacheable(cached.status)) return cached

      const ride = await container.getRide.execute(id)
      if (ride && cache.rideIsCacheable(ride.status)) {
        await cache.set(CacheKey.ride(id), ride, TTL.RIDE_TERMINAL)
      }
      return ride
    },
    rides: () => container.listRides.execute(),   // lista completa: sem cache (muito volátil)
    ridesByUser: (_: unknown, { userId }: { userId: string }) => {
      if (!cache) return container.listRides.execute({ userId })
      return cache.getOrFetch(
        CacheKey.ridesByUser(userId),
        TTL.RIDES_BY_USER,
        () => container.listRides.execute({ userId }),
      )
    },
    ridesByDriver: (_: unknown, { driverId }: { driverId: string }) => {
      if (!cache) return container.listRides.execute({ driverId })
      return cache.getOrFetch(
        CacheKey.ridesByDriver(driverId),
        TTL.RIDES_BY_DRIVER,
        () => container.listRides.execute({ driverId }),
      )
    },
  },
  Mutation: {
    createRide: async (_: unknown, { input }: { input: any }) => {
      const ride = await container.createRide.execute(input)
      // Publica evento e invalida listas
      await publisher?.publishRideCreated({
        rideId: ride.id,
        userId: ride.userId,
        driverId: ride.driverId,
        status: ride.status,
        price: ride.price?.amount ?? null,
        originAddress: ride.originAddress,
        destAddress: ride.destAddress,
      })
      await invalidateRideCaches(ride)
      return ride
    },
    updateRide: async (_: unknown, { id, input }: { id: string; input: any }) => {
      const ride = await container.updateRide.execute({ id, ...input })
      await invalidateRideCaches(ride)
      return ride
    },
    deleteRide: async (_: unknown, { id }: { id: string }) => {
      const result = await container.deleteRide.execute(id)
      await cache?.del(CacheKey.ride(id))
      return result
    },

    // ── Mutations de estado — disparam eventos RabbitMQ ────────────────────────

    completeRide: async (_: unknown, { id }: { id: string }) => {
      const ride = await container.updateRide.execute({ id, status: 'COMPLETED' })

      await publisher?.publishRideCompleted({
        rideId: ride.id,
        userId: ride.userId,
        driverId: ride.driverId,
        status: ride.status,
        price: ride.price?.amount ?? null,
        originAddress: ride.originAddress,
        destAddress: ride.destAddress,
      })

      // Corrida completa é imutável — cachear por 30 min
      await invalidateRideCaches(ride)
      if (cache) await cache.set(CacheKey.ride(ride.id), ride, TTL.RIDE_TERMINAL)

      return ride
    },

    cancelRide: async (_: unknown, { id, reason }: { id: string; reason?: string }) => {
      const ride = await container.updateRide.execute({ id, status: 'CANCELLED' })

      await publisher?.publishRideCancelled({
        rideId: ride.id,
        userId: ride.userId,
        driverId: ride.driverId,
        status: ride.status,
        price: ride.price?.amount ?? null,
        originAddress: ride.originAddress,
        destAddress: ride.destAddress,
      })

      await invalidateRideCaches(ride)
      if (cache) await cache.set(CacheKey.ride(ride.id), ride, TTL.RIDE_TERMINAL)

      if (reason) console.log(`[ride] Corrida ${id} cancelada. Motivo: ${reason}`)
      return ride
    },
  },
  Ride: {
    price: (parent: Ride) => parent.price?.amount ?? null,
    user: (parent: Ride) => container.getUser.execute(parent.userId),
    // CQRS — Query Side: resolve driver a partir do read model local (driver_replicas),
    // replicado via Kafka CDC (driver_db → Debezium → Kafka → BFF consumer).
    // Evita chamada gRPC por corrida; eventual-consistente com o Driver Service.
    driver: async (parent: Ride) => {
      if (!parent.driverId) return null
      const fromReplica = await container.getDriverFromReplica(parent.driverId)
      if (fromReplica) return fromReplica
      // Fallback: réplica ainda não sincronizada — chama gRPC diretamente
      try {
        return await container.getDriver.execute(parent.driverId)
      } catch {
        return null
      }
    },
    payment: (parent: Ride) => container.getPayment.byRideId(parent.id),
  },
}
