import 'dotenv/config'
import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import path from 'path'
import { RoutingProviderFactory } from './factories/routing.factory'
import { RoutingHandler } from './handlers/routing.handler'

const PROTO_PATH = path.resolve(__dirname, '../../../proto/routing.proto')
const PORT = process.env.GRPC_PORT ?? '50052'

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
})

const proto = grpc.loadPackageDefinition(packageDef) as any

// Composition root: Factory cria o provider correto, Handler recebe via injeção
const provider = RoutingProviderFactory.create()
const handler = new RoutingHandler(provider)

const server = new grpc.Server()

server.addService(proto.routing.RoutingService.service, {
  calculateRoute:    handler.calculateRoute.bind(handler),
  calculateDistance: handler.calculateDistance.bind(handler),
})

server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
  if (err) {
    console.error('[routing-service] Erro ao iniciar:', err)
    process.exit(1)
  }
  console.log(`[routing-service] gRPC rodando na porta ${port}`)
})
