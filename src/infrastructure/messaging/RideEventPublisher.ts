import { getRabbitChannel, EXCHANGE, RK_RIDE_COMPLETED, RK_RIDE_CANCELLED, RK_RIDE_CREATED } from './RabbitMQConnection'

export interface RideEvent {
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

// Driver Adapter (Driven Port): publica eventos de corrida no RabbitMQ.
// O notification-service consome estes eventos de forma assíncrona.
export class RideEventPublisher {
  constructor(private readonly rabbitmqUrl: string) {}

  async publishRideCreated(ride: Omit<RideEvent, 'routingKey' | 'eventId' | 'timestamp'>): Promise<void> {
    await this.publish(RK_RIDE_CREATED, ride)
  }

  async publishRideCompleted(ride: Omit<RideEvent, 'routingKey' | 'eventId' | 'timestamp'>): Promise<void> {
    await this.publish(RK_RIDE_COMPLETED, ride)
  }

  async publishRideCancelled(ride: Omit<RideEvent, 'routingKey' | 'eventId' | 'timestamp'>): Promise<void> {
    await this.publish(RK_RIDE_CANCELLED, ride)
  }

  private async publish(routingKey: string, data: Omit<RideEvent, 'routingKey' | 'eventId' | 'timestamp'>): Promise<void> {
    const channel = await getRabbitChannel(this.rabbitmqUrl)

    const event: RideEvent = {
      ...data,
      routingKey,
      eventId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    }

    const payload = Buffer.from(JSON.stringify(event))

    channel.publish(EXCHANGE, routingKey, payload, {
      persistent: true,        // sobrevive a reinicialização do broker
      contentType: 'application/json',
      messageId: event.eventId,
      timestamp: Date.now(),
      appId: 'bubber-bff',
    })

    console.log(`[rabbitmq] Publicado: ${routingKey} → rideId=${data.rideId}`)
  }
}
