import { DateTimeScalar } from '../scalars/DateTime'
import { userResolvers } from './user.resolver'
import { driverResolvers } from './driver.resolver'
import { vehicleResolvers } from './vehicle.resolver'
import { rideResolvers } from './ride.resolver'
import { paymentResolvers } from './payment.resolver'
import { smartRideResolvers } from './smart-ride.resolver'

export const resolvers = {
  DateTime: DateTimeScalar,
  Query: {
    ...userResolvers.Query,
    ...driverResolvers.Query,    // driver, drivers, activeDrivers
    ...vehicleResolvers.Query,   // vehicle, vehicles, vehiclesByDriver
    ...rideResolvers.Query,      // ride, rides, ridesByUser, ridesByDriver
    ...paymentResolvers.Query,   // payment, payments, paymentByRide
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...driverResolvers.Mutation,
    ...vehicleResolvers.Mutation,
    ...rideResolvers.Mutation,
    ...paymentResolvers.Mutation,
    ...smartRideResolvers.Mutation,
  },
  User: userResolvers.User,
  Driver: driverResolvers.Driver,
  Vehicle: vehicleResolvers.Vehicle,
  Ride: rideResolvers.Ride,
  Payment: paymentResolvers.Payment,
}
