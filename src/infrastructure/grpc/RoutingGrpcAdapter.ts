import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import path from 'path'
import type { IRoutingServicePort, RouteInfo } from '../../domain/ports/IRoutingServicePort'

export class RoutingGrpcAdapter implements IRoutingServicePort {
  private readonly client: any

  constructor(serviceUrl: string) {
    const PROTO_PATH = path.join(process.cwd(), 'proto', 'routing.proto')
    const packageDef = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    })
    const proto = grpc.loadPackageDefinition(packageDef) as any
    this.client = new proto.routing.RoutingService(
      serviceUrl,
      grpc.credentials.createInsecure(),
    )
  }

  private call<T>(method: string, request: Record<string, unknown>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.client[method](request, (err: Error | null, response: T) => {
        if (err) reject(err)
        else resolve(response)
      })
    })
  }

  async calculateRoute(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
  ): Promise<RouteInfo> {
    const res = await this.call<any>('CalculateRoute', {
      origin_lat: originLat,
      origin_lng: originLng,
      dest_lat: destLat,
      dest_lng: destLng,
    })
    return {
      distanceKm: res.distance_km,
      durationMinutes: res.duration_minutes,
      polyline: res.polyline,
    }
  }
}
