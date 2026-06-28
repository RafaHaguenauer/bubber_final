import * as container from '../../../composition-root/container'

export const smartRideResolvers = {
  Mutation: {
    registerDriverInService: (_: unknown, { driverId }: { driverId: string }) =>
      container.registerDriverInService.execute(driverId),

    updateDriverLocation: (
      _: unknown,
      { driverId, lat, lng }: { driverId: string; lat: number; lng: number },
    ) => container.updateDriverLocation.execute(driverId, lat, lng),

    setDriverAvailability: (
      _: unknown,
      { driverId, isAvailable }: { driverId: string; isAvailable: boolean },
    ) => container.setDriverAvailability.execute(driverId, isAvailable),

    requestRide: (_: unknown, args: any) =>
      container.requestRide.execute(args),
  },
}
