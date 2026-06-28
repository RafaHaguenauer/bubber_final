import { describe, it, expect, vi } from 'vitest'
import { CreateVehicleUseCase } from '../../../application/use-cases/vehicle/CreateVehicleUseCase'
import { makeMockDriverPort } from '../../helpers/mockRepositories'
import { Vehicle } from '../../../domain/entities/Vehicle'
import { DomainError } from '../../../shared/errors/DomainError'

const input = {
  driverId: 'driver-1',
  plate: 'ABC-1234',
  brand: 'Toyota',
  model: 'Corolla',
  year: 2022,
  color: 'Branco',
}

describe('CreateVehicleUseCase', () => {
  it('deve criar veículo com placa nova', async () => {
    const driverPort = makeMockDriverPort({
      createVehicle: vi.fn(async (v: Vehicle) => v),
    })
    const useCase = new CreateVehicleUseCase(driverPort)

    const result = await useCase.execute(input)

    expect(result).toBeInstanceOf(Vehicle)
    expect(result.plate).toBe('ABC-1234')
    expect(result.driverId).toBe('driver-1')
  })

  it('deve lançar DomainError se placa já cadastrada', async () => {
    const existingVehicle = Vehicle.create('v-1', 'driver-2', 'ABC-1234', 'Honda', 'Civic', 2020, 'Preto')
    const driverPort = makeMockDriverPort({
      getVehicleByPlate: vi.fn(async () => existingVehicle),
    })
    const useCase = new CreateVehicleUseCase(driverPort)

    await expect(useCase.execute(input)).rejects.toThrow(DomainError)
    await expect(useCase.execute(input)).rejects.toThrow('already registered')
    expect(driverPort.createVehicle).not.toHaveBeenCalled()
  })

  it('deve verificar placa antes de criar', async () => {
    const driverPort = makeMockDriverPort({
      createVehicle: vi.fn(async (v: Vehicle) => v),
    })
    const useCase = new CreateVehicleUseCase(driverPort)

    await useCase.execute(input)

    expect(driverPort.getVehicleByPlate).toHaveBeenCalledWith('ABC-1234')
  })
})
