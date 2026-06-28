import { vi } from 'vitest'
import type { IUserRepository } from '../../domain/repositories/IUserRepository'
import type { IDriverRepository } from '../../domain/repositories/IDriverRepository'
import type { IVehicleRepository } from '../../domain/repositories/IVehicleRepository'
import type { IRideRepository } from '../../domain/repositories/IRideRepository'
import type { IPaymentRepository } from '../../domain/repositories/IPaymentRepository'
import type { IDriverServicePort } from '../../domain/ports/IDriverServicePort'
import type { IRoutingServicePort } from '../../domain/ports/IRoutingServicePort'
import { User } from '../../domain/entities/User'
import { Driver } from '../../domain/entities/Driver'
import { Vehicle } from '../../domain/entities/Vehicle'
import { Ride } from '../../domain/entities/Ride'
import { Payment } from '../../domain/entities/Payment'

export const makeMockUserRepo = (overrides?: Partial<IUserRepository>): IUserRepository => ({
  findById: vi.fn(async () => null),
  findByEmail: vi.fn(async () => null),
  findAll: vi.fn(async () => []),
  create: vi.fn(async (u: User) => u),
  update: vi.fn(async (u: User) => u),
  delete: vi.fn(async () => {}),
  ...overrides,
})

export const makeMockDriverRepo = (overrides?: Partial<IDriverRepository>): IDriverRepository => ({
  findById: vi.fn(async () => null),
  findByEmail: vi.fn(async () => null),
  findAll: vi.fn(async () => []),
  create: vi.fn(async (d: Driver) => d),
  update: vi.fn(async (d: Driver) => d),
  delete: vi.fn(async () => {}),
  ...overrides,
})

export const makeMockVehicleRepo = (overrides?: Partial<IVehicleRepository>): IVehicleRepository => ({
  findById: vi.fn(async () => null),
  findByDriverId: vi.fn(async () => []),
  findByPlate: vi.fn(async () => null),
  findAll: vi.fn(async () => []),
  create: vi.fn(async (v: Vehicle) => v),
  update: vi.fn(async (v: Vehicle) => v),
  delete: vi.fn(async () => {}),
  ...overrides,
})

export const makeMockRideRepo = (overrides?: Partial<IRideRepository>): IRideRepository => ({
  findById: vi.fn(async () => null),
  findByUserId: vi.fn(async () => []),
  findByDriverId: vi.fn(async () => []),
  findAll: vi.fn(async () => []),
  create: vi.fn(async (r: Ride) => r),
  update: vi.fn(async (r: Ride) => r),
  delete: vi.fn(async () => {}),
  ...overrides,
})

export const makeMockPaymentRepo = (overrides?: Partial<IPaymentRepository>): IPaymentRepository => ({
  findById: vi.fn(async () => null),
  findByRideId: vi.fn(async () => null),
  findAll: vi.fn(async () => []),
  create: vi.fn(async (p: Payment) => p),
  update: vi.fn(async (p: Payment) => p),
  delete: vi.fn(async () => {}),
  ...overrides,
})

export const makeMockDriverPort = (overrides?: Partial<IDriverServicePort>): IDriverServicePort => ({
  // Hot-state
  registerDriver: vi.fn(async () => {}),
  updateLocation: vi.fn(async () => {}),
  setAvailability: vi.fn(async () => {}),
  findNearestDriver: vi.fn(async () => ({
    found: true,
    driver: { id: 'driver-1', name: 'Carlos', lat: -22.9068, lng: -43.1729, isAvailable: true },
    distanceKm: 1.2,
  })),
  // Driver CRUD
  createDriver: vi.fn(async (d: Driver) => d),
  getDriver: vi.fn(async () => null),
  getDriverByEmail: vi.fn(async () => null),
  listDrivers: vi.fn(async () => []),
  updateDriver: vi.fn(async (id, changes) => Driver.create(id, changes.name ?? '', changes.email ?? '', changes.phone ?? '', '')),
  deleteDriver: vi.fn(async () => {}),
  // Vehicle CRUD
  createVehicle: vi.fn(async (v: Vehicle) => v),
  getVehicle: vi.fn(async () => null),
  getVehicleByPlate: vi.fn(async () => null),
  listVehiclesByDriver: vi.fn(async () => []),
  updateVehicle: vi.fn(async (id, changes) => Vehicle.create(id, '', changes.plate ?? '', changes.brand ?? '', changes.model ?? '', changes.year ?? 0, changes.color ?? '')),
  deleteVehicle: vi.fn(async () => {}),
  ...overrides,
})

export const makeMockRoutingPort = (overrides?: Partial<IRoutingServicePort>): IRoutingServicePort => ({
  calculateRoute: vi.fn(async () => ({
    distanceKm: 5.3,
    durationMinutes: 12.0,
    polyline: 'encoded-polyline',
  })),
  ...overrides,
})
