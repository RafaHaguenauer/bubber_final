export const typeDefs = `#graphql
  scalar DateTime

  # ─── Enums ───────────────────────────────────────────────────────────────────

  enum RideStatus {
    PENDING
    ACCEPTED
    IN_PROGRESS
    COMPLETED
    CANCELLED
  }

  enum PaymentMethod {
    CREDIT_CARD
    DEBIT_CARD
    CASH
    PIX
  }

  enum PaymentStatus {
    PENDING
    COMPLETED
    FAILED
    REFUNDED
  }

  # ─── Types ───────────────────────────────────────────────────────────────────

  type User {
    id: ID!
    name: String!
    email: String!
    phone: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    rides: [Ride!]!
  }

  type Driver {
    id: ID!
    name: String!
    email: String!
    phone: String!
    rating: Float!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    vehicles: [Vehicle!]!
    rides: [Ride!]!
  }

  type Vehicle {
    id: ID!
    plate: String!
    brand: String!
    model: String!
    year: Int!
    color: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    driver: Driver!
  }

  type Ride {
    id: ID!
    status: RideStatus!
    originLat: Float!
    originLng: Float!
    originAddress: String!
    destLat: Float!
    destLng: Float!
    destAddress: String!
    price: Float
    startedAt: DateTime
    finishedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
    user: User!
    driver: Driver
    payment: Payment
  }

  type Payment {
    id: ID!
    amount: Float!
    method: PaymentMethod!
    status: PaymentStatus!
    createdAt: DateTime!
    updatedAt: DateTime!
    ride: Ride!
  }

  # ─── Inputs ──────────────────────────────────────────────────────────────────

  input CreateUserInput {
    name: String!
    email: String!
    phone: String!
    password: String!
  }

  input UpdateUserInput {
    name: String
    email: String
    phone: String
  }

  input CreateDriverInput {
    name: String!
    email: String!
    phone: String!
    password: String!
  }

  input UpdateDriverInput {
    name: String
    email: String
    phone: String
    rating: Float
    isActive: Boolean
  }

  input CreateVehicleInput {
    driverId: ID!
    plate: String!
    brand: String!
    model: String!
    year: Int!
    color: String!
  }

  input UpdateVehicleInput {
    plate: String
    brand: String
    model: String
    year: Int
    color: String
  }

  input CreateRideInput {
    userId: ID!
    originLat: Float!
    originLng: Float!
    originAddress: String!
    destLat: Float!
    destLng: Float!
    destAddress: String!
  }

  input UpdateRideInput {
    driverId: ID
    status: RideStatus
    price: Float
  }

  input CreatePaymentInput {
    rideId: ID!
    amount: Float!
    method: PaymentMethod!
  }

  input UpdatePaymentInput {
    status: PaymentStatus
    method: PaymentMethod
    amount: Float
  }

  # ─── Queries ─────────────────────────────────────────────────────────────────

  type Query {
    user(id: ID!): User
    users: [User!]!

    driver(id: ID!): Driver
    drivers: [Driver!]!
    activeDrivers: [Driver!]!

    vehicle(id: ID!): Vehicle
    vehicles: [Vehicle!]!
    vehiclesByDriver(driverId: ID!): [Vehicle!]!

    ride(id: ID!): Ride
    rides: [Ride!]!
    ridesByUser(userId: ID!): [Ride!]!
    ridesByDriver(driverId: ID!): [Ride!]!

    payment(id: ID!): Payment
    payments: [Payment!]!
    paymentByRide(rideId: ID!): Payment
  }

  # ─── Smart Ride Types ────────────────────────────────────────────────────────

  type RouteInfo {
    distanceKm: Float!
    durationMinutes: Float!
    polyline: String!
  }

  type RideRequestResult {
    ride: Ride!
    driverToOriginRoute: RouteInfo!
    fullRoute: RouteInfo!
  }

  # ─── Mutations ───────────────────────────────────────────────────────────────

  type Mutation {
    requestRide(
      userId: ID!
      originLat: Float!
      originLng: Float!
      originAddress: String!
      destLat: Float!
      destLng: Float!
      destAddress: String!
      radiusKm: Float
    ): RideRequestResult!

    registerDriverInService(driverId: ID!): Boolean!
    updateDriverLocation(driverId: ID!, lat: Float!, lng: Float!): Boolean!
    setDriverAvailability(driverId: ID!, isAvailable: Boolean!): Boolean!

    createUser(input: CreateUserInput!): User!
    updateUser(id: ID!, input: UpdateUserInput!): User!
    deleteUser(id: ID!): Boolean!

    createDriver(input: CreateDriverInput!): Driver!
    updateDriver(id: ID!, input: UpdateDriverInput!): Driver!
    deleteDriver(id: ID!): Boolean!

    createVehicle(input: CreateVehicleInput!): Vehicle!
    updateVehicle(id: ID!, input: UpdateVehicleInput!): Vehicle!
    deleteVehicle(id: ID!): Boolean!

    createRide(input: CreateRideInput!): Ride!
    updateRide(id: ID!, input: UpdateRideInput!): Ride!
    deleteRide(id: ID!): Boolean!
    completeRide(id: ID!): Ride!
    cancelRide(id: ID!, reason: String): Ride!

    createPayment(input: CreatePaymentInput!): Payment!
    updatePayment(id: ID!, input: UpdatePaymentInput!): Payment!
    deletePayment(id: ID!): Boolean!
  }
`
