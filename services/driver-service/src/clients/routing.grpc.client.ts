import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import path from 'path'

const PROTO_PATH = path.resolve(__dirname, '../../../../proto/routing.proto')

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
})

const proto = grpc.loadPackageDefinition(packageDef) as any

let client: any = null

function getClient() {
  if (!client) {
    const url = process.env.ROUTING_SERVICE_URL ?? 'localhost:50052'
    client = new proto.routing.RoutingService(url, grpc.credentials.createInsecure())
  }
  return client
}

export interface DistanceResult {
  distance_km: number
  duration_minutes: number
}

export function calculateDistance(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
): Promise<DistanceResult> {
  return new Promise((resolve, reject) => {
    getClient().calculateDistance(
      { origin_lat: originLat, origin_lng: originLng, dest_lat: destLat, dest_lng: destLng },
      (err: grpc.ServiceError | null, response: DistanceResult) => {
        if (err) reject(err)
        else resolve(response)
      },
    )
  })
}
