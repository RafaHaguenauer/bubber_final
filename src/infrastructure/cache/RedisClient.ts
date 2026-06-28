import Redis from 'ioredis'

let client: Redis | null = null

export function getRedisClient(url: string): Redis {
  if (!client) {
    client = new Redis(url, {
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      lazyConnect: false,
    })
    client.on('error', (err) => console.error('[redis] Erro:', err.message))
    client.on('ready', () => console.log('[redis] Conectado'))
  }
  return client
}

export async function disconnectRedis(): Promise<void> {
  if (client) {
    await client.quit()
    client = null
  }
}
