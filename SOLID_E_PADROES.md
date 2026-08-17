ALTEREI AQUI PRA GANHAR O SELO
TENTANTO DNV O YOLO 
# Refatoração com SOLID e Padrões de Projeto
## Sistema Bubber — Arquitetura de Software | CEFET/RJ — BSI
**Aluno:** Rafael Haguenauer  
**Disciplina:** Arquitetura de Software  
**Professor:** Diego Cardoso Borda Castro

---
TENTANDO PELO GIT WEB
## 1. Contexto do Sistema

O sistema **Bubber** é uma plataforma inspirada no Uber, composta por três componentes principais:

- **API GraphQL (BFF)** — interface com o cliente, porta 4000
- **Driver Service (gRPC)** — microsserviço de motoristas, porta 50051
- **Routing Service (gRPC)** — microsserviço de roteamento, porta 50052

A refatoração aplicou os cinco princípios SOLID e quatro padrões de projeto do GoF sobre as APIs GraphQL e gRPC existentes.

---

## 2. Princípios SOLID Aplicados

### 2.1 S — Single Responsibility Principle (SRP)
> *"Cada classe deve ter um único motivo para mudar."*

**Problema identificado:**  
O arquivo `driver.handler.ts` original acumulava três responsabilidades distintas: traduzir chamadas gRPC, executar lógica de negócio e acessar o repositório de dados diretamente.

**Solução aplicada:**  
As responsabilidades foram separadas em três camadas independentes:

| Classe | Responsabilidade única |
|---|---|
| `DriverHandler` | Traduzir chamadas gRPC para a camada de serviço |
| `DriverService` | Regras de negócio (encontrar motorista, validações) |
| `InMemoryDriverRepository` | Persistência e consulta dos dados de motoristas |

**Arquivo criado:** `services/driver-service/src/services/driver.service.ts`

```typescript
// Antes: handler misturava tudo
export const driverHandler = {
  async findNearestDriver(call, cb) {
    const nearby = driverStore.findNearby(...)  // acesso direto ao store
    const results = await Promise.all(nearby.map(d => calculateDistance(...)))
    // lógica de negócio misturada com gRPC
  }
}

// Depois: handler só traduz a chamada
export class DriverHandler {
  constructor(private readonly service: DriverService) {}

  async findNearestDriver(call, cb) {
    const result = await this.service.findNearestDriver(...)  // delega ao serviço
    cb(null, { found: result.found, driver: result.driver, distance_km: result.distanceKm })
  }
}
```

O mesmo princípio foi aplicado no BFF: a classe `RideOrchestrationFacade` concentra toda a lógica de orquestração de corrida, enquanto o resolver `smartRideResolvers` se limita a receber a requisição GraphQL e delegar.

---

### 2.2 O — Open/Closed Principle (OCP)
> *"Aberto para extensão, fechado para modificação."*

**Problema identificado:**  
O `routing.handler.ts` original usava um `try/catch` com lógica condicional para escolher entre OSRM e haversine. Adicionar um novo provedor (ex.: Google Maps, Valhalla) exigiria modificar o handler.

**Solução aplicada:**  
Foi criada a interface `IRoutingProvider` e implementações independentes. Para adicionar um novo provedor basta criar uma nova classe — o handler nunca precisa ser modificado.

**Arquivos criados:**
- `services/routing-service/src/providers/IRoutingProvider.ts`
- `services/routing-service/src/providers/osrm.provider.ts`
- `services/routing-service/src/providers/haversine.provider.ts`
- `services/routing-service/src/providers/fallback.provider.ts`

```typescript
// Interface estável — nunca muda
export interface IRoutingProvider {
  calculateRoute(originLat, originLng, destLat, destLng): Promise<RouteResult>
}

// Handler recebe a interface — nunca sabe qual implementação está usando
export class RoutingHandler {
  constructor(private readonly provider: IRoutingProvider) {}  // DIP aqui também

  async calculateRoute(call, cb) {
    const result = await this.provider.calculateRoute(...)  // comportamento extensível
    cb(null, { distance_km: result.distanceKm, ... })
  }
}

// Extensão sem modificação: basta criar nova classe
export class GoogleMapsProvider implements IRoutingProvider {
  async calculateRoute(...) { /* nova implementação */ }
}
```

---

