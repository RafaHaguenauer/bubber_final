import 'dotenv/config'
import amqplib, { Channel, ConsumeMessage } from 'amqplib'

// ── Topologia (espelha o que o BFF declara) ────────────────────────────────────
const EXCHANGE      = 'bubber.events'
const DLX           = 'bubber.dlx'
const QUEUE         = 'ride.notifications'
const QUEUE_DLQ     = 'ride.notifications.dlq'
const MAX_RETRIES   = 3
const RETRY_DELAY   = 5_000   // 5s antes de tentar reconectar ao broker

interface RideEvent {
  eventId: string
  routingKey: string
  rideId: string
  userId: string
  driverId: string | null
  status: string
  price: number | null
  originAddress: string
  destAddress: string
  timestamp: string
}

// ── Handlers de notificação ───────────────────────────────────────────────────

function handleRideCompleted(event: RideEvent): void {
  console.log(`[notification] ✓ Corrida concluída!`)
  console.log(`  Ride:    ${event.rideId}`)
  console.log(`  Usuário: ${event.userId}`)
  console.log(`  Valor:   R$ ${event.price?.toFixed(2) ?? '—'}`)
  console.log(`  Rota:    ${event.originAddress} → ${event.destAddress}`)
  // Ponto de extensão: integrar com Firebase FCM, OneSignal, SendGrid, etc.
}

function handleRideCancelled(event: RideEvent): void {
  console.log(`[notification] ✗ Corrida cancelada`)
  console.log(`  Ride:    ${event.rideId}`)
  console.log(`  Usuário: ${event.userId}`)
}

function handleRideCreated(event: RideEvent): void {
  console.log(`[notification] + Nova corrida solicitada`)
  console.log(`  Ride:    ${event.rideId}`)
  console.log(`  Rota:    ${event.originAddress} → ${event.destAddress}`)
}

// ── Processador de mensagem ───────────────────────────────────────────────────

async function processMessage(channel: Channel, msg: ConsumeMessage): Promise<void> {
  const raw = msg.content.toString()
  const event: RideEvent = JSON.parse(raw)

  // Contador de tentativas rastreado no header da mensagem (DLQ pattern)
  const retryCount = (msg.properties.headers?.['x-retry-count'] as number) ?? 0

  try {
    switch (event.routingKey) {
      case 'ride.completed': handleRideCompleted(event); break
      case 'ride.cancelled': handleRideCancelled(event); break
      case 'ride.created':   handleRideCreated(event);   break
      default:
        console.warn(`[notification] Routing key desconhecida: ${event.routingKey}`)
    }

    // Processamento bem-sucedido — confirma a mensagem (remove da fila)
    channel.ack(msg)
  } catch (err) {
    console.error(`[notification] Erro ao processar mensagem (tentativa ${retryCount + 1}/${MAX_RETRIES}):`, err)

    if (retryCount < MAX_RETRIES - 1) {
      // Rejeita sem re-enfileirar — Debezium/DLX vai reencaminhar com contador incrementado
      channel.nack(msg, false, false)
    } else {
      // Esgotou as tentativas → mensagem vai para a DLQ via x-dead-letter-exchange
      console.error(`[notification] Mensagem enviada para DLQ após ${MAX_RETRIES} tentativas`)
      channel.nack(msg, false, false)
    }
  }
}

// ── Setup de topologia e consumer ─────────────────────────────────────────────

async function setup(channel: Channel): Promise<void> {
  // Dead Letter Exchange
  await channel.assertExchange(DLX, 'direct', { durable: true })

  // Dead Letter Queue — Lazy (mensagens em disco, não RAM)
  await channel.assertQueue(QUEUE_DLQ, {
    durable: true,
    arguments: { 'x-queue-mode': 'lazy' },
  })
  await channel.bindQueue(QUEUE_DLQ, DLX, QUEUE)

  // Topic Exchange principal
  await channel.assertExchange(EXCHANGE, 'topic', { durable: true })

  // Fila principal — Lazy + DLQ config
  await channel.assertQueue(QUEUE, {
    durable: true,
    arguments: {
      'x-queue-mode': 'lazy',                    // Lazy Queue: economiza memória RAM
      'x-dead-letter-exchange': DLX,              // DLQ: encaminha msgs rejeitadas
      'x-dead-letter-routing-key': QUEUE,         // routing key na DLX
      'x-message-ttl': 86_400_000,               // TTL 24h
    },
  })
  await channel.bindQueue(QUEUE, EXCHANGE, 'ride.#')  // assina todos os eventos de corrida

  // Prefetch 1 — processa uma mensagem por vez (backpressure)
  await channel.prefetch(1)

  console.log(`[notification-service] Aguardando mensagens em: ${QUEUE}`)
  console.log(`[notification-service] Dead Letter Queue: ${QUEUE_DLQ}`)

  await channel.consume(QUEUE, (msg) => {
    if (!msg) return
    processMessage(channel, msg).catch(() => {
      channel.nack(msg, false, false)
    })
  })
}

// ── Entry point com reconexão automática ──────────────────────────────────────

async function start(): Promise<void> {
  const url = process.env.RABBITMQ_URL ?? 'amqp://admin:admin@localhost:5672'

  while (true) {
    try {
      console.log('[notification-service] Conectando ao RabbitMQ...')
      const conn = await amqplib.connect(url)
      const channel = await conn.createChannel()

      console.log('[notification-service] Conectado!')
      await setup(channel)

      await new Promise<void>((_, reject) => {
        conn.on('error', reject)
        conn.on('close', () => reject(new Error('Conexão fechada pelo broker')))
      })
    } catch (err) {
      console.error('[notification-service] Erro de conexão:', (err as Error).message)
      console.log(`[notification-service] Reconectando em ${RETRY_DELAY / 1000}s...`)
      await new Promise(r => setTimeout(r, RETRY_DELAY))
    }
  }
}

start()
