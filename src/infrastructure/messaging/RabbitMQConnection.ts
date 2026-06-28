import amqplib from 'amqplib'

// ── Constantes de topologia ────────────────────────────────────────────────────

export const EXCHANGE = 'bubber.events'     // topic exchange principal
export const DLX      = 'bubber.dlx'        // dead letter exchange (direct)

// Queues — todas configuradas como Lazy para economizar memória RAM
export const QUEUE_NOTIFICATIONS      = 'ride.notifications'
export const QUEUE_NOTIFICATIONS_DLQ  = 'ride.notifications.dlq'

// Routing keys publicadas pelo BFF
export const RK_RIDE_COMPLETED = 'ride.completed'
export const RK_RIDE_CANCELLED = 'ride.cancelled'
export const RK_RIDE_CREATED   = 'ride.created'

// ── Singleton de conexão/canal ─────────────────────────────────────────────────

let channel: amqplib.Channel | null = null

export async function getRabbitChannel(url: string): Promise<amqplib.Channel> {
  if (channel) return channel

  const conn = await amqplib.connect(url)
  channel = await conn.createChannel()

  // 1. Dead Letter Exchange (direct) — recebe mensagens rejeitadas
  await channel.assertExchange(DLX, 'direct', { durable: true })

  // 2. Dead Letter Queue — Lazy para otimizar memória
  await channel.assertQueue(QUEUE_NOTIFICATIONS_DLQ, {
    durable: true,
    arguments: { 'x-queue-mode': 'lazy' },
  })
  await channel.bindQueue(QUEUE_NOTIFICATIONS_DLQ, DLX, QUEUE_NOTIFICATIONS)

  // 3. Topic Exchange principal
  await channel.assertExchange(EXCHANGE, 'topic', { durable: true })

  // 4. Fila de notificações — Lazy + DLQ configurada
  await channel.assertQueue(QUEUE_NOTIFICATIONS, {
    durable: true,
    arguments: {
      'x-queue-mode': 'lazy',              // Lazy Queue: mensagens vão para disco
      'x-dead-letter-exchange': DLX,        // encaminha para DLX em caso de falha
      'x-dead-letter-routing-key': QUEUE_NOTIFICATIONS,
      'x-message-ttl': 86_400_000,          // mensagem expira em 24h se não consumida
    },
  })
  await channel.bindQueue(QUEUE_NOTIFICATIONS, EXCHANGE, 'ride.#')

  conn.on('error', () => { channel = null })
  conn.on('close', () => { channel = null })

  return channel
}
