import * as container from '../../../composition-root/container'
import { cache, CacheKey, TTL } from '../../../infrastructure/cache/cache'
import type { User } from '../../../domain/entities/User'

export const userResolvers = {
  Query: {
    user: (_: unknown, { id }: { id: string }) => {
      if (!cache) return container.getUser.execute(id)
      return cache.getOrFetch(CacheKey.user(id), TTL.USER, () => container.getUser.execute(id))
    },
    users: () => {
      if (!cache) return container.listUsers.execute()
      return cache.getOrFetch(CacheKey.users(), TTL.USERS_LIST, () => container.listUsers.execute())
    },
  },
  Mutation: {
    createUser: async (_: unknown, { input }: { input: any }) => {
      const user = await container.createUser.execute(input)
      await cache?.del(CacheKey.users())
      return user
    },
    updateUser: async (_: unknown, { id, input }: { id: string; input: any }) => {
      const user = await container.updateUser.execute({ id, ...input })
      await cache?.del(CacheKey.user(id), CacheKey.users())
      return user
    },
    deleteUser: async (_: unknown, { id }: { id: string }) => {
      const result = await container.deleteUser.execute(id)
      await cache?.del(CacheKey.user(id), CacheKey.users())
      return result
    },
  },
  User: {
    rides: (parent: User) =>
      container.listRides.execute({ userId: parent.id }),
  },
}
