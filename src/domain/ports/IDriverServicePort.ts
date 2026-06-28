import type { Driver } from '../entities/Driver'
import type { Vehicle } from '../entities/Vehicle'

export interface DriverInfo {
  id: string
  name: string
  lat: number
  lng: number
  isAvailable: boolean
}

export interface NearestDriverResult {
  found: boolean
  driver: DriverInfo | null
  distanceKm: number
}

export interface IDriverServicePort {
  // ── Hot-state (localização em tempo real) ────────────────────────────────────
  registerDriver(driverId: string, name: string): Promise<void>
  updateLocation(driverId: string, lat: number, lng: number): Promise<void>
  setAvailability(driverId: string, isAvailable: boolean): Promise<void>
  findNearestDriver(originLat: number, originLng: number, radiusKm: number): Promise<NearestDriverResult>

  // ── Driver CRUD ────────────────────────────────────────────────────────────
  createDriver(driver: Driver): Promise<Driver>
  getDriver(id: string): Promise<Driver | null>
  getDriverByEmail(email: string): Promise<Driver | null>
  listDrivers(): Promise<Driver[]>
  updateDriver(id: string, changes: { name?: string; email?: string; phone?: string; rating?: number; isActive?: boolean }): Promise<Driver>
  deleteDriver(id: string): Promise<void>

  // ── Vehicle CRUD ───────────────────────────────────────────────────────────
  createVehicle(vehicle: Vehicle): Promise<Vehicle>
  getVehicle(id: string): Promise<Vehicle | null>
  getVehicleByPlate(plate: string): Promise<Vehicle | null>
  listVehiclesByDriver(driverId: string): Promise<Vehicle[]>
  updateVehicle(id: string, changes: { plate?: string; brand?: string; model?: string; year?: number; color?: string }): Promise<Vehicle>
  deleteVehicle(id: string): Promise<void>
}
