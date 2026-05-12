<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/HProjectRs/RestaurantOS">
    <img src="client/public/screenshots/homepage.png" alt="RestaurantOS Logo" width="800" style="border-radius: 12px;">
  </a>
  <br/><br/>
  <h1>RestaurantOS</h1>
  <p align="center">
    <strong>Production-ready restaurant & café management system</strong>
    <br />
    <em>نظام إدارة المطاعم والمقاهي</em>
    <br /><br />
    <a href="https://restaurantos.vercel.app"><strong>🔗 Live Demo »</strong></a>
    <br /><br />
    <a href="https://github.com/HProjectRs/RestaurantOS/actions/workflows/ci.yml">
      <img src="https://github.com/HProjectRs/RestaurantOS/actions/workflows/ci.yml/badge.svg" alt="CI">
    </a>
    <a href="https://codecov.io/gh/HProjectRs/RestaurantOS">
      <img src="https://codecov.io/gh/HProjectRs/RestaurantOS/branch/main/graph/badge.svg" alt="codecov">
    </a>
    <a href="LICENSE">
      <img src="https://img.shields.io/github/license/HProjectRs/RestaurantOS" alt="License">
    </a>
    <a href="https://www.typescriptlang.org/">
      <img src="https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript" alt="TypeScript">
    </a>
    <a href="https://nodejs.org/">
      <img src="https://img.shields.io/badge/Node.js-20%2B-green?logo=nodedotjs" alt="Node">
    </a>
    <a href="CONTRIBUTING.md">
      <img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs Welcome">
    </a>
    <a href="https://github.com/HProjectRs/RestaurantOS/commits/main">
      <img src="https://img.shields.io/github/last-commit/HProjectRs/RestaurantOS" alt="Last Commit">
    </a>
  </p>
</div>

<br/>

## Screenshots

| POS System | Kitchen Display |
|---|---|
| ![POS](docs/screenshots/pos.png) | ![Kitchen](docs/screenshots/kitchen.png) |

| Menu Management | Analytics Dashboard |
|---|---|
| ![Menu](docs/screenshots/menu.png) | ![Analytics](docs/screenshots/analytics.png) |

> Screenshots coming soon — run locally to see the full UI.

---

## Live Demo