### 2.3 L — Liskov Substitution Principle (LSP)
> *"Subtipos devem ser substituíveis por seus tipos base sem alterar o comportamento do programa."*

**Onde foi aplicado:**  
As três implementações de `IRoutingProvider` são completamente intercambiáveis. O `RoutingHandler` funciona identicamente independentemente de qual provider receber.

**Evidência:**

| Provider | Comportamento garantido |
|---|---|
| `OsrmRoutingProvider` | Retorna `RouteResult` via API HTTP do OSRM |
| `HaversineRoutingProvider` | Retorna `RouteResult` via cálculo matemático |
| `FallbackRoutingProvider` | Retorna `RouteResult` via OSRM ou haversine |

Todos respeitam o mesmo contrato de retorno (`RouteResult`). Nenhuma substituição quebra o `RoutingHandler`.

```typescript
// Qualquer dos três funciona aqui — LSP em ação
const handler = new RoutingHandler(new OsrmRoutingProvider(url))
const handler = new RoutingHandler(new HaversineRoutingProvider())
const handler = new RoutingHandler(new FallbackRoutingProvider(osrm, haversine))
```

O mesmo se aplica ao `IDriverRepository`: `InMemoryDriverRepository` pode ser substituído por `RedisDriverRepository` ou `PostgresDriverRepository` sem modificar o `DriverService`.

---

### 2.4 I — Interface Segregation Principle (ISP)
> *"Clientes não devem ser forçados a depender de interfaces que não utilizam."*

**Problema identificado:**  
O `driverStore` original era uma classe monolítica com métodos de leitura e escrita juntos. Qualquer componente que precisasse apenas consultar motoristas era forçado a depender dos métodos de escrita.

**Solução aplicada:**  
O repositório foi segregado em duas interfaces menores e coesas:

**Arquivo criado:** `services/driver-service/src/repositories/IDriverRepository.ts`

```typescript
// Interface para operações de leitura
export interface IDriverReader {
  findById(id: string): DriverLocation | undefined
  listAvailable(): DriverLocation[]
  findNearby(lat, lng, radiusKm): Array<DriverLocation & { distanceKm: number }>
}

// Interface para operações de escrita
export interface IDriverWriter {
  save(driver: DriverLocation): void
  updateLocation(id, lat, lng): boolean
  setAvailability(id, isAvailable): boolean
}

// Tipo composto para quem precisa de tudo
export type IDriverRepository = IDriverReader & IDriverWriter
```

Componentes que apenas consultam motoristas dependem somente de `IDriverReader`, sem serem expostos aos métodos de escrita que não precisam usar.

---

### 2.5 D — Dependency Inversion Principle (DIP)
> *"Módulos de alto nível não devem depender de módulos de baixo nível. Ambos devem depender de abstrações."*

**Onde foi aplicado em toda a arquitetura:**

**Routing Service:**
```
RoutingHandler  →  IRoutingProvider  ←  OsrmRoutingProvider
                                    ←  HaversineRoutingProvider
                                    ←  FallbackRoutingProvider
```

**Driver Service:**
```
DriverHandler  →  DriverService  →  IDriverRepository  ←  InMemoryDriverRepository
```

**GraphQL BFF:**
```
smartRideResolvers  →  IRideOrchestrator  ←  RideOrchestrationFacade
```

**Composition Root (server.ts de cada serviço):**  
A "montagem" das dependências concretas acontece apenas no ponto de entrada da aplicação, mantendo o restante do código desacoplado.

```typescript
// services/driver-service/src/server.ts — Composition Root
const repository = new InMemoryDriverRepository()   // concreto
const service    = new DriverService(repository, calculateDistance)  // recebe abstração
const handler    = new DriverHandler(service)       // recebe abstração
```

---

## 3. Padrões de Projeto Aplicados

### 3.1 Strategy Pattern
**Categoria:** Comportamental  
**Onde foi aplicado:** Sistema de provedores de roteamento

**Propósito:**  
Definir uma família de algoritmos de cálculo de rota, encapsular cada um e torná-los intercambiáveis. Permite variar o algoritmo independentemente dos clientes que o utilizam.

**Estrutura no sistema:**

```
IRoutingProvider (interface — Strategy)
    │
    ├── OsrmRoutingProvider     — algoritmo via API HTTP do OSRM
    ├── HaversineRoutingProvider — algoritmo matemático (linha reta)
    └── FallbackRoutingProvider  — composição: tenta OSRM, cai em haversine
```

