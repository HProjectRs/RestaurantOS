// Stress Test — finds the breaking point of the API
// Gradually ramps up to 200 users over 10 minutes
// Holds for 5 minutes, then ramps down

import { sleep } from 'k6'
import { BASE_URL, login, simulateOrderFlow } from './helpers.js'

export const options = {
  stages: [
    { duration: '10m', target: 200 },  // Ramp up to 200 users
    { duration: '5m', target: 200 },   // Stay at 200 users
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // 95% under 5s (relaxed for stress)
    http_req_failed: ['rate<0.20'],    // Allow up to 20% errors under stress
  },
}

export default function () {
  const token = login()

  if (token) {
    simulateOrderFlow(token)
  }

  // Random sleep between iterations (200-500ms)
  sleep(Math.random() * 0.3 + 0.2)
}
