// Average Load Test — simulates normal daily traffic
// Ramps up to 50 concurrent users over 2 minutes
// Holds 50 users for 5 minutes
// Ramps down over 1 minute

import { check, sleep, group } from 'k6'
import http from 'k6/http'
import { BASE_URL, getHeaders, login, simulateOrderFlow } from './helpers.js'

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'], // 95% under 1s, 99% under 2s
    http_req_failed: ['rate<0.05'],                   // Less than 5% error rate
  },
}

export default function () {
  group('Customer Flow', () => {
    // Log in
    const token = login()

    if (!token) {
      console.warn(`VU ${__VU}: Login failed, skipping flow`)
      sleep(1)
      return
    }

    // Simulate a customer ordering flow
    const result = simulateOrderFlow(token)

    // Add a small random think time (1-3 seconds between actions)
    sleep(Math.random() * 2 + 1)
  })
}
