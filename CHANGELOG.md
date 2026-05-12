# Changelog

All notable changes to RestaurantOS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Swagger/OpenAPI documentation at `/api/docs`
- Sentry error monitoring (frontend + backend)
- Backend test suite with Jest + Supertest
- Frontend test suite with Vitest + RTL
- Performance & load testing scripts (k6)
- Database migration strategy with Prisma Migrate
- Husky + lint-staged pre-commit hooks
- Production Docker hardening (multi-stage, non-root user)
- Deployment guides for Railway and Vercel

### Changed

- Upgraded ESLint configuration with stricter rules
- Enhanced CI workflow with caching, parallel jobs, and PostgreSQL service
- Improved Dependabot configuration with grouped updates and labels
- Updated root package.json with unified scripts
- Hardened security policies in SECURITY.md

## [1.0.0] - 2026-05-12

### Added

- **Customer Homepage** — restaurant landing page with hero, quick actions, and step-by-step guide
- **Menu Browsing** — category filtering, item cards with images/descriptions, modifier modal
- **Cart System** — order type selection (dine-in/takeaway/delivery), customer info, quantity controls, price breakdown
- **Order Tracking** — real-time status progress, estimated time, item badges, call waiter
- **WiFi Connect Portal** — QR scan → phone auth → internet access with session management
- **Admin Login** — JWT-based authentication with access/refresh token rotation
- **Dashboard** — sales overview, popular items, order status charts
- **POS System** — in-store ordering with quick-add interface
- **Kitchen Display** — real-time order tickets with sound notifications
- **Menu Management** — categories, items, modifiers, and pricing CRUD
- **Table Management** — table layout with QR code assignment
- **Employee Management** — staff profiles, roles, and shift scheduling
- **Online Reservations** — table booking with date/time selection
- **Reports & Analytics** — sales by period, category performance, employee stats
- **Expense Tracking** — expense categories, recurring entries
- **Guest WiFi** — QR code generation, session management, daily codes

### Security

- Helmet CSP headers with strict Content Security Policy
- Rate limiting (per-endpoint tiers: auth 5/15min, strict 20/hr, general 100/min)
- XSS input sanitization on body, query, and params
- HPP (HTTP Parameter Pollution) protection
- JWT access/refresh token authentication
- CORS with explicit origin whitelist
- Compression (gzip) middleware

### Infrastructure

- React 18 + TypeScript + Tailwind CSS + Vite (PWA)
- Node.js + Express + TypeScript + Prisma ORM
- PostgreSQL 16 database
- Socket.io real-time communication
- Docker + Compose deployment
- Bilingual Arabic/English (RTL-first) UI
- Offline support via service worker + IndexedDB queue
- Stripe payment integration with webhook verification
- Thermal printer support (WebUSB + server-side)

[Unreleased]: https://github.com/HProjectRs/RestaurantOS/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/HProjectRs/RestaurantOS/releases/tag/v1.0.0
