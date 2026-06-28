import { PrismaClient } from '@prisma/client'
import type { ParsedDriverEvent } from './DebeziumEventParser'

// Driven Adapter: consome eventos CDC do Driver Service e mantém
// driver_replicas atualizado no bubber_db.
// Replica o perfil completo do motorista para que o BFF possa resolver
// dados de motorista (ex: Ride.driver) sem chamadas gRPC desnecessárias.
export class DriverReplicationHandler {
  constructor(private readonly prisma: PrismaClient) {}

  async handle(event: ParsedDriverEvent): Promise<void> {
    const { op, data } = event

    if (op === 'c' || op === 'u' || op === 'r') {
      await this.prisma.driverReplica.upsert({
        where: { id: data.id },
        create: {
          id:          data.id,
          name:        data.name,
          email:       data.email       ?? '',
          phone:       data.phone       ?? '',
          rating:      data.rating      ?? 5.0,
          isActive:    data.is_active   ?? true,
          lat:         data.lat         ?? 0,
          lng:         data.lng         ?? 0,
          isAvailable: data.is_available ?? false,
        },
        update: {
          name:        data.name,
          email:       data.email       ?? '',
          phone:       data.phone       ?? '',
          rating:      data.rating      ?? 5.0,
          isActive:    data.is_active   ?? true,
          lat:         data.lat         ?? 0,
          lng:         data.lng         ?? 0,
          isAvailable: data.is_available ?? false,
        },
      })
      console.log(`[replication] Driver ${data.id} (${data.name}) sincronizado — op: ${op}`)
    }

    if (op === 'd' || data.__deleted === 'true') {
      await this.prisma.driverReplica.deleteMany({ where: { id: data.id } })
      console.log(`[replication] Driver ${data.id} removido da réplica — op: d`)
    }
  }
}
