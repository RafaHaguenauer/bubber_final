/**
 * Bubber — Teste de Carga com k6
 *
 * Instalar k6: https://k6.io/docs/get-started/installation/
 * Executar:
 *   k6 run load-tests/k6-load-test.js                      (Kong :8000 — padrão)
 *   k6 run --env BASE_URL=http://localhost:4000 load-tests/k6-load-test.js  (direto no BFF)
 *
 * O TOKEN abaixo é gerado com: node gateway/generate-token.js
 * Troque-o antes de executar.
 */

import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Counter, Rate, Trend } from 'k6/metrics'

// ── Métricas customizadas ────────────────────────────────────────────────────
const cacheHits   = new Counter('cache_hits')
const cacheMisses = new Counter('cache_misses')
const errorRate   = new Rate('error_rate')
const queryP99    = new Trend('query_p99_ms', true)

// ── Configuração do teste ─────────────────────────────────────────────────────
export const options = {
  /**
   * Estágios progressivos:
   *   Rampa:      0 → 200 VUs em 30s  (warm-up + warm Redis cache)
   *   Sustentado: 200 → 500 VUs em 1m (carga real)
   *   Pico:       500 → 1000 VUs em 30s (stress)
   *   Cool-down:  1000 → 0 VUs em 30s
   *
   * Com VUs multiplicados pelo paralelismo interno (2 requests/iter),
   * o throughput alvo é: 1000 VUs × ~12 iter/s = ~12.000 req/s.
   */
  stages: [
    { duration: '30s', target: 200  },   // warm-up
    { duration: '60s', target: 500  },   // carga normal
    { duration: '30s', target: 1000 },   // pico
    { duration: '30s', target: 0    },   // cool-down
  ],
  thresholds: {
    // 95% das requisições devem ser respondidas em <200ms
    http_req_duration: ['p(95)<200', 'p(99)<500'],
    // Taxa de erros abaixo de 1%
    http_req_failed:   ['rate<0.01'],
    error_rate:        ['rate<0.01'],
  },
}

// ── Configuração de ambiente ──────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000/graphql'

// Substitua pelo JWT gerado com: node gateway/generate-token.js
const JWT_TOKEN = __ENV.JWT_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJidWJiZXItaXNzdWVyIiwic3ViIjoiYnViYmVyLWZyb250ZW5kIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjk5OTk5OTk5OTl9.placeholder'

const HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${JWT_TOKEN}`,
}

// ── Queries GraphQL ───────────────────────────────────────────────────────────
const QUERY_USERS = JSON.stringify({
  query: `{ users { id name email createdAt } }`,
})

const QUERY_DRIVERS = JSON.stringify({
  query: `{ drivers { id name email rating isActive } }`,
})

const QUERY_RIDES = JSON.stringify({
  query: `{ rides { id status originAddress destAddress price } }`,
})

// ── Função principal (executada por cada VU em loop) ─────────────────────────
export default function () {
  group('queries_cached', () => {
    // Query 1 — usuários (5 min TTL no Redis)
    const t0 = Date.now()
    const res1 = http.post(BASE_URL, QUERY_USERS, { headers: HEADERS, timeout: '10s' })
    const dur1 = Date.now() - t0
    queryP99.add(dur1)

    const ok1 = check(res1, {
      'users: status 200':   (r) => r.status === 200,
      'users: sem erros GQL': (r) => {
        try { return !JSON.parse(r.body).errors } catch { return false }
      },
    })

    if (res1.headers['X-Cache'] === 'HIT') cacheHits.add(1)
    else cacheMisses.add(1)

    errorRate.add(!ok1)

    // Query 2 — motoristas (5 min TTL, lidos de driver_replicas — CQRS read model)
    const t1 = Date.now()
    const res2 = http.post(BASE_URL, QUERY_DRIVERS, { headers: HEADERS, timeout: '10s' })
    const dur2 = Date.now() - t1
    queryP99.add(dur2)

    const ok2 = check(res2, {
      'drivers: status 200':    (r) => r.status === 200,
      'drivers: sem erros GQL': (r) => {
        try { return !JSON.parse(r.body).errors } catch { return false }
      },
    })
    errorRate.add(!ok2)
  })

  // Sem sleep — máxima pressão para medir throughput real
}

// ── Cenário de leitura por ID com cache quente ────────────────────────────────
// Adicione IDs reais de corridas completadas no array abaixo para testar o cache de estado terminal.
const RIDE_IDS = [
  // 'uuid-da-corrida-completada-1',
  // 'uuid-da-corrida-completada-2',
]

export function cacheHitScenario() {
  if (RIDE_IDS.length === 0) return

  const id = RIDE_IDS[Math.floor(Math.random() * RIDE_IDS.length)]
  const res = http.post(BASE_URL, JSON.stringify({
    query: `{ ride(id: "${id}") { id status price originAddress destAddress } }`,
  }), { headers: HEADERS, timeout: '5s' })

  check(res, {
    'ride by id: status 200': (r) => r.status === 200,
    'ride by id: <20ms (cache hit)': (r) => r.timings.duration < 20,
  })
}

/**
 * Resumo dos resultados esperados
 * ─────────────────────────────────────────────────────────────────────────────
 * Ambiente:   MacBook M2 / Ryzen 5 5600, 16 GB RAM, Docker local
 * Cenário:    1000 VUs, queries simples, Redis warm
 *
 * Métrica                     Resultado esperado
 * ──────────────────────────  ──────────────────
 * http_req_duration p(95)     < 50 ms  (Redis hit)
 * http_req_duration p(99)     < 200 ms
 * http_reqs/s (throughput)    > 10.000 req/s  ← SLA do professor
 * http_req_failed             < 0.1 %
 * cache_hits / total_reqs     > 90 %  (após warm-up)
 *
 * Por que o cache permite 10k+ req/s:
 *  - Redis serve em < 1ms (memória, single-threaded, pipeline)
 *  - Apollo parser + resolver: ~2–5 ms
 *  - Sem hit no Postgres para queries cacheadas
 *  - Kong add ~1ms de overhead de proxy
 *  - Total: ~5–10 ms/req → suporta 100–200 req/s por VU
 *  - 1000 VUs × 100 req/s = 100.000 req/s teórico (limitado por CPU/banda)
 */
