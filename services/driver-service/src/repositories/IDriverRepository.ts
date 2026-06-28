// ── DriverLocation: estado quente (hot-state) ──────────────────────────────────
export interface DriverLocation {
  id: string
  name: string
  lat: number
  lng: number
  isAvailable: boolean
  updatedAt: Date
}

// ── DriverFull: perfil completo ────────────────────────────────────────────────
export interface DriverFull {
  id: string
  name: string
  email: string
  phone: string
  password: string
  rating: number
  isActive: boolean
  lat: number
  lng: number
  isAvailable: boolean
  createdAt: Date
  updatedAt: Date
}

// ── VehicleRecord ─────────────────────────────────────────────────────────────
export interface VehicleRecord {
  id: string
  driverId: string
  plate: string
  brand: string
  model: string
  year: number
  color: string
  createdAt: Date
  updatedAt: Date
}

// ── ISP: interfaces segregadas ────────────────────────────────────────────────

export interface IDriverReader {
  findById(id: string): Promise<DriverLocation | null>
  findFullById(id: string): Promise<DriverFull | null>
  findByEmail(email: string): Promise<DriverFull | null>
  findAll(): Promise<DriverFull[]>
  listAvailable(): Promise<DriverLocation[]>
  findNearby(lat: number, lng: number, radiusKm: number): Promise<Array<DriverLocation & { distanceKm: number }>>
}

export interface IDriverWriter {
  save(driver: DriverLocation): Promise<void>
  create(driver: DriverFull): Promise<DriverFull>
  update(id: string, data: Partial<DriverFull>): Promise<DriverFull>
  updateLocation(id: string, lat: number, lng: number): Promise<boolean>
  setAvailability(id: string, isAvailable: boolean): Promise<boolean>
  delete(id: string): Promise<void>
}

export type IDriverRepository = IDriverReader & IDriverWriter

// ── IVehicleRepository ────────────────────────────────────────────────────────

export interface IVehicleRepository {
  findById(id: string): Promise<VehicleRecord | null>
  findByPlate(plate: string): Promise<VehicleRecord | null>
  findByDriverId(driverId: string): Promise<VehicleRecord[]>
  create(vehicle: VehicleRecord): Promise<VehicleRecord>
  update(id: string, data: Partial<VehicleRecord>): Promise<VehicleRecord>
  delete(id: string): Promise<void>
}
