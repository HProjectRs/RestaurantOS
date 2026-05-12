// Spike Test — sudden traffic burst
// 5 users baseline, then jump to 150 instantly, hold 1 minute, drop back

import { sleep } from 'k6'
import { BASE_URL, login, simulateOrderFlow } from './helpers.js'

export const options = {
  stages: [
    { duration: '2m', target: 5 },     // Normal baseline
    { duration: '10s', target: 150 },  // Instant spike
    { duration: '1m', target: 150 },   // Hold spike
    { duration: '30s', target: 5 },    // Drop back to baseline
    { duration: '1m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95% under 3s
    http_req_failed: ['rate<0.10'],    // Less than 10% errors
  },
}

export default function () {
  const token = login()

  if (token) {
    simulateOrderFlow(token)
  }

  // Minimal sleep for spike test
  sleep(0.5)
}