**Arquivos:**
- `services/routing-service/src/providers/IRoutingProvider.ts`
- `services/routing-service/src/providers/osrm.provider.ts`
- `services/routing-service/src/providers/haversine.provider.ts`

**Benefício:**  
Trocar o algoritmo de roteamento (ex.: migrar de haversine para OSRM, ou para Google Maps) requer apenas passar uma implementação diferente ao `RoutingHandler` — sem alterar nenhuma linha do handler.

---

### 3.2 Factory Pattern
**Categoria:** Criacional  
**Onde foi aplicado:** Criação do provider de roteamento

**Propósito:**  
Centralizar e encapsular a lógica de criação de objetos. O `RoutingHandler` nunca sabe como o provider foi criado; apenas o usa.

**Arquivo:** `services/routing-service/src/factories/routing.factory.ts`

```typescript
export class RoutingProviderFactory {
  static create(): IRoutingProvider {
    const osrmUrl = process.env.OSRM_URL

    if (osrmUrl) {
      // Com OSRM: tenta OSRM real, fallback para haversine
      return new FallbackRoutingProvider(
        new OsrmRoutingProvider(osrmUrl),
        new HaversineRoutingProvider(),
      )
    }

    // Sem OSRM: usa haversine diretamente
    return new HaversineRoutingProvider()
  }
}
```

**Uso no server.ts:**
```typescript
// O servidor não sabe qual implementação foi criada
const provider = RoutingProviderFactory.create()
const handler  = new RoutingHandler(provider)
```

**Benefício:**  
A decisão de qual implementação usar (baseada em variável de ambiente) está centralizada em um único lugar. Adicionar suporte a um novo provedor requer alterar apenas a factory.

---

### 3.3 Repository Pattern
**Categoria:** Arquitetural  
**Onde foi aplicado:** Gerenciamento do estado dos motoristas no Driver Service

**Propósito:**  
Abstrair o mecanismo de persistência de dados. O `DriverService` não sabe se os dados estão em memória, Redis, PostgreSQL ou qualquer outra tecnologia.

**Arquivos:**
- `services/driver-service/src/repositories/IDriverRepository.ts`
- `services/driver-service/src/repositories/in-memory.driver.repository.ts`

```typescript
// DriverService depende da abstração
export class DriverService {
  constructor(private readonly repo: IDriverRepository) {}

  listAvailable(): DriverLocation[] {
    return this.repo.listAvailable()  // não sabe como os dados são armazenados
  }
}

// InMemoryDriverRepository é a implementação atual
export class InMemoryDriverRepository implements IDriverRepository {
  private readonly store = new Map<string, DriverLocation>()

  listAvailable(): DriverLocation[] {
    return Array.from(this.store.values()).filter(d => d.isAvailable)
  }
  // ...
}
```

**Migração futura sem alterar o DriverService:**
```typescript
// Basta criar nova implementação e trocar no composition root
class RedisDriverRepository implements IDriverRepository { ... }
const service = new DriverService(new RedisDriverRepository(), calculateDistance)
```

---

### 3.4 Facade Pattern
**Categoria:** Estrutural  
**Onde foi aplicado:** Orquestração de corrida no GraphQL BFF

**Propósito:**  
Fornecer uma interface simplificada para um conjunto complexo de operações. O resolver GraphQL não precisa conhecer os detalhes de como chamar dois serviços gRPC, estimar preço e persistir dados.

**Arquivos:**
- `src/facades/IRideOrchestrator.ts`
- `src/facades/ride.orchestration.facade.ts`

```typescript
// Complexidade escondida atrás de um único método
export class RideOrchestrationFacade implements IRideOrchestrator {
  async requestRide(params: RequestRideParams): Promise<RideResult> {
    // 1. Chama Driver Service via gRPC
    const nearestResult = await this.driverClient.findNearestDriver(...)

    // 2. Chama Routing Service via gRPC (duas rotas em paralelo)
    const [driverToOriginRoute, fullRoute] = await Promise.all([
      this.routingClient.calculateRoute(driverLat, driverLng, originLat, originLng),
      this.routingClient.calculateRoute(originLat, originLng, destLat, destLng),
    ])

    // 3. Calcula preço
    const price = 3 + fullRoute.distance_km * 2

    // 4. Persiste no banco
    const ride = await this.prisma.ride.create({ data: { ... } })

    // 5. Atualiza disponibilidade do motorista
    await this.driverClient.setAvailability(driver.id, false)

    return { ride, driverToOriginRoute, fullRoute }
  }
}

// Resolver vê apenas uma linha
export const smartRideResolvers = {
  Mutation: {
    requestRide: (_, args) => orchestrator.requestRide(args),  // Facade em ação
  }
}
```

