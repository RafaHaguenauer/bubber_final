import * as grpc from '@grpc/grpc-js'
import type { DriverService } from '../services/driver.service'
import type { VehicleService } from '../services/vehicle.service'

// SRP: traduz chamadas gRPC → DriverService / VehicleService
// DIP: depende das abstrações (DriverService, VehicleService) via construtor
export class DriverHandler {
  constructor(
    private readonly service: DriverService,
    private readonly vehicleService: VehicleService,
  ) {}

  // ── Hot-state ────────────────────────────────────────────────────────────────

  async registerDriver(call: grpc.ServerUnaryCall<any, any>, cb: grpc.sendUnaryData<any>) {
    try {
      const { driver_id, name } = call.request
      const driver = await this.service.register(driver_id, name)
      cb(null, { id: driver.id, name: driver.name, lat: driver.lat, lng: driver.lng, is_available: driver.isAvailable })
    } catch (err) {
      cb({ code: grpc.status.INTERNAL, message: (err as Error).message })
    }
  }

  async updateLocation(call: grpc.ServerUnaryCall<any, any>, cb: grpc.sendUnaryData<any>) {
    try {
      const { driver_id, lat, lng } = call.request
      const ok = await this.service.updateLocation(driver_id, lat, lng)
      cb(null, { success: ok, message: ok ? 'Localização atualizada' : 'Motorista não encontrado' })
    } catch (err) {
      cb({ code: grpc.status.INTERNAL, message: (err as Error).message })
    }
  }

  async setAvailability(call: grpc.ServerUnaryCall<any, any>, cb: grpc.sendUnaryData<any>) {
    try {
      const { driver_id, is_available } = call.request
      const ok = await this.service.setAvailability(driver_id, is_available)
      cb(null, { success: ok, message: ok ? 'Disponibilidade atualizada' : 'Motorista não encontrado' })
    } catch (err) {
      cb({ code: grpc.status.INTERNAL, message: (err as Error).message })
    }
  }

  async listAvailable(_call: grpc.ServerUnaryCall<any, any>, cb: grpc.sendUnaryData<any>) {
    try {
      const drivers = (await this.service.listAvailable()).map(d => ({
        id: d.id, name: d.name, lat: d.lat, lng: d.lng, is_available: d.isAvailable,
      }))
      cb(null, { drivers })
    } catch (err) {
      cb({ code: grpc.status.INTERNAL, message: (err as Error).message })
    }
  }

  async findNearestDriver(call: grpc.ServerUnaryCall<any, any>, cb: grpc.sendUnaryData<any>) {
    try {
      const { origin_lat, origin_lng, radius_km } = call.request
      const result = await this.service.findNearestDriver(origin_lat, origin_lng, radius_km ?? 10)
      if (!result.found || !result.driver) {
        cb(null, { found: false, driver: null, distance_km: 0 })
        return
      }
      cb(null, {
        found: true,
        driver: { id: result.driver.id, name: result.driver.name, lat: result.driver.lat, lng: result.driver.lng, is_available: result.driver.isAvailable },
        distance_km: result.distanceKm,
      })
    } catch (err) {
      cb({ code: grpc.status.INTERNAL, message: (err as Error).message })
    }
  }

  // ── Driver CRUD ───────────────────────────────────────────────────────────────

  async createDriver(call: grpc.ServerUnaryCall<any, any>, cb: grpc.sendUnaryData<any>) {
    try {
      const { id, name, email, phone, password } = call.request
      const driver = await this.service.createDriver({
        id, name, email, phone, password,
        rating: 5.0, isActive: true,
        lat: 0, lng: 0, isAvailable: false,
        createdAt: new Date(), updatedAt: new Date(),
      })
      cb(null, this.toFullResponse(driver))
    } catch (err) {
      cb({ code: grpc.status.ALREADY_EXISTS, message: (err as Error).message })
    }
  }

  async getDriver(call: grpc.ServerUnaryCall<any, any>, cb: grpc.sendUnaryData<any>) {
    try {
      const { id } = call.request
      const driver = await this.service.getDriver(id)
      cb(null, { found: !!driver, driver: driver ? this.toFullResponse(driver) : null })
    } catch (err) {
      cb({ code: grpc.status.INTERNAL, message: (err as Error).message })
    }
  }

  async getDriverByEmail(call: grpc.ServerUnaryCall<any, any>, cb: grpc.sendUnaryData<any>) {
    try {
      const { email } = call.request
      const driver = await this.service.getDriverByEmail(email)
      cb(null, { found: !!driver, driver: driver ? this.toFullResponse(driver) : null })
    } catch (err) {
      cb({ code: grpc.status.INTERNAL, message: (err as Error).message })
    }
  }

  async listDrivers(_call: grpc.ServerUnaryCall<any, any>, cb: grpc.sendUnaryData<any>) {
    try {
      const drivers = (await this.service.listDrivers()).map(d => this.toFullResponse(d))
      cb(null, { drivers })
    } catch (err) {
      cb({ code: grpc.status.INTERNAL, message: (err as Error).message })
    }
  }

