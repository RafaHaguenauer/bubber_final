import 'dotenv/config'
import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import { PrismaDriverRepository } from './repositories/prisma.driver.repository'
import { PrismaVehicleRepository } from './repositories/prisma.vehicle.repository'
import { DriverService } from './services/driver.service'
import { VehicleService } from './services/vehicle.service'
import { DriverHandler } from './handlers/driver.handler'
import { calculateDistance } from './clients/routing.grpc.client'

const PROTO_PATH = path.resolve(__dirname, '../../../proto/driver.proto')
const PORT = process.env.GRPC_PORT ?? '50051'

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
})

const proto = grpc.loadPackageDefinition(packageDef) as any

// Composition root — wiring de dependências (DIP)
const prisma         = new PrismaClient()
const driverRepo     = new PrismaDriverRepository(prisma)
const vehicleRepo    = new PrismaVehicleRepository(prisma)
const driverSvc      = new DriverService(driverRepo, calculateDistance)
const vehicleSvc     = new VehicleService(vehicleRepo)
const handler        = new DriverHandler(driverSvc, vehicleSvc)

const server = new grpc.Server()

server.addService(proto.driver.DriverService.service, {
  // Hot-state
  registerDriver:    handler.registerDriver.bind(handler),
  updateLocation:    handler.updateLocation.bind(handler),
  setAvailability:   handler.setAvailability.bind(handler),
  listAvailable:     handler.listAvailable.bind(handler),
  findNearestDriver: handler.findNearestDriver.bind(handler),
  // Driver CRUD
  createDriver:      handler.createDriver.bind(handler),
  getDriver:         handler.getDriver.bind(handler),
  getDriverByEmail:  handler.getDriverByEmail.bind(handler),
  listDrivers:       handler.listDrivers.bind(handler),
  updateDriver:      handler.updateDriver.bind(handler),
  deleteDriver:      handler.deleteDriver.bind(handler),
  // Vehicle CRUD
  createVehicle:         handler.createVehicle.bind(handler),
  getVehicle:            handler.getVehicle.bind(handler),
  getVehicleByPlate:     handler.getVehicleByPlate.bind(handler),
  listVehiclesByDriver:  handler.listVehiclesByDriver.bind(handler),
  updateVehicle:         handler.updateVehicle.bind(handler),
  deleteVehicle:         handler.deleteVehicle.bind(handler),
})

server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
  if (err) {
    console.error('[driver-service] Erro ao iniciar:', err)
    process.exit(1)
  }
  console.log(`[driver-service] gRPC rodando na porta ${port}`)
  console.log('[driver-service] DB: driver_db (Prisma) — Driver CRUD + Vehicle CRUD + hot-state')
  console.log('[driver-service] CDC: WAL lógico → Debezium → Kafka → BFF driver_replicas')
})

process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  server.tryShutdown(() => process.exit(0))
})
