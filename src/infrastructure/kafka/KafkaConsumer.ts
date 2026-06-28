import { Kafka, Consumer, EachMessagePayload } from 'kafkajs'
import { parseDriverCdcMessage } from './DebeziumEventParser'
import type { DriverReplicationHandler } from './DriverReplicationHandler'

// Tópico gerado pelo Debezium:  {topic.prefix}.{schema}.{table}
const DRIVER_TOPIC = 'driver_db.public.drivers'

// Kafka Consumer do BFF: assina o tópico CDC do Driver Service
// e delega cada evento ao DriverReplicationHandler.
export class KafkaConsumer {
  private readonly consumer: Consumer

  constructor(
    brokers: string[],
    private readonly driverHandler: DriverReplicationHandler,
  ) {
    const kafka = new Kafka({
      clientId: 'bubber-bff',
      brokers,
      retry: { retries: 8 },
    })
    this.consumer = kafka.consumer({ groupId: 'bubber-bff-replication' })
  }

  async start(): Promise<void> {
    await this.consumer.connect()
    await this.consumer.subscribe({ topic: DRIVER_TOPIC, fromBeginning: true })

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
        if (topic !== DRIVER_TOPIC) return

        const event = parseDriverCdcMessage(message.value)
        if (!event) {
          // Tombstone (null value) — ignorar, o SMT rewrite já trata deletes com __deleted
          return
        }

        try {
          await this.driverHandler.handle(event)
        } catch (err) {
          console.error(`[kafka] Erro ao processar mensagem partition=${partition} offset=${message.offset}:`, err)
        }
      },
    })

    console.log(`[kafka] Consumer conectado — assinando tópico: ${DRIVER_TOPIC}`)
  }

  async stop(): Promise<void> {
    await this.consumer.disconnect()
    console.log('[kafka] Consumer desconectado')
  }
}
