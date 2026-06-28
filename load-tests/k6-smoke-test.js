/**
 * Smoke test — verificação rápida antes do teste de carga completo.
 * Executa 1 VU por 30s e valida que todas as queries funcionam.
 *
 * k6 run load-tests/k6-smoke-test.js
 */

import http from 'k6/http'
import { check } from 'k6'

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(100)<2000'],
    http_req_failed:   ['rate=0'],
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000'
const HEADERS  = { 'Content-Type': 'application/json' }

const QUERIES = [
  { name: 'users',   body: JSON.stringify({ query: '{ users { id name } }' }) },
  { name: 'drivers', body: JSON.stringify({ query: '{ drivers { id name rating } }' }) },
  { name: 'rides',   body: JSON.stringify({ query: '{ rides { id status } }' }) },
]

export default function () {
  for (const q of QUERIES) {
    const res = http.post(BASE_URL, q.body, { headers: HEADERS, timeout: '5s' })
    check(res, {
      [`${q.name}: 200`]:          (r) => r.status === 200,
      [`${q.name}: sem erros GQL`]: (r) => {
        try { return !JSON.parse(r.body).errors } catch { return false }
      },
    })
  }
}
