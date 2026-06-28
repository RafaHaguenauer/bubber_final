import { describe, it, expect } from 'vitest'
import { Ride, RideStatus } from '../../../domain/entities/Ride'
import { Coordinates } from '../../../domain/value-objects/Coordinates'
import { Money } from '../../../domain/value-objects/Money'
import { DomainError } from '../../../shared/errors/DomainError'

const makeRide = (overrides?: Partial<{ driverId: string; status: RideStatus }>) =>
  new Ride(
    'ride-1',
    'user-1',
    overrides?.driverId ?? null,
    overrides?.status ?? RideStatus.PENDING,
    new Coordinates(-22.91, -43.17),
    'Origem',
    new Coordinates(-22.95, -43.21),
    'Destino',
    null,
    null,
    null,
    new Date(),
    new Date(),
  )

describe('Ride (Aggregate Root)', () => {
  describe('Ride.create()', () => {
    it('deve criar corrida com status PENDING', () => {
      const ride = Ride.create(
        'id-1',
        'user-1',
        null,
        new Coordinates(-22.9, -43.1),
        'Origem',
        new Coordinates(-22.95, -43.2),
        'Destino',
      )
      expect(ride.status).toBe(RideStatus.PENDING)
      expect(ride.driverId).toBeNull()
      expect(ride.price).toBeNull()
    })

    it('deve criar corrida com preço definido', () => {
      const ride = Ride.create(
        'id-1',
        'user-1',
        'driver-1',
        new Coordinates(-22.9, -43.1),
        'Origem',
        new Coordinates(-22.95, -43.2),
        'Destino',
        new Money(23),
      )
      expect(ride.price?.amount).toBe(23)
      expect(ride.driverId).toBe('driver-1')
    })
  })

  describe('accept() — máquina de estados', () => {
    it('deve aceitar corrida PENDING e mudar para ACCEPTED', () => {
      const ride = makeRide()
      ride.accept('driver-1')
      expect(ride.status).toBe(RideStatus.ACCEPTED)
      expect(ride.driverId).toBe('driver-1')
    })

    it('deve rejeitar accept() em corrida que não está PENDING', () => {
      const ride = makeRide({ status: RideStatus.ACCEPTED })
      expect(() => ride.accept('driver-2')).toThrow(DomainError)
      expect(() => ride.accept('driver-2')).toThrow('PENDING')
    })
  })

  describe('start() — máquina de estados', () => {
    it('deve iniciar corrida ACCEPTED e mudar para IN_PROGRESS', () => {
      const ride = makeRide({ status: RideStatus.ACCEPTED })
      ride.start()
      expect(ride.status).toBe(RideStatus.IN_PROGRESS)
      expect(ride.startedAt).toBeInstanceOf(Date)
    })

    it('deve rejeitar start() em corrida PENDING', () => {
      const ride = makeRide()
      expect(() => ride.start()).toThrow(DomainError)
    })
  })

  describe('complete() — máquina de estados', () => {
    it('deve completar corrida IN_PROGRESS com preço final', () => {
      const ride = makeRide({ status: RideStatus.IN_PROGRESS })
      const finalPrice = new Money(42.50)
      ride.complete(finalPrice)
      expect(ride.status).toBe(RideStatus.COMPLETED)
      expect(ride.price?.amount).toBe(42.50)
      expect(ride.finishedAt).toBeInstanceOf(Date)
    })

    it('deve rejeitar complete() em corrida ACCEPTED', () => {
      const ride = makeRide({ status: RideStatus.ACCEPTED })
      expect(() => ride.complete(new Money(10))).toThrow(DomainError)
    })
  })

  describe('cancel() — máquina de estados', () => {
    it('deve cancelar corrida PENDING', () => {
      const ride = makeRide()
      ride.cancel()
      expect(ride.status).toBe(RideStatus.CANCELLED)
    })

    it('deve cancelar corrida ACCEPTED', () => {
      const ride = makeRide({ status: RideStatus.ACCEPTED })
      ride.cancel()
      expect(ride.status).toBe(RideStatus.CANCELLED)
    })

    it('deve rejeitar cancel() em corrida COMPLETED', () => {
      const ride = makeRide({ status: RideStatus.COMPLETED })
      expect(() => ride.cancel()).toThrow(DomainError)
      expect(() => ride.cancel()).toThrow('COMPLETED')
    })
  })

  describe('getters de conveniência (mapeamento para GraphQL)', () => {
    it('deve expor originLat e originLng', () => {
      const ride = makeRide()
      expect(ride.originLat).toBe(-22.91)
      expect(ride.originLng).toBe(-43.17)
    })

    it('deve expor destLat e destLng', () => {
      const ride = makeRide()
      expect(ride.destLat).toBe(-22.95)
      expect(ride.destLng).toBe(-43.21)
    })
  })
})
