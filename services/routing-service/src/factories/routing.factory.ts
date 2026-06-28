import type { IRoutingProvider } from '../providers/IRoutingProvider'
import { OsrmRoutingProvider } from '../providers/osrm.provider'
import { HaversineRoutingProvider } from '../providers/haversine.provider'
import { FallbackRoutingProvider } from '../providers/fallback.provider'

// Factory: encapsula a lógica de criação do provider correto
// O handler nunca precisa saber qual implementação está sendo usada
export class RoutingProviderFactory {
  static create(): IRoutingProvider {
    const osrmUrl = process.env.OSRM_URL

    if (osrmUrl) {
      console.log('[routing-factory] OSRM configurado — usando OSRM com fallback haversine')
      return new FallbackRoutingProvider(
        new OsrmRoutingProvider(osrmUrl),
        new HaversineRoutingProvider(),
      )
    }

    console.log('[routing-factory] OSRM não configurado — usando haversine')
    return new HaversineRoutingProvider()
  }
}
