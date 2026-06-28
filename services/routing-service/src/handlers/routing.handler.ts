import * as grpc from '@grpc/grpc-js'
import type { IRoutingProvider } from '../providers/IRoutingProvider'

// SRP: handler só traduz chamadas gRPC para a camada de provider
// DIP: depende de IRoutingProvider (abstração), não de OsrmRoutingProvider (concreto)
export class RoutingHandler {
  constructor(private readonly provider: IRoutingProvider) {}

  async calculateRoute(call: grpc.ServerUnaryCall<any, any>, cb: grpc.sendUnaryData<any>) {
    const { origin_lat, origin_lng, dest_lat, dest_lng } = call.request
    try {
      const result = await this.provider.calculateRoute(origin_lat, origin_lng, dest_lat, dest_lng)
      cb(null, {
        distance_km: result.distanceKm,
        duration_minutes: result.durationMinutes,
        polyline: result.polyline,
      })
    } catch (err) {
      cb({ code: grpc.status.INTERNAL, message: (err as Error).message })
    }
  }

  async calculateDistance(call: grpc.ServerUnaryCall<any, any>, cb: grpc.sendUnaryData<any>) {
    const { origin_lat, origin_lng, dest_lat, dest_lng } = call.request
    try {
      const result = await this.provider.calculateRoute(origin_lat, origin_lng, dest_lat, dest_lng)
      cb(null, { distance_km: result.distanceKm, duration_minutes: result.durationMinutes })
    } catch (err) {
      cb({ code: grpc.status.INTERNAL, message: (err as Error).message })
    }
  }
}
