import * as container from '../../../composition-root/container'
import { cache, CacheKey, TTL } from '../../../infrastructure/cache/cache'
import type { Driver } from '../../../domain/entities/Driver'

export const driverResolvers = {
  Query: {
    driver: (_: unknown, { id }: { id: string }) => {
      if (!cache) return container.getDriver.execute(id)
      return cache.getOrFetch(CacheKey.driver(id), TTL.DRIVER, () => container.getDriver.execute(id))
    },
    drivers: () => {
      if (!cache) return container.listDrivers.execute()
      return cache.getOrFetch(CacheKey.drivers(), TTL.DRIVERS_LIST, () => container.listDrivers.execute())
    },
    activeDrivers: async () => {
      // Sempre via DB — filtro dinâmico não cacheado para evitar inconsistência
      const all = await container.listDrivers.execute()
      return all.filter((d) => d.isActive)
    },
  },
  Mutation: {
    createDriver: async (_: unknown, { input }: { input: any }) => {
      const driver = await container.createDriver.execute(input)
      await cache?.del(CacheKey.drivers())
      return driver
    },
    updateDriver: async (_: unknown, { id, input }: { id: string; input: any }) => {
      const driver = await container.updateDriver.execute({ id, ...input })
      await cache?.del(CacheKey.driver(id), CacheKey.drivers())
      return driver
    },
    deleteDriver: async (_: unknown, { id }: { id: string }) => {
      const result = await container.deleteDriver.execute(id)
      await cache?.del(CacheKey.driver(id), CacheKey.drivers())
      return result
    },
  },
  Driver: {
    vehicles: (parent: Driver) =>
      container.listVehicles.execute({ driverId: parent.id }),
    rides: (parent: Driver) =>
      container.listRides.execute({ driverId: parent.id }),
  },
}
