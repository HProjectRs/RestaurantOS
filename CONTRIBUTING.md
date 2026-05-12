# Contributing to RestaurantOS

Thank you for your interest in contributing to RestaurantOS! We welcome contributions from everyone — whether you're fixing a bug, adding a feature, improving documentation, or translating the UI.

> By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## Table of Contents

1. [Ways to Contribute](#ways-to-contribute)
2. [Development Setup](#development-setup)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Running Tests](#running-tests)
6. [Linting & Formatting](#linting--formatting)
7. [Pull Request Process](#pull-request-process)
8. [Database Changes](#database-changes)
9. [Adding Translations](#adding-translations)

---

## Ways to Contribute

### Bug Reports
- Check existing issues before creating a new one
- Use the bug report template when opening an issue
- Include steps to reproduce, expected vs actual behavior, and environment details

### Feature Requests
- Open a feature request issue describing the use case
- Discuss with maintainers before implementing to ensure alignment

### Code Contributions
- All code must pass TypeScript strict checks and ESLint
- Follow the existing code style and patterns
- Write tests for new features

### Documentation Improvements
- Fix typos, clarify instructions, add examples
- Improve API documentation

### Translations
- Help translate the UI into new languages (currently Arabic + English)
- See [Adding Translations](#adding-translations) section

---

## Development Setup

### Prerequisites
- **Node.js** 20+ (recommended: use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm))
- **Docker** (recommended for PostgreSQL) or a local PostgreSQL 16 instance
- **Git**

### Step 1: Fork & Clone
```bash
git clone https://github.com/your-username/RestaurantOS.git
cd RestaurantOS
```

### Step 2: Environment Setup
```bash
cp server/.env.example server/.env
# Edit server/.env with your settings
```

### Step 3: Start with Docker (recommended)
```bash
docker-compose up -d postgres
```

Or start a standalone PostgreSQL container:
```bash
docker run -d --name restaurantos-db \
  -e POSTGRES_DB=restaurantos \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 postgres:16-alpine
```

### Step 4: Server Setup
```bash
cd server
npm install
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

### Step 5: Client Setup
```bash
cd client
npm install
npm run dev
```

### Verify
```bash
curl http://localhost:3001/api/health
# Expected: {"status":"OK","timestamp":"..."}
```

### Access Points
| Service | URL |
|---------|-----|
| Client (React) | http://localhost:5173 |
| Server (API) | http://localhost:3001 |
| Kitchen Display | http://localhost:5173/kitchen |
| Admin Dashboard | http://localhost:5173/admin |

### Test Credentials (Development Only)
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@cafe.com | admin123 |

---

## Project Structure

```
RestaurantOS/
├── server/                     # Express API backend
│   ├── src/
│   │   ├── middleware/         # Auth, rate limiting, sanitization, audit
│   │   ├── routes/             # REST API endpoints (auth, menu, orders, etc.)
│   │   ├── sockets/            # Socket.io real-time handlers
│   │   ├── services/           # Business logic (printer, etc.)
│   │   ├── types/              # Server-specific TypeScript types
│   │   ├── tests/              # Jest test files
│   │   ├── sentry.ts           # Sentry error monitoring
│   │   ├── swagger.ts          # OpenAPI documentation
│   │   └── index.ts            # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema
│   │   ├── migrations/          # Prisma migration files
│   │   └── seed.ts              # Dev seed data
│   └── Dockerfile
├── client/                     # React SPA frontend
│   ├── src/
│   │   ├── pages/              # Page components (admin/, CartPage, KitchenPage, etc.)
│   │   ├── components/         # Shared UI components (layout/, ui/)
│   │   ├── store/              # Cart context, auth store (Zustand)
│   │   ├── services/           # API client, Socket.io, offline queue
│   │   ├── i18n/               # Arabic/English translations
│   │   ├── hooks/              # Custom React hooks
│   │   ├── types/              # Client-specific types
│   │   ├── tests/              # Vitest test files
│   │   ├── sentry.ts           # Sentry frontend monitoring
│   │   └── App.tsx             # Root React component
│   └── Dockerfile
├── shared/                     # Shared TypeScript types
│   └── types.ts
├── tests/load/                 # k6 load testing scripts
├── .github/
│   ├── workflows/ci.yml        # CI/CD pipeline
│   ├── dependabot.yml          # Automated dependency updates
│   ├── CODEOWNERS              # Code ownership assignments
│   └── pull_request_template.md
├── docker-compose.yml          # Docker orchestration
├── .husky/                     # Git hooks (pre-commit, commit-msg)
│   ├── pre-commit
│   └── commit-msg
└── package.json                # Root package with unified scripts
```

---

## Development Workflow

1. **Branch from main**
   ```bash
   git checkout main
   git pull upstream main
   git checkout -b feat/your-feature-name
   ```

2. **Branch naming conventions**
   - `feat/description` — new features
   - `fix/description` — bug fixes
   - `docs/description` — documentation changes
   - `refactor/description` — code restructuring
   - `chore/description` — maintenance tasks

3. **Commit format** — [Conventional Commits](https://www.conventionalcommits.org/)
   ```
   type(scope): description
   
   Examples:
   feat(pos): add split payment support
   fix(menu): correct price calculation with modifiers
   docs(api): update authentication examples
   ```

4. **Push and open a PR**
   ```bash
   git push origin feat/your-feature-name
   # Open a pull request on GitHub
   ```

---

## Running Tests

### Backend Tests
```bash
cd server
npm test              # Run tests
npm run test:coverage # Run with coverage report
```

### Frontend Tests
```bash
cd client
npm test              # Run tests with Vitest
npm run test:ui       # Run with Vitest UI dashboard
```

### All Tests
```bash
# From root
npm test
```

### Load Tests (requires k6)
```bash
npm run test:smoke  # Basic sanity check
npm run test:load   # Average traffic simulation
npm run test:stress # Find breaking point
```

---

## Linting & Formatting

### ESLint
```bash
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix fixable issues
```

### Prettier
```bash
npm run format        # Auto-format all files
npm run format:check  # Check formatting without changing
```

> **All code must pass ESLint with 0 warnings before a PR can be merged.**

### TypeScript
```bash
npm run typecheck     # TypeScript strict check (both server + client)
```

---

## Pull Request Process

1. **PR title** must follow Conventional Commits format
2. **Fill out the PR template** completely
3. **CI must pass** — all jobs green (lint, typecheck, test, build)
4. **At least one approval** required for merge
5. **Squash merge** preferred to keep history clean

### PR Checklist
Before submitting:
- [ ] TypeScript compiles with `--noEmit` (no errors)
- [ ] ESLint passes with 0 warnings
- [ ] All tests pass
- [ ] New code includes tests
- [ ] Documentation updated if needed
- [ ] CHANGELOG.md updated if adding a feature

---

## Database Changes

### Adding a Migration
```bash
cd server
npx prisma migrate dev --name description_of_change
```

### Applying Migrations in Production
```bash
npx prisma migrate deploy
```

### Seeding Data
```bash
npx tsx prisma/seed.ts
```

### ⚠️ Important Rules
- **Never edit existing migration files** — create a new migration instead
- **Always test migrations** on a copy of production data before deploying
- **Use descriptive names** for migrations: `add_loyalty_points_to_customers`
- **Run `prisma migrate dev` locally**, never `prisma db push` for schema changes

---

## Adding Translations

RestaurantOS supports Arabic (RTL) and English (LTR) with `react-i18next`.

### Translation Files
```
client/src/i18n/
├── ar.json    # Arabic translations
└── en.json    # English translations
```

### Adding a New Key
1. Add the key to both `ar.json` and `en.json`
2. Use the key in components: `{t('your.key.here')}`
3. For RTL-sensitive styles, use `dir={i18n.dir()}`

### Adding a New Language
1. Create a new translation file: `client/src/i18n/fr.json`
2. Add it to the i18n configuration in `client/src/i18n/index.ts`
3. Add the language option to the language switcher component

---

## Questions?

- Open a [GitHub Discussion](https://github.com/HProjectRs/RestaurantOS/discussions)
- Create an [Issue](https://github.com/HProjectRs/RestaurantOS/issues)
- Check the [README](README.md) for quick start and feature overview

---

*Thank you for contributing to RestaurantOS! 🚀*
