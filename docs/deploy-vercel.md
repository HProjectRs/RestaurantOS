# Deploy RestaurantOS Frontend to Vercel

This guide walks through deploying the RestaurantOS React frontend (Vite + TypeScript + Tailwind + PWA) to [Vercel](https://vercel.com).

> 💰 Vercel's free tier is perfect for this project — includes SSL, CDN, and preview deployments.

---

## Prerequisites

- [Vercel account](https://vercel.com/signup) (GitHub login supported)
- [Vercel CLI](https://vercel.com/docs/cli): `npm install -g vercel`
- Backend already deployed on Railway (have the URL ready)
- Your RestaurantOS repository pushed to GitHub

## Step 1: Create vercel.json

A `vercel.json` is already created at `client/vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

> The `rewrites` rule is essential for SPA routing — it ensures all routes (like `/menu`, `/kitchen`, `/admin`) serve `index.html` instead of returning 404.

## Step 2: Configure Environment Variables

Create `client/.env.production` (DO NOT commit this — add to `.gitignore`):

```bash
VITE_API_URL=https://your-backend.railway.app/api
VITE_SOCKET_URL=https://your-backend.railway.app
```

> ⚠️ Vite requires the `VITE_` prefix for all environment variables exposed to the browser.

Alternatively, set these in Vercel dashboard (recommended for security):
1. Go to your project in Vercel dashboard
2. **Settings** → **Environment Variables**
3. Add `VITE_API_URL` and `VITE_SOCKET_URL`

## Step 3: Deploy via GitHub Integration (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Import your RestaurantOS GitHub repository
4. Configure the project:

| Setting | Value |
|---------|-------|
| **Root Directory** | `client` |
| **Build Command** | `npm run build` (auto-detected from vercel.json) |
| **Output Directory** | `dist` (auto-detected from vercel.json) |
| **Framework Preset** | Vite (auto-detected from vercel.json) |

5. Add environment variables:
   - `VITE_API_URL`: `https://your-backend.railway.app/api`
   - `VITE_SOCKET_URL`: `https://your-backend.railway.app`

6. Click **Deploy**

## Step 4: Deploy via CLI (Alternative)

```bash
cd client
vercel login
vercel --prod
```

The CLI will prompt you to:
1. Set up and deploy — choose **Y**
2. Link to an existing Vercel project or create new
3. Set root directory — use `.` (stay in `client/`)
4. Add environment variables when prompted

## Step 5: After Deployment

1. Copy your Vercel URL (e.g., `https://restaurantos.vercel.app`)
2. Go back to **Railway dashboard** → Backend service → **Variables**
3. Update `CLIENT_URL` to your Vercel URL
4. If needed, update CORS origin list in `server/src/index.ts`
5. Redeploy the backend on Railway

## Step 6: Verify

- Visit `https://your-app.vercel.app` — you should see the RestaurantOS homepage
- Test login at `/login` with admin@cafe.com / admin123
- Test the kitchen display at `/kitchen`
- Verify API calls work (check browser DevTools Network tab)

## Step 7: Set Up Custom Domain (Optional)

1. In Vercel dashboard, go to your project → **Settings** → **Domains**
2. Enter your domain (e.g., `restaurantos.com`)
3. Follow Vercel's DNS configuration instructions
4. Wait for DNS propagation (up to 48 hours)
5. Update `CLIENT_URL` in Railway with the custom domain

## Step 8: Verify PWA Works

1. Open Chrome DevTools → **Application** → **Service Workers**
2. You should see the service worker registered and active
3. Go to **Application** → **Manifest** to verify the PWA manifest is valid
4. Try installing the app on your phone or desktop

## Preview Deployments

Every pull request automatically gets a unique preview URL:
- Open a PR → Vercel builds and deploys to a preview URL
- The URL is posted as a comment on the PR
- Useful for testing changes before merging to main
- Preview URLs use the same environment variables as production

## Troubleshooting

### CORS errors between Vercel and Railway
- Verify `CLIENT_URL` in Railway matches your Vercel URL exactly
- Check for trailing slashes (they matter!)
- Make sure the origin in `server/src/index.ts` includes both `http` and `https` variants

### Socket.io connection issues
- Railway supports WebSocket connections on paid plans
- On the free tier, you may need to use long-polling fallback
- Set `transports: ['websocket', 'polling']` on the client side
- Ensure `VITE_SOCKET_URL` uses `https://` (not `wss://`)

### PWA not updating
- Service workers cache aggressively — users may see old content
- Bump the version in `vite.config.ts` or use `npm run build --mode production`
- The service worker checks for updates on navigation
- Users can manually clear site data in Chrome DevTools

### Blank page on production
- Check browser console for errors
- Verify all environment variables are set in Vercel dashboard
- Ensure `VITE_API_URL` doesn't have a trailing slash
- Try a hard refresh (Ctrl+Shift+R)
