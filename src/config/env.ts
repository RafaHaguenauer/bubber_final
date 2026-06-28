import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string(),
  DRIVER_SERVICE_URL: z.string().default('localhost:50051'),
  ROUTING_SERVICE_URL: z.string().default('localhost:50052'),
  KAFKA_BROKERS: z.string().default('localhost:9092'),
  KAFKA_ENABLED: z.string().default('false'),
  RABBITMQ_URL: z.string().default('amqp://admin:admin@localhost:5672'),
  RABBITMQ_ENABLED: z.string().default('false'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_ENABLED: z.string().default('false'),
})

export const env = envSchema.parse(process.env)
