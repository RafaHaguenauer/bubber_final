import type Redis from 'ioredis'

// ── TTLs por regra de negócio ──────────────────────────────────────────────────
// Definem quanto tempo cada dado pode ficar desatualizado sem comprometer
// a consistência do sistema.

export const TTL = {
  USER:              300,   // 5 min  — dados de perfil mudam pouco
  USERS_LIST:        300,   // 5 min
  DRIVER:            300,   // 5 min  — dados de perfil
  DRIVERS_LIST:      300,   // 5 min
  RIDE_TERMINAL:    1800,   // 30 min — COMPLETED/CANCELLED: estado imutável
  RIDES_BY_USER:     120,   // 2 min  — lista pode mudar com novas corridas
  RIDES_BY_DRIVER:   120,   // 2 min
  PAYMENT:           600,   // 10 min — pagamento não muda após criado
  PAYMENTS_LIST:     300,   // 5 min
}

// Estados de corrida em andamento NÃO são cacheados (mudam com frequência)
const NON_CACHEABLE_STATUSES = new Set(['PENDING', 'ACCEPTED', 'IN_PROGRESS'])

// ── Cache keys ─────────────────────────────────────────────────────────────────
export const CacheKey = {
  user:        (id: string) => `cache:user:${id}`,
  users:       ()           => `cache:users`,
  driver:      (id: string) => `cache:driver:${id}`,
  drivers:     ()           => `cache:drivers`,
  ride:        (id: string) => `cache:ride:${id}`,
  ridesByUser: (userId: string) => `cache:rides:user:${userId}`,
  ridesByDriver: (driverId: string) => `cache:rides:driver:${driverId}`,
  payment:     (id: string) => `cache:payment:${id}`,
  payments:    ()           => `cache:payments`,
}

// ── CacheService ──────────────────────────────────────────────────────────────

export class CacheService {
  constructor(private readonly redis: Redis) {}

  // ── Leitura genérica ────────────────────────────────────────────────────────

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key)
    if (!raw) return null
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds)
  }

  // ── Padrão Cache-Aside ──────────────────────────────────────────────────────
  // Lê do cache; se miss, executa o fetcher, armazena e retorna o resultado.

  async getOrFetch<T>(key: string, ttl: number, fetcher: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached !== null) {
      console.log(`[cache] HIT  ${key}`)
      return cached
    }
    console.log(`[cache] MISS ${key}`)
    const fresh = await fetcher()
    if (fresh !== null && fresh !== undefined) {
      await this.set(key, fresh, ttl)
    }
    return fresh
  }

  // ── Invalidação ─────────────────────────────────────────────────────────────

  async del(...keys: string[]): Promise<void> {
    if (keys.length) await this.redis.del(...keys)
  }

  async delPattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern)
    if (keys.length) await this.redis.del(...keys)
  }

  // ── Regra de negócio: ride cacheável? ──────────────────────────────────────
  // Corridas em andamento mudam frequentemente — não cachear.

  rideIsCacheable(status: string): boolean {
    return !NON_CACHEABLE_STATUSES.has(status)
  }
}