🔗 **[Live Demo](https://restaurantos.vercel.app)** — explore the UI with read-only seed data.

---

## Features

| Module | Description |
|---|---|
| 🏠 **Customer Homepage** | Restaurant landing page with menu browsing, ordering, and WiFi connect |
| 💳 **POS System** | In-store, takeaway, and delivery order management |
| 🍳 **Kitchen Display** | Real-time order tickets with sound notifications |
| 📋 **Menu Management** | Categories, items, modifiers, and pricing |
| 🪑 **Table Management** | QR-code table mapping with online reservations |
| 👥 **Employee Management** | Staff scheduling, shifts, and performance tracking |
| 📶 **Guest WiFi Portal** | QR scan → phone auth → internet access with session management |
| 📊 **Reports & Analytics** | Sales, categories, employee performance, expenses |
| 💰 **Stripe Payments** | Online payment processing with webhook verification |
| 🌐 **Bilingual UI** | Full Arabic (RTL) and English (LTR) support |
| 📱 **Offline Support** | Service worker + IndexedDB queue for offline orders |
| 🔒 **Security** | XSS sanitization, rate limiting, helmet CSP, JWT auth, HPP protection |

## Tech Stack

<p align="center">
  <img src="https://img.shields.io/badge/React-20232a?logo=react&logoColor=61dafb" alt="React 18">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white" alt="Prisma">
  <img src="https://img.shields.io/badge/Socket.io-010101?logo=socketdotio&logoColor=white" alt="Socket.io">
  <img src="https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/Stripe-008CDD?logo=stripe&logoColor=white" alt="Stripe">
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
</p>

## Architecture

```mermaid
graph TB
    subgraph Client["React SPA (Vite)"]
        UI[React Components]
        Store[Zustand State]
        Router[React Router]
        SW[Service Worker]
        i18n[i18next AR/EN]
    end

    subgraph Server["Node.js Express API"]
        API[REST API /api/*]
        Socket[Socket.io]
        Auth[JWT Auth]
        Sanitize[XSS Sanitization]
        Rate[Rate Limiting]
    end

    subgraph Services["Integration Layer"]
        Stripe[Stripe Payments]
        Sentry[Sentry Errors]
        Printer[Thermal Printer]
    end

    subgraph Database[PostgreSQL 16 + Prisma ORM]
        DB[(Database)]
        Migrations[Migrations]
    end

    Client -->|HTTP / WSS| Server
    Server -->|Prisma Client| Database
    Server <--> Services
    Client -->|WebUSB| Printer

    style Client fill:#1e293b,color:#fff
    style Server fill:#1e293b,color:#fff
    style Database fill:#1e293b,color:#fff
    style Services fill:#1e293b,color:#fff
```

---

## Quick Start

Get running in one command:

```bash
git clone https://github.com/HProjectRs/RestaurantOS && cd RestaurantOS && docker-compose up -d
```

### Manual Setup

**Prerequisites:** Node.js 20+, Docker (for PostgreSQL), Git

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
cp .env.example .env   # Edit JWT_SECRET and REFRESH_SECRET
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

**4. Open in browser**
- Client: http://localhost:5173
- API: http://localhost:3001/api/health
- Kitchen Display: http://localhost:5173/kitchen
- Swagger Docs: http://localhost:3001/api/docs

### Test Credentials

> ⚠️ Development credentials only — never use in production.

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@cafe.com` | `admin123` |

---

## Project Structure

```
RestaurantOS/
├── server/                 # Express API, Prisma, Socket.io
│   ├── src/
│   │   ├── middleware/     # Auth, rate limiting, sanitization, audit
│   │   ├── routes/         # REST API endpoints (15 modules)
│   │   ├── sockets/        # WebSocket handlers
│   │   ├── services/       # Business logic (printer, etc.)
│   │   ├── tests/          # Jest test suite
│   │   ├── sentry.ts       # Error monitoring
│   │   ├── swagger.ts      # OpenAPI documentation
│   │   └── index.ts        # Server entry point
│   └── prisma/
│       ├── schema.prisma   # Database schema
│       ├── migrations/     # Prisma migration files
│       └── seed.ts         # Dev seed data
├── client/                 # React SPA
│   └── src/
│       ├── pages/          # Customer + Admin pages
│       ├── components/     # Shared UI components
│       ├── store/          # Cart context, auth store
│       ├── services/       # API client, Socket, offline queue
│       ├── i18n/           # Arabic/English translations
│       ├── hooks/          # Custom React hooks
│       └── tests/          # Vitest test suite
├── shared/                 # Shared TypeScript types
├── tests/load/             # k6 load testing scripts
├── docs/                   # Deployment guides
├── .github/                # CI/CD, dependabot, templates
├── docker-compose.yml
├── docker-compose.override.yml
└── package.json
```

## Deployment

### Docker Compose (Production)

```bash
# 1. Set required environment variables
export DB_PASSWORD=$(openssl rand -base64 24)
export JWT_SECRET=$(openssl rand -base64 32)
export REFRESH_SECRET=$(openssl rand -base64 32)

# 2. Start all services
docker-compose --profile production up -d

# 3. Run database migrations
docker-compose exec server npx prisma migrate deploy

# 4. Verify health
curl http://localhost:3001/api/health
```

Caddy automatically handles:
- HTTPS with auto SSL certificates (Let's Encrypt)
- Reverse proxy to client and server
- HTTP/2 and HTTP/3 support

See full guides:
- [Railway Deployment](docs/deploy-railway.md)
- [Vercel Deployment](docs/deploy-vercel.md)

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | `file:./dev.db` | PostgreSQL connection string (`postgresql://user:pass@host:5432/db`) |
| `JWT_SECRET` | ✅ | — | JWT signing secret (min 32 chars, `openssl rand -base64 32`) |
| `REFRESH_SECRET` | ✅ | — | Refresh token secret (different from JWT_SECRET) |
| `JWT_EXPIRES_IN` | ❌ | `15m` | Access token lifetime |
| `PORT` | ❌ | `3001` | Server port |
| `NODE_ENV` | ❌ | `development` | Set to `production` for deployment |
| `FRONTEND_URL` | ❌ | `http://localhost:5173` | CORS origin (comma-separated) |
| `STRIPE_SECRET_KEY` | ❌ | — | Stripe secret key (required for payments) |
| `STRIPE_WEBHOOK_SECRET` | ❌ | — | Stripe webhook signing secret |
| `SENTRY_DSN` | ❌ | — | Sentry error tracking DSN |
| `UPLOAD_DIR` | ❌ | `./uploads` | Menu image upload directory |
| `BACKUP_DIR` | ❌ | `./backups` | Database backup directory |

---

## Roadmap

- [x] Core POS system (dine-in, takeaway, delivery)
- [x] Kitchen display with real-time updates
- [x] Stripe payment integration
- [x] PWA + offline support (service worker + IndexedDB)
- [x] Bilingual Arabic/English UI
- [x] QR code table ordering
- [x] Guest WiFi portal
- [x] Comprehensive test suite
- [x] OpenAPI documentation
- [x] Sentry error monitoring
- [ ] Mobile app (React Native)
- [ ] Multi-branch support
- [ ] Loyalty points system
- [ ] WhatsApp order notifications
- [ ] AI-powered sales forecasting

---

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Development setup guide
- Code style and commit conventions
- Pull request process
- Database migration instructions
- Translation guidelines

---

## Security

See [SECURITY.md](SECURITY.md) for our security policy and vulnerability reporting process.

Key security features:
- **Helmet** with strict Content Security Policy
- **Rate limiting** (per-endpoint tiers)
- **XSS sanitization** on all inputs
- **HPP** (HTTP Parameter Pollution) protection
- **JWT access/refresh token** rotation
- **CORS** with explicit origins
- **Compression** (gzip/brotli) via `compression`
- **No stack traces** in production errors
- **Non-root user** in production Docker containers

---

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/HProjectRs">HProjectRs</a>
  <br/>
  <a href="https://github.com/HProjectRs/RestaurantOS">GitHub</a>
  ·
  <a href="https://github.com/HProjectRs/RestaurantOS/issues">Report Bug</a>
  ·
  <a href="https://github.com/HProjectRs/RestaurantOS/discussions">Request Feature</a>
</p>
