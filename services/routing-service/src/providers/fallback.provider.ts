import type { IRoutingProvider, RouteResult } from './IRoutingProvider'

// Decorator/Composite: tenta o provider primário, cai no fallback se falhar
// OCP em ação: adicionar novos providers não requer modificar esta classe
export class FallbackRoutingProvider implements IRoutingProvider {
  constructor(
    private readonly primary: IRoutingProvider,
    private readonly fallback: IRoutingProvider,
  ) {}

  async calculateRoute(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
  ): Promise<RouteResult> {
    try {
      return await this.primary.calculateRoute(originLat, originLng, destLat, destLng)
    } catch (err) {
      console.warn('[routing] Provider primário falhou, usando fallback:', (err as Error).message)
      return this.fallback.calculateRoute(originLat, originLng, destLat, destLng)
    }
  }
}
