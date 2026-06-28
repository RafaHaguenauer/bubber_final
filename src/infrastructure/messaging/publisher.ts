import { env } from '../../config/env'
import { RideEventPublisher } from './RideEventPublisher'

// Singleton condicional — null quando RABBITMQ_ENABLED=false (dev sem Docker)
export const publisher: RideEventPublisher | null =
  env.RABBITMQ_ENABLED === 'true'
    ? new RideEventPublisher(env.RABBITMQ_URL)
    : null

if (!publisher) {
  console.log('[rabbitmq] Publisher desativado — defina RABBITMQ_ENABLED=true para habilitar')
}
