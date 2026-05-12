import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import hpp from 'hpp'
import compression from 'compression'
import dotenv from 'dotenv'
import path from 'path'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { PrismaClient } from '@prisma/client'
import { setupSocketHandlers } from './sockets'
import authRoutes from './routes/auth'
import menuRoutes from './routes/menu'
import orderRoutes from './routes/orders'
import tableRoutes from './routes/tables'
import wifiRoutes from './routes/wifi'
import employeeRoutes from './routes/employees'
import reportRoutes from './routes/reports'
import reservationRoutes from './routes/reservations'
import settingsRoutes from './routes/settings'
import expenseRoutes from './routes/expenses'
import licenseRoutes from './routes/licenses'
import backupRoutes from './routes/backups'
import invoiceRoutes from './routes/invoices'
import paymentRoutes from './routes/payments'
import loyaltyRoutes from './routes/loyalty'
import { apiLimiter, authLimiter } from './middleware/rateLimiter'
import { sanitizeInput } from './middleware/sanitize'

dotenv.config()

const app = express()
const httpServer = createServer(app)
const prisma = new PrismaClient()
const isProduction = process.env.NODE_ENV === 'production'

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
})

// Trust proxy for correct IP behind reverse proxies
app.set('trust proxy', 1)

// Compression
app.use(compression())

// Security headers (must be first)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      connectSrc: ["'self'", 'ws:', 'wss:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}))

// CORS
const corsOrigin = process.env.FRONTEND_URL || 'http://localhost:5173'
app.use(cors({
  origin: corsOrigin.split(',').map(s => s.trim()),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
}))

// Remove Express fingerprint
app.disable('x-powered-by')

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Parameter pollution protection
app.use(hpp())

// Input sanitization (XSS prevention)
app.use('/api/', sanitizeInput)

// Rate limiting
app.use('/api/', apiLimiter)
app.use('/api/auth/login', authLimiter)

// Serve uploaded images
const uploadsDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads')
app.use('/api/uploads', express.static(uploadsDir))

// Make prisma and io available to routes
app.set('prisma', prisma)
app.set('io', io)

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/menu', menuRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/tables', tableRoutes)
app.use('/api/wifi', wifiRoutes)
app.use('/api/employees', employeeRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/reservations', reservationRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/licenses', licenseRoutes)
app.use('/api/backups', backupRoutes)
app.use('/api/invoices', invoiceRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/loyalty', loyaltyRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// 404 handler
app.use('/api/*', (_req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Secure error handler (no stack traces in production)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(err.status || 500).json({
    error: isProduction ? 'Internal server error' : err.message,
  })
})

setupSocketHandlers(io, prisma)

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`🚀 RestaurantOS Server running on port ${PORT}`)
})

process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  httpServer.close()
  process.exit(0)
})
