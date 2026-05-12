# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| v1.0.x  | ✅ Supported       |
| < v1.0  | ❌ Not supported   |

## Reporting a Vulnerability

We take the security of RestaurantOS seriously. If you believe you have found a security vulnerability, **please do NOT open a public GitHub issue**.

### How to Report

1. Go to the repository's **Security** tab
2. Click **Advisories** → **New draft advisory**
3. Fill in the details:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (optional)

### What to Include

- Type of issue (e.g., XSS, SQL injection, authentication bypass)
- Full paths of source file(s) related to the issue
- Location of affected source code (tag/branch/commit or direct URL)
- Step-by-step reproduction instructions
- Proof-of-concept or exploit code (if possible)
- Impact of the issue (how an attacker might exploit it)

### Response Timeline

| Timeframe | Action |
|-----------|--------|
| Within 48 hours | Acknowledgment of receipt |
| Within 7 days | Status update with next steps |
| Varies by severity | Fix timeline communicated |

## Security Features

RestaurantOS includes these security measures built-in:

### HTTP Security Headers
- **Helmet.js** with strict Content Security Policy (CSP)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- Server fingerprint removed (`x-powered-by: false`)

### Rate Limiting
- **Auth endpoints**: 5 requests per 15 minutes per IP
- **Strict endpoints**: 20 requests per hour
- **General API**: 100 requests per minute
- Rate limiting is currently in-memory (resets on server restart)

### Input Validation & Sanitization
- **XSS sanitization** on all `req.body`, `req.query`, and `req.params`
- **HPP (HTTP Parameter Pollution)** protection via `hpp`
- **CORS** with explicit origin whitelist (no wildcard)
- Request body size limited to 10mb

### Authentication & Authorization
- **JWT access tokens** (short expiry, typically 15-60 minutes)
- **JWT refresh tokens** with rotation for secure session management
- **Bcrypt password hashing** for credential storage
- Role-based access control (admin, staff, etc.)

### Payment Security
- **Stripe webhook signature verification** — rejects unsigned payloads
- No raw card data handled (Stripe Elements handles PCI compliance)

## Security Best Practices for Deployers

### Environment Variables
```bash
# Generate strong secrets (do NOT use the defaults!)
openssl rand -base64 32   # For JWT_SECRET
openssl rand -base64 32   # For REFRESH_SECRET
```

### Deployment Checklist
- [ ] Change all default secrets (`JWT_SECRET`, `REFRESH_SECRET`)
- [ ] Never commit `.env` files to the repository
- [ ] Use **HTTPS only** in production (Caddy handles this automatically)
- [ ] Restrict database access to the application container only
- [ ] Rotate Stripe webhook secrets periodically
- [ ] Enable PostgreSQL SSL for production database connections
- [ ] Set `NODE_ENV=production` to disable stack traces in errors

### Docker Security
- Server runs as **non-root user** in production Docker image
- Health checks configured for all services
- Resource limits set on all containers

## Known Limitations / Out of Scope

- **WiFi guest sessions** are time-limited but not cryptographically verified — suitable for café use, not enterprise security
- **Rate limiting is in-memory** — resets on server restart. Use Redis-backed rate limiting for production scale
- **No IP allowlisting** — consider adding a reverse proxy firewall for additional protection

## Preferred Languages

We prefer all communications in **English** or **Arabic**.

## Policy

We will acknowledge receipt of your vulnerability report and send you a timeline for a fix. We will notify you when the issue is resolved. Security researchers who report valid vulnerabilities will be credited in our release notes (with permission).