**Benefício:**  
O resolver GraphQL permanece com 1 linha de lógica. A complexidade de orquestrar múltiplos serviços está encapsulada e testável de forma isolada.

---

### 3.5 Singleton Pattern (Bônus)
**Categoria:** Criacional  
**Onde foi aplicado:** `PrismaClient` no GraphQL BFF

**Propósito:**  
Garantir uma única instância do cliente de banco de dados por processo Node.js, evitando conexões desnecessárias.

**Arquivo:** `src/lib/prisma.ts`

```typescript
import { PrismaClient } from '@prisma/client'

// Em Node.js, módulos são cacheados pelo sistema de imports.
// Esta exportação é efetivamente um Singleton por processo.
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})
```

**Nota técnica:** Em Node.js, a abordagem de módulo singleton (como acima) é preferível à implementação clássica com `static getInstance()`, pois o próprio sistema de módulos garante uma única instância sem código adicional.

---

## 4. Resumo Visual

### Mapa SOLID × Código

| Princípio | Arquivo(s) principal(is) | Evidência |
|---|---|---|
| **S** — SRP | `driver.handler.ts`, `driver.service.ts`, `ride.orchestration.facade.ts` | Handler ≠ Service ≠ Repository |
| **O** — OCP | `IRoutingProvider.ts`, providers/ | Novo provider → nova classe, handler intocado |
| **L** — LSP | `osrm.provider.ts`, `haversine.provider.ts`, `fallback.provider.ts` | Intercambiáveis em `RoutingHandler` |
| **I** — ISP | `IDriverRepository.ts` | `IDriverReader` e `IDriverWriter` separados |
| **D** — DIP | `server.ts` (ambos os serviços), `smart-ride.resolvers.ts` | Dependências injetadas via construtor |

### Mapa Padrões × Código

| Padrão | Arquivo(s) | Propósito |
|---|---|---|
| **Strategy** | `providers/` | Algoritmos de rota intercambiáveis |
| **Factory** | `routing.factory.ts` | Criação do provider correto por configuração |
| **Repository** | `IDriverRepository.ts`, `in-memory.driver.repository.ts` | Abstração da persistência |
| **Facade** | `ride.orchestration.facade.ts` | Interface simples para orquestração complexa |
| **Singleton** | `lib/prisma.ts` | Única instância do PrismaClient |

---

## 5. Estrutura Final de Arquivos Relevantes

```
bubber/
├── services/
│   ├── driver-service/src/
│   │   ├── repositories/
│   │   │   ├── IDriverRepository.ts          ← ISP + DIP
│   │   │   └── in-memory.driver.repository.ts ← Repository Pattern
│   │   ├── services/
│   │   │   └── driver.service.ts             ← SRP + DIP
│   │   └── handlers/
│   │       └── driver.handler.ts             ← SRP (só traduz gRPC)
│   │
│   └── routing-service/src/
│       ├── providers/
│       │   ├── IRoutingProvider.ts           ← OCP + LSP + DIP
│       │   ├── osrm.provider.ts              ← Strategy
│       │   ├── haversine.provider.ts         ← Strategy
│       │   └── fallback.provider.ts          ← Composite/Decorator
│       ├── factories/
│       │   └── routing.factory.ts            ← Factory Pattern
│       └── handlers/
│           └── routing.handler.ts            ← SRP (só traduz gRPC)
│
└── src/ (GraphQL BFF)
    ├── facades/
    │   ├── IRideOrchestrator.ts              ← DIP (abstração)
    │   └── ride.orchestration.facade.ts      ← Facade Pattern + SRP
    ├── resolvers/
    │   └── smart-ride.resolvers.ts           ← thin, delega ao Facade
    └── lib/
        └── prisma.ts                         ← Singleton Pattern
```
