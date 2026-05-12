// k6 load test helpers for RestaurantOS
// Shared functions used across all test scripts

import { check } from 'k6'
import http from 'k6/http'

// Base URL — set via environment variable, default to local dev
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001'

// Standard headers
export const getHeaders = (token) => ({
  'Content-Type': 'application/json',
  'Authorization': token ? `Bearer ${token}` : '',
})

// Cache for auth tokens
let cachedToken = null
let tokenExpiry = 0

// Login and cache the access token
export function login(email = 'admin@cafe.com', password = 'admin123') {
  const now = Date.now()

  // Return cached token if still valid (within 5 minutes)
  if (cachedToken && tokenExpiry > now) {
    return cachedToken
  }

  const res = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email,
    password,
  }), { headers: getHeaders() })

  check(res, {
    'login successful': (r) => r.status === 200,
    'login has access token': (r) => r.json('accessToken') !== undefined,
  })

  if (res.status === 200) {
    cachedToken = res.json('accessToken')
    tokenExpiry = now + 4 * 60 * 1000 // Cache for 4 minutes
    return cachedToken
  }

  return null
}

// Pick a random item from an array
export function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Random menu item ID (mocked for load tests — real IDs would come from API)
export const menuItemIds = [
  'item-1', 'item-2', 'item-3', 'item-4', 'item-5',
  'item-6', 'item-7', 'item-8', 'item-9', 'item-10',
]

// Generate a random order payload
export function randomOrderPayload() {
  const numItems = Math.floor(Math.random() * 3) + 1
  const items = []

  for (let i = 0; i < numItems; i++) {
    items.push({
      menuItemId: randomItem(menuItemIds),
      quantity: Math.floor(Math.random() * 3) + 1,
      modifiers: [],
    })
  }

  return {
    items,
    type: randomItem(['dine-in', 'takeaway', 'delivery']),
    customerName: 'Load Test User',
    customerPhone: '+966500000000',
    notes: `Load test order — ${__VU}`,
  }
}

// Simulate a full customer + staff flow
export function simulateOrderFlow(token) {
  const headers = getHeaders(token)

  // 1. Browse menu
  const menuRes = http.get(`${BASE_URL}/api/menu`, { headers })
  check(menuRes, { 'GET /api/menu status 200': (r) => r.status === 200 })

  // 2. Create an order
  const orderPayload = randomOrderPayload()
  const orderRes = http.post(`${BASE_URL}/api/orders`, JSON.stringify(orderPayload), { headers })
  check(orderRes, { 'POST /api/orders status 201': (r) => r.status === 201 })

  // Try to get the order ID if created
  let orderId = null
  if (orderRes.status === 201) {
    try {
      orderId = orderRes.json('id')
    } catch (e) {
      // Silently continue
    }
  }

  return { menuStatus: menuRes.status, orderStatus: orderRes.status, orderId }
}
