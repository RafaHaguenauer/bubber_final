import type { IVehicleRepository, VehicleRecord } from '../repositories/IDriverRepository'

// SRP: regras de negócio exclusivas do domínio de veículos
// DIP: depende de IVehicleRepository (abstração)
export class VehicleService {
  constructor(private readonly vehicleRepo: IVehicleRepository) {}

  async createVehicle(vehicle: VehicleRecord): Promise<VehicleRecord> {
    const existing = await this.vehicleRepo.findByPlate(vehicle.plate)
    if (existing) throw new Error(`Placa "${vehicle.plate}" já cadastrada`)
    return this.vehicleRepo.create(vehicle)
  }

  async getVehicle(id: string): Promise<VehicleRecord | null> {
    return this.vehicleRepo.findById(id)
  }

  async getVehicleByPlate(plate: string): Promise<VehicleRecord | null> {
    return this.vehicleRepo.findByPlate(plate)
  }

  async listByDriver(driverId: string): Promise<VehicleRecord[]> {
    return this.vehicleRepo.findByDriverId(driverId)
  }

  async updateVehicle(id: string, data: Partial<VehicleRecord>): Promise<VehicleRecord> {
    const existing = await this.vehicleRepo.findById(id)
    if (!existing) throw new Error(`Veículo ${id} não encontrado`)
    return this.vehicleRepo.update(id, data)
  }

  async deleteVehicle(id: string): Promise<void> {
    const existing = await this.vehicleRepo.findById(id)
    if (!existing) throw new Error(`Veículo ${id} não encontrado`)
    return this.vehicleRepo.delete(id)
  }
}
