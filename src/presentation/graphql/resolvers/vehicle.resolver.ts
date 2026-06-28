import * as container from '../../../composition-root/container'
import type { Vehicle } from '../../../domain/entities/Vehicle'

export const vehicleResolvers = {
  Query: {
    vehicle: (_: unknown, { id }: { id: string }) =>
      container.getVehicle.execute(id),
    vehicles: () =>
      container.listVehicles.execute(),
    vehiclesByDriver: (_: unknown, { driverId }: { driverId: string }) =>
      container.listVehicles.execute({ driverId }),
  },
  Mutation: {
    createVehicle: (_: unknown, { input }: { input: any }) =>
      container.createVehicle.execute(input),
    updateVehicle: (_: unknown, { id, input }: { id: string; input: any }) =>
      container.updateVehicle.execute({ id, ...input }),
    deleteVehicle: (_: unknown, { id }: { id: string }) =>
      container.deleteVehicle.execute(id),
  },
  Vehicle: {
    driver: (parent: Vehicle) =>
      container.getDriver.execute(parent.driverId),
  },
}
