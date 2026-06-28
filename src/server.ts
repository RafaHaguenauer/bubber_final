import { env } from './config/env'
import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { typeDefs } from './presentation/graphql/schema/typeDefs'
import { resolvers } from './presentation/graphql/resolvers'
import { prisma } from './infrastructure/database/prisma/client'
import { KafkaConsumer } from './infrastructure/kafka/KafkaConsumer'
import { DriverReplicationHandler } from './infrastructure/kafka/DriverReplicationHandler'

let kafkaConsumer: KafkaConsumer | null = null

async function startKafkaConsumer(): Promise<void> {
  if (env.KAFKA_ENABLED !== 'true') {
    console.log('[kafka] Consumer desativado — defina KAFKA_ENABLED=true para habilitar')
    return
  }

  const brokers = env.KAFKA_BROKERS.split(',').map(b => b.trim())
  const replicationHandler = new DriverReplicationHandler(prisma)
  kafkaConsumer = new KafkaConsumer(brokers, replicationHandler)

  try {
    await kafkaConsumer.start()
  } catch (err) {
    console.error('[kafka] Falha ao conectar consumer — serviço continua sem replicação:', err)
    kafkaConsumer = null
  }
}

async function main() {
  const server = new ApolloServer({ typeDefs, resolvers })

  const { url } = await startStandaloneServer(server, {
    context: async () => ({}),
    listen: { port: env.PORT },
  })

  console.log(`Bubber GraphQL BFF pronto em ${url}`)
  console.log(`Arquitetura: Hexagonal + DDD + Kafka CDC`)

  // Inicia o consumer Kafka em background — não bloqueia o servidor GraphQL
  await startKafkaConsumer()
}

process.on('SIGTERM', async () => {
  if (kafkaConsumer) await kafkaConsumer.stop()
  await prisma.$disconnect()
  process.exit(0)
})

main().catch((err) => {
  console.error('Erro ao iniciar o servidor:', err)
  process.exit(1)
})
