// Smoke Test — basic sanity check
// Runs with 1 virtual user for 30 seconds to verify the API is responding

import { check } from 'k6'
import http from 'k6/http'
import { BASE_URL, getHeaders, login } from './helpers.js'

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% error rate
  },
}

export default function () {
  // Test 1: Health check (no auth required)
  const healthRes = http.get(`${BASE_URL}/api/health`)
  check(healthRes, {
    'GET /api/health status 200': (r) => r.status === 200,
    'GET /api/health has status OK': (r) => r.json('status') === 'OK',
  })

  // Test 2: Login
  const token = login()

  if (token) {
    // Test 3: Browse menu (authenticated)
    const menuRes = http.get(`${BASE_URL}/api/menu`, { headers: getHeaders(token) })
    check(menuRes, {
      'GET /api/menu status 200': (r) => r.status === 200,
      'GET /api/menu returns array': (r) => Array.isArray(r.json()),
    })
  }
}
