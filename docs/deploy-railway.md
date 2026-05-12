# Deploy RestaurantOS Backend to Railway

This guide walks through deploying the RestaurantOS backend (Express + TypeScript + Prisma) and PostgreSQL database to [Railway](https://railway.app).

> 💰 Railway's free tier includes $5 of credits per month — enough to run this app comfortably.

---

## Prerequisites

- [Railway account](https://railway.app/login) (GitHub login supported)
- [Railway CLI](https://docs.railway.app/develop/cli): `npm install -g @railway/cli`
- Your RestaurantOS repository pushed to GitHub

## Step 1: Create a Railway Project

```bash
# Login to Railway
railway login

# Navigate to your project root
cd RestaurantOS

# Initialize Railway in the project
railway init

# Follow the prompts to link/create a project
```

Alternatively, create a project from the [Railway Dashboard](https://railway.app/dashboard):
1. Click **New Project**
2. Select **Empty Project**
3. Name it (e.g., `restaurantos`)

## Step 2: Add PostgreSQL Database

1. In your Railway project dashboard, click **New Service**
2. Select **Database** → **PostgreSQL**
3. Railway will provision a PostgreSQL 16 instance automatically
4. Once ready, click on the PostgreSQL service
5. Go to the **Variables** tab and copy the `DATABASE_URL` value

The connection string format looks like:
```
postgresql://postgres:randompassword@host:port/railway
```

> ⚠️ Keep this URL safe — it contains your database credentials.

## Step 3: Configure the Backend Service

1. In Railway dashboard, click **New Service** → **GitHub Repo**
2. Select your RestaurantOS repository
3. Configure the service:

| Setting | Value |
|---------|-------|
| **Root Directory** | `server` |
| **Build Command** | `npm ci && npx prisma generate && npm run build` |
| **Start Command** | `npx prisma migrate deploy && node dist/index.js` |

### Why `prisma migrate deploy` (not `push`)?

- `prisma db push` syncs the schema but doesn't create migration files — it's for development only
- `prisma migrate deploy` runs pending migration files in order — safe for production
- You need to run `prisma migrate dev --name init` locally first to generate migration files

## Step 4: Set Environment Variables

In the Railway dashboard for your backend service, go to **Variables** and add:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Use Railway's service reference syntax |
| `JWT_SECRET` | `openssl rand -base64 32` | Generate a strong random secret |
| `REFRESH_SECRET` | `openssl rand -base64 32` | Generate another strong random secret |
| `NODE_ENV` | `production` | Disables stack traces in errors |
| `PORT` | `3000` | Railway uses this port |
| `STRIPE_SECRET_KEY` | `sk_live_...` | From Stripe dashboard (optional) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | From Stripe webhook settings (optional) |
| `CLIENT_URL` | `https://your-app.vercel.app` | Your Vercel frontend URL (add after deploying frontend) |

### Generate strong secrets:
```bash
openssl rand -base64 32
# Example output: xk8vQ3zF9mN2pL5rT7wY1bD4eG6hJ8kM0oR2tV4nX6=
```

## Step 5: Deploy

Railway will automatically deploy when you push to the main branch:

```bash
git push origin main
```

Or trigger a manual deploy from the Railway dashboard.

## Step 6: Run Database Seed (Optional)

```bash
# Via Railway CLI
railway run npx tsx prisma/seed.ts

# Or via Railway dashboard: open a shell and run
npx tsx prisma/seed.ts
```

## Step 7: Verify Deployment

```bash
curl https://your-app.railway.app/api/health
```

Expected response:
```json
{"status":"OK","timestamp":"2026-05-12T10:00:00.000Z"}
```

## Step 8: Set Up Stripe Webhook

1. After deployment, note your Railway URL: `https://your-app.railway.app`
2. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks) → **Add endpoint**
3. Endpoint URL: `https://your-app.railway.app/api/payments/webhook`
4. Select events to listen to: `checkout.session.completed`, `payment_intent.succeeded`
5. Copy the **Signing secret** (`whsec_...`)
6. Add it as `STRIPE_WEBHOOK_SECRET` in Railway variables
7. Redeploy the backend

## Auto-Deploy

Railway automatically redeploys when you push to the connected branch:
- Push to `main` → triggers deployment
- View deploy logs in Railway dashboard under **Deployments** tab
- Rollback to any previous deployment from the same tab

## Troubleshooting

### "Cannot find module" error
```bash
# Rebuild with clean install
npm ci
npx prisma generate
npm run build
```

### Prisma migration errors
- Verify `DATABASE_URL` is correct and accessible
- Check the format: `postgresql://user:password@host:port/dbname?schema=public`
- Make sure you've run `prisma migrate dev` locally first to create migration files

### CORS errors
- Ensure `CLIENT_URL` env var matches your frontend URL exactly
- Check that the URL has no trailing slash
- If testing with curl, add the `Origin` header matching CLIENT_URL

### Application crashes on startup
- Check logs in Railway dashboard
- Verify `JWT_SECRET` and `REFRESH_SECRET` are set
- Ensure `DATABASE_URL` is accessible from Railway's network

### Port binding issues
- Railway expects your app to bind to `0.0.0.0` (not `localhost`)
- Express does this by default — no changes needed
- Railway overrides `PORT` with their assigned port
