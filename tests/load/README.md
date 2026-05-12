# Load Testing with k6

This directory contains load testing scripts for RestaurantOS using [k6](https://k6.io).

## Installation

### Windows (Chocolatey)
```bash
choco install k6
```

### Windows (Direct download)
Download from https://k6.io/docs/getting-started/installation/

### macOS (Homebrew)
```bash
brew install k6
```

### Linux (Debian/Ubuntu)
```bash
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

## Test Scripts

| Script | Type | Description |
|--------|------|-------------|
| `smoke-test.js` | Smoke | 1 user, 30s — basic sanity check |
| `average-load.js` | Load | 50 users, 8min — normal traffic simulation |
| `stress-test.js` | Stress | 200 users, 17min — find breaking point |
| `spike-test.js` | Spike | 150 user instant burst — sudden traffic |

## Running Tests

### Against Local Development Server

```bash
# Start the server first
cd server && npm run dev

# In another terminal, run a test
k6 run tests/load/smoke-test.js
k6 run tests/load/average-load.js
```

### Against Production/Staging

```bash
# Set the BASE_URL environment variable
k6 run -e BASE_URL=https://your-app.railway.app tests/load/smoke-test.js

# Or use the npm scripts
npm run test:smoke
npm run test:load
npm run test:stress
```

## Interpreting Results

k6 outputs key metrics after each test run:

| Metric | What it means |
|--------|--------------|
| `http_req_duration` | Total request time (sending + waiting + receiving) |
| `p(95)` | 95% of requests completed under this time |
| `p(99)` | 99% of requests completed under this time |
| `http_req_failed` | Percentage of failed requests |
| `http_reqs` | Total requests made |
| `iterations` | Number of script iterations completed |
| `vus` | Virtual users at peak |
| `data_received` | Total data received |

### Good Results (Healthy API)

```
http_req_duration......: avg=45ms    p(95)=120ms   p(99)=350ms
http_req_failed........: 0.00%   ✓ 0    ✗ 1500
```

### Warning Signs

- `p(95)` consistently > 1000ms → API may need optimization
- Error rate > 5% → investigate server logs
- Requests failing to connect → check server capacity/rate limiting

## ⚠️ Important Warning

**Never run stress or spike tests against production without:**
1. Notifying the team and stakeholders
2. Scheduling during low-traffic periods
3. Monitoring server metrics (CPU, memory, DB connections)
4. Having a rollback plan

The spike test (`spike-test.js`) is particularly aggressive — use it on staging/CI environments only.
