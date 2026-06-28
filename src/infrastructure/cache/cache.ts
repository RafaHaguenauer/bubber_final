import { env } from '../../config/env'
import { getRedisClient } from './RedisClient'
import { CacheService } from './CacheService'

// Singleton condicional — null quando REDIS_ENABLED=false (dev sem Docker)
export const cache: CacheService | null =
  env.REDIS_ENABLED === 'true'
    ? new CacheService(getRedisClient(env.REDIS_URL))
    : null

export { CacheKey, TTL } from './CacheService'

if (!cache) {
  console.log('[redis] Cache desativado — defina REDIS_ENABLED=true para habilitar')
}
