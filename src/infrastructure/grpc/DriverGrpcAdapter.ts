import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import path from 'path'
import { Driver } from '../../domain/entities/Driver'
import { Vehicle } from '../../domain/entities/Vehicle'
import type {
  IDriverServicePort,
  NearestDriverResult,
} from '../../domain/ports/IDriverServicePort'

export class DriverGrpcAdapter implements IDriverServicePort {
  private readonly client: any

  constructor(serviceUrl: string) {
    const PROTO_PATH = path.join(process.cwd(), 'proto', 'driver.proto')
    const packageDef = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    })
    const proto = grpc.loadPackageDefinition(packageDef) as any
    this.client = new proto.driver.DriverService(
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

  // ── Hot-state ────────────────────────────────────────────────────────────────

  async registerDriver(driverId: string, name: string): Promise<void> {
    await this.call('RegisterDriver', { driver_id: driverId, name })
  }

  async updateLocation(driverId: string, lat: number, lng: number): Promise<void> {
    const res = await this.call<{ success: boolean; message: string }>(
      'UpdateLocation',
      { driver_id: driverId, lat, lng },
    )
    if (!res.success) throw new Error(res.message)
  }

  async setAvailability(driverId: string, isAvailable: boolean): Promise<void> {
    const res = await this.call<{ success: boolean; message: string }>(
      'SetAvailability',
      { driver_id: driverId, is_available: isAvailable },
    )
    if (!res.success) throw new Error(res.message)
  }

  async findNearestDriver(
    originLat: number,
    originLng: number,
    radiusKm: number,
  ): Promise<NearestDriverResult> {
    const res = await this.call<any>('FindNearestDriver', {
      origin_lat: originLat,
      origin_lng: originLng,
      radius_km: radiusKm,
    })
    return {
      found: res.found,
      driver: res.found
        ? {
            id: res.driver.id,
            name: res.driver.name,
            lat: res.driver.lat,
            lng: res.driver.lng,
            isAvailable: res.driver.is_available,
          }
        : null,
      distanceKm: res.distance_km,
    }
  }

  // ── Driver CRUD ───────────────────────────────────────────────────────────────

  async createDriver(driver: Driver): Promise<Driver> {
    const res = await this.call<any>('CreateDriver', {
      id: driver.id,
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      password: driver.password,
    })
    return this.toDriver(res)
  }

  async getDriver(id: string): Promise<Driver | null> {
    const res = await this.call<any>('GetDriver', { id })
    return res.found ? this.toDriver(res.driver) : null
  }

  async getDriverByEmail(email: string): Promise<Driver | null> {
    const res = await this.call<any>('GetDriverByEmail', { email })
    return res.found ? this.toDriver(res.driver) : null
  }

  async listDrivers(): Promise<Driver[]> {
    const res = await this.call<any>('ListDrivers', {})
    return (res.drivers ?? []).map((d: any) => this.toDriver(d))
  }

  async updateDriver(
    id: string,
    changes: { name?: string; email?: string; phone?: string; rating?: number; isActive?: boolean },
  ): Promise<Driver> {
    const res = await this.call<any>('UpdateDriver', {
      id,
      name:      changes.name      ?? '',
      email:     changes.email     ?? '',
      phone:     changes.phone     ?? '',
      rating:    changes.rating    ?? 0,
      is_active: changes.isActive  ?? true,
    })
    return this.toDriver(res)
  }

  async deleteDriver(id: string): Promise<void> {
    await this.call('DeleteDriver', { id })
  }

  // ── Vehicle CRUD ───────────────────────────────────────────────────────────────

  async createVehicle(vehicle: Vehicle): Promise<Vehicle> {
    const res = await this.call<any>('CreateVehicle', {
      id:        vehicle.id,
      driver_id: vehicle.driverId,
      plate:     vehicle.plate,
      brand:     vehicle.brand,
      model:     vehicle.model,
      year:      vehicle.year,
      color:     vehicle.color,
    })
    return this.toVehicle(res)
  }

  async getVehicle(id: string): Promise<Vehicle | null> {
    const res = await this.call<any>('GetVehicle', { id })
    return res.found ? this.toVehicle(res.vehicle) : null
  }

  async getVehicleByPlate(plate: string): Promise<Vehicle | null> {
    const res = await this.call<any>('GetVehicleByPlate', { plate })
    return res.found ? this.toVehicle(res.vehicle) : null
  }

  async listVehiclesByDriver(driverId: string): Promise<Vehicle[]> {
    const res = await this.call<any>('ListVehiclesByDriver', { driver_id: driverId })
    return (res.vehicles ?? []).map((v: any) => this.toVehicle(v))
  }

  async updateVehicle(
    id: string,
    changes: { plate?: string; brand?: string; model?: string; year?: number; color?: string },
  ): Promise<Vehicle> {
    const res = await this.call<any>('UpdateVehicle', {
      id,
      plate: changes.plate ?? '',
      brand: changes.brand ?? '',
      model: changes.model ?? '',
      year:  changes.year  ?? 0,
      color: changes.color ?? '',
    })
    return this.toVehicle(res)
  }

  async deleteVehicle(id: string): Promise<void> {
    await this.call('DeleteVehicle', { id })
  }

  // ── Mappers ────────────────────────────────────────────────────────────────────

  private toDriver(r: any): Driver {
    return new Driver(
      r.id, r.name, r.email, r.phone, r.password,
      r.rating, r.is_active,
      new Date(r.created_at || Date.now()),
      new Date(r.updated_at || Date.now()),
    )
  }

  private toVehicle(r: any): Vehicle {
    return new Vehicle(
      r.id, r.driver_id, r.plate, r.brand, r.model, r.year, r.color,
      new Date(r.created_at || Date.now()),
      new Date(r.updated_at || Date.now()),
    )
  }
}