  async updateDriver(call: grpc.ServerUnaryCall<any, any>, cb: grpc.sendUnaryData<any>) {
    try {
      const { id, name, email, phone, rating, is_active } = call.request
      const driver = await this.service.updateDriver(id, {
        name, email, phone, rating, isActive: is_active,
      })
      cb(null, this.toFullResponse(driver))
    } catch (err) {
      cb({ code: grpc.status.NOT_FOUND, message: (err as Error).message })
    }
  }

  async deleteDriver(call: grpc.ServerUnaryCall<any, any>, cb: grpc.sendUnaryData<any>) {
    try {
      const { id } = call.request
      await this.service.deleteDriver(id)
      cb(null, { success: true, message: 'Motorista removido' })
    } catch (err) {
      cb({ code: grpc.status.NOT_FOUND, message: (err as Error).message })
    }
  }

  // ── Vehicle CRUD ───────────────────────────────────────────────────────────────

  async createVehicle(call: grpc.ServerUnaryCall<any, any>, cb: grpc.sendUnaryData<any>) {
    try {
      const { id, driver_id, plate, brand, model, year, color } = call.request
      const vehicle = await this.vehicleService.createVehicle({
        id, driverId: driver_id, plate, brand, model, year, color,
        createdAt: new Date(), updatedAt: new Date(),
      })
      cb(null, this.toVehicleResponse(vehicle))
    } catch (err) {
      cb({ code: grpc.status.ALREADY_EXISTS, message: (err as Error).message })
    }
  }

  async getVehicle(call: grpc.ServerUnaryCall<any, any>, cb: grpc.sendUnaryData<any>) {
    try {
      const { id } = call.request
      const vehicle = await this.vehicleService.getVehicle(id)
      cb(null, { found: !!vehicle, vehicle: vehicle ? this.toVehicleResponse(vehicle) : null })
    } catch (err) {
      cb({ code: grpc.status.INTERNAL, message: (err as Error).message })
    }
  }

  async getVehicleByPlate(call: grpc.ServerUnaryCall<any, any>, cb: grpc.sendUnaryData<any>) {
    try {
      const { plate } = call.request
      const vehicle = await this.vehicleService.getVehicleByPlate(plate)
      cb(null, { found: !!vehicle, vehicle: vehicle ? this.toVehicleResponse(vehicle) : null })
    } catch (err) {
      cb({ code: grpc.status.INTERNAL, message: (err as Error).message })
    }
  }

  async listVehiclesByDriver(call: grpc.ServerUnaryCall<any, any>, cb: grpc.sendUnaryData<any>) {
    try {
      const { driver_id } = call.request
      const vehicles = (await this.vehicleService.listByDriver(driver_id)).map(v => this.toVehicleResponse(v))
      cb(null, { vehicles })
    } catch (err) {
      cb({ code: grpc.status.INTERNAL, message: (err as Error).message })
    }
  }

  async updateVehicle(call: grpc.ServerUnaryCall<any, any>, cb: grpc.sendUnaryData<any>) {
    try {
      const { id, plate, brand, model, year, color } = call.request
      const vehicle = await this.vehicleService.updateVehicle(id, { plate, brand, model, year, color })
      cb(null, this.toVehicleResponse(vehicle))
    } catch (err) {
      cb({ code: grpc.status.NOT_FOUND, message: (err as Error).message })
    }
  }

  async deleteVehicle(call: grpc.ServerUnaryCall<any, any>, cb: grpc.sendUnaryData<any>) {
    try {
      const { id } = call.request
      await this.vehicleService.deleteVehicle(id)
      cb(null, { success: true, message: 'Veículo removido' })
    } catch (err) {
      cb({ code: grpc.status.NOT_FOUND, message: (err as Error).message })
    }
  }

  // ── Mappers ────────────────────────────────────────────────────────────────────

  private toFullResponse(d: {
    id: string; name: string; email: string; phone: string; password: string;
    rating: number; isActive: boolean; lat: number; lng: number; isAvailable: boolean;
    createdAt: Date; updatedAt: Date
  }) {
    return {
      id: d.id, name: d.name, email: d.email, phone: d.phone, password: d.password,
      rating: d.rating, is_active: d.isActive,
      lat: d.lat, lng: d.lng, is_available: d.isAvailable,
      created_at: d.createdAt.toISOString(),
      updated_at: d.updatedAt.toISOString(),
    }
  }

  private toVehicleResponse(v: {
    id: string; driverId: string; plate: string; brand: string;
    model: string; year: number; color: string; createdAt: Date; updatedAt: Date
  }) {
    return {
      id: v.id, driver_id: v.driverId, plate: v.plate, brand: v.brand,
      model: v.model, year: v.year, color: v.color,
      created_at: v.createdAt.toISOString(),
      updated_at: v.updatedAt.toISOString(),
    }
  }
}
