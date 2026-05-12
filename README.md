# RestaurantOS — نظام إدارة المطاعم والمقاهي

> A full-featured restaurant and café management system with bilingual (AR/EN) interface, built for production deployment.

---

## Features

| Module | Description |
|--------|-------------|
| **Customer Homepage** | Restaurant landing page with menu browsing, ordering, WiFi connect |
| **POS System** | In-store, takeaway, and delivery order management |
| **Kitchen Display** | Real-time order tickets with sound notifications |
| **Menu Management** | Categories, items, modifiers, and pricing |
| **Table Management** | QR-code table mapping with online reservations |
| **Employee Management** | Staff scheduling, shifts, and performance tracking |
| **Guest WiFi Portal** | QR scan → phone auth → internet access with session management |
| **Reports & Analytics** | Sales, categories, employee performance, expenses |
| **Stripe Payments** | Online payment processing with webhook verification |
| **Bilingual UI** | Full Arabic (RTL) and English (LTR) support |
| **Offline Support** | Service worker + IndexedDB queue for offline orders |
| **Security** | XSS sanitization, rate limiting, helmet CSP, JWT auth, HPP protection |

## Tech Stack

**Frontend:** React 18 + TypeScript + Tailwind CSS + Vite (PWA)
**Backend:** Node.js + Express + TypeScript + Prisma ORM
**Database:** PostgreSQL 16
**Real-time:** Socket.io
**Containerization:** Docker + Compose

---

## Quick Start

### Docker (recommended)

```bash
docker-compose up -d
```

### Manual Setup

**1. Database**
```bash
docker run -d --name restaurantos-db \
  -e POSTGRES_DB=restaurantos \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 postgres:16-alpine
```

**2. Server**
```bash
cd server
npm install
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

**3. Client**
```bash
cd client
npm install
npm run dev
```

## Test Credentials

> ⚠️ These are development-only credentials. **Never use in production.**

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@cafe.com` | `admin123` |

- Kitchen Display: http://localhost:5173/kitchen
- Customer UI: http://localhost:5173

## Project Structure

```
RestaurantOS/
├── server/                 # Express API, Prisma, Socket.io
│   ├── src/
│   │   ├── middleware/     # Auth, rate limiting, sanitization, audit
│   │   ├── routes/         # REST API endpoints
│   │   ├── sockets/        # WebSocket handlers
│   │   ├── services/       # Business logic (printer, etc.)
│   │   └── index.ts        # Server entry point
│   └── prisma/
│       ├── schema.prisma   # Database schema
│       └── seed.ts         # Dev seed data
├── client/                 # React SPA
│   └── src/
│       ├── pages/          # Customer pages + Admin pages
│       ├── components/     # Shared components
│       ├── store/          # Cart context, auth store
│       ├── services/       # API client, Socket, offline queue
│       ├── i18n/           # Arabic/English translations
│       └── hooks/          # Network status, thermal printer
├── shared/                 # Shared TypeScript types
├── docker-compose.yml
└── run.ps1                 # Windows dev launcher
```

## Environment Variables

Copy `server/.env.example` to `server/.env` and configure:

```env
JWT_SECRET=<your-secret>
REFRESH_SECRET=<your-refresh-secret>
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/restaurantos
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

> The server will **exit on startup** if `JWT_SECRET` or `REFRESH_SECRET` are not set.

## Security

- **Helmet** with strict Content Security Policy
- **Rate limiting** (per-endpoint tiers)
- **XSS sanitization** on all inputs
- **HPP** (HTTP Parameter Pollution) protection
- **JWT access/refresh token** rotation
- **CORS** with explicit origins
- **Compression** (gzip/brotli) via `compression`
- **No stack traces** in production errors

## License

MIT License — see [LICENSE](LICENSE) for details.
