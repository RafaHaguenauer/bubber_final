import { prisma } from '../infrastructure/database/prisma/client'
import { Driver } from '../domain/entities/Driver'
import { PrismaUserRepository } from '../infrastructure/database/repositories/PrismaUserRepository'
import { PrismaRideRepository } from '../infrastructure/database/repositories/PrismaRideRepository'
import { PrismaPaymentRepository } from '../infrastructure/database/repositories/PrismaPaymentRepository'
import { DriverGrpcAdapter } from '../infrastructure/grpc/DriverGrpcAdapter'
import { RoutingGrpcAdapter } from '../infrastructure/grpc/RoutingGrpcAdapter'
import { RidePricingService } from '../domain/services/RidePricingService'
import { CreateUserUseCase } from '../application/use-cases/user/CreateUserUseCase'
import { GetUserUseCase } from '../application/use-cases/user/GetUserUseCase'
import { ListUsersUseCase } from '../application/use-cases/user/ListUsersUseCase'
import { UpdateUserUseCase } from '../application/use-cases/user/UpdateUserUseCase'
import { DeleteUserUseCase } from '../application/use-cases/user/DeleteUserUseCase'
import { CreateDriverUseCase } from '../application/use-cases/driver/CreateDriverUseCase'
import { GetDriverUseCase } from '../application/use-cases/driver/GetDriverUseCase'
import { ListDriversUseCase } from '../application/use-cases/driver/ListDriversUseCase'
import { UpdateDriverUseCase } from '../application/use-cases/driver/UpdateDriverUseCase'
import { DeleteDriverUseCase } from '../application/use-cases/driver/DeleteDriverUseCase'
import { RegisterDriverInServiceUseCase } from '../application/use-cases/driver/RegisterDriverInServiceUseCase'
import { UpdateDriverLocationUseCase } from '../application/use-cases/driver/UpdateDriverLocationUseCase'
import { SetDriverAvailabilityUseCase } from '../application/use-cases/driver/SetDriverAvailabilityUseCase'
import { CreateVehicleUseCase } from '../application/use-cases/vehicle/CreateVehicleUseCase'
import { GetVehicleUseCase } from '../application/use-cases/vehicle/GetVehicleUseCase'
import { ListVehiclesUseCase } from '../application/use-cases/vehicle/ListVehiclesUseCase'
import { UpdateVehicleUseCase } from '../application/use-cases/vehicle/UpdateVehicleUseCase'
import { DeleteVehicleUseCase } from '../application/use-cases/vehicle/DeleteVehicleUseCase'
import { CreateRideUseCase } from '../application/use-cases/ride/CreateRideUseCase'
import { GetRideUseCase } from '../application/use-cases/ride/GetRideUseCase'
import { ListRidesUseCase } from '../application/use-cases/ride/ListRidesUseCase'
import { UpdateRideUseCase } from '../application/use-cases/ride/UpdateRideUseCase'
import { DeleteRideUseCase } from '../application/use-cases/ride/DeleteRideUseCase'
import { RequestRideUseCase } from '../application/use-cases/ride/RequestRideUseCase'
import { CreatePaymentUseCase } from '../application/use-cases/payment/CreatePaymentUseCase'
import { GetPaymentUseCase } from '../application/use-cases/payment/GetPaymentUseCase'
import { ListPaymentsUseCase } from '../application/use-cases/payment/ListPaymentsUseCase'
import { UpdatePaymentUseCase } from '../application/use-cases/payment/UpdatePaymentUseCase'
import { DeletePaymentUseCase } from '../application/use-cases/payment/DeletePaymentUseCase'
import { env } from '../config/env'

// ── Infrastructure: driven adapters (secondary/outgoing) ─────────────────────
const userRepo    = new PrismaUserRepository(prisma)
const rideRepo    = new PrismaRideRepository(prisma)
const paymentRepo = new PrismaPaymentRepository(prisma)

// Driver e Vehicle — agora propriedade do Driver Service (driver_db :5433)
// O BFF acessa via gRPC — PrismaDriverRepository e PrismaVehicleRepository foram removidos.
const driverServicePort  = new DriverGrpcAdapter(env.DRIVER_SERVICE_URL)
const routingServicePort = new RoutingGrpcAdapter(env.ROUTING_SERVICE_URL)

// ── Domain services ───────────────────────────────────────────────────────────
const ridePricingService = new RidePricingService()

// ── Application: use cases (primary/incoming ports) ───────────────────────────
export const createUser = new CreateUserUseCase(userRepo)
export const getUser    = new GetUserUseCase(userRepo)
export const listUsers  = new ListUsersUseCase(userRepo)
export const updateUser = new UpdateUserUseCase(userRepo)
export const deleteUser = new DeleteUserUseCase(userRepo)

// Driver — CRUD delegado ao Driver Service via gRPC (DIP + DB isolation)
export const createDriver              = new CreateDriverUseCase(driverServicePort)
export const getDriver                 = new GetDriverUseCase(driverServicePort)
export const listDrivers               = new ListDriversUseCase(driverServicePort)
export const updateDriver              = new UpdateDriverUseCase(driverServicePort)
export const deleteDriver              = new DeleteDriverUseCase(driverServicePort)
export const registerDriverInService   = new RegisterDriverInServiceUseCase(driverServicePort)
export const updateDriverLocation      = new UpdateDriverLocationUseCase(driverServicePort)
export const setDriverAvailability     = new SetDriverAvailabilityUseCase(driverServicePort)

// Vehicle — CRUD delegado ao Driver Service via gRPC
export const createVehicle = new CreateVehicleUseCase(driverServicePort)
export const getVehicle    = new GetVehicleUseCase(driverServicePort)
export const listVehicles  = new ListVehiclesUseCase(driverServicePort)
export const updateVehicle = new UpdateVehicleUseCase(driverServicePort)
export const deleteVehicle = new DeleteVehicleUseCase(driverServicePort)

export const createRide  = new CreateRideUseCase(rideRepo)
export const getRide     = new GetRideUseCase(rideRepo)
export const listRides   = new ListRidesUseCase(rideRepo)
export const updateRide  = new UpdateRideUseCase(rideRepo)
export const deleteRide  = new DeleteRideUseCase(rideRepo)
export const requestRide = new RequestRideUseCase(
  rideRepo,
  driverServicePort,
  routingServicePort,
  ridePricingService,
)

export const createPayment = new CreatePaymentUseCase(paymentRepo)
export const getPayment    = new GetPaymentUseCase(paymentRepo)
export const listPayments  = new ListPaymentsUseCase(paymentRepo)
export const updatePayment = new UpdatePaymentUseCase(paymentRepo)
export const deletePayment = new DeletePaymentUseCase(paymentRepo)

// ── CQRS — read model (query side) ───────────────────────────────────────────
// Resolve driver a partir da réplica local (driver_replicas) sem chamar o Driver Service via gRPC.
// A réplica é mantida eventual-consistente pelo pipeline: driver_db → Debezium → Kafka → KafkaConsumer → BFF.
// Fallback para null quando o registro ainda não foi replicado.
export async function getDriverFromReplica(driverId: string): Promise<Driver | null> {
  const replica = await prisma.driverReplica.findUnique({ where: { id: driverId } })
  if (!replica) return null
  return new Driver(
    replica.id,
    replica.name,
    replica.email,
    replica.phone,
    '',
    replica.rating,
    replica.isActive,
    replica.createdAt,
    replica.syncedAt,
  )
}
