import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import QRCode from 'qrcode'
import { v4 as uuidv4 } from 'uuid'
import { authenticate, requireRole } from '../middleware/auth'
import { AuthRequest } from '../types'

const router = Router()

// Generate WiFi QR codes
router.post('/qr-codes', authenticate, requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const { label, durationMinutes, maxSessions } = req.body

    const code = uuidv4().slice(0, 8).toUpperCase()
    const domain = process.env.FRONTEND_URL || 'http://localhost:5173'

    const wifiQr = await prisma.wifiQrCode.create({
      data: {
        businessId: req.user!.businessId,
        code,
        label: label || `WiFi-${code}`,
        durationMinutes: durationMinutes || 120,
        maxSessions: maxSessions || 50,
      },
    })

    // Generate QR code data
    const qrData = `${domain}/wifi?code=${code}&businessId=${req.user!.businessId}`
    const qrImage = await QRCode.toDataURL(qrData)

    res.status(201).json({ ...wifiQr, qrImage, qrUrl: qrData })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get all WiFi QR codes
router.get('/qr-codes', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const qrCodes = await prisma.wifiQrCode.findMany({
      where: { businessId: req.user!.businessId },
      include: { _count: { select: { sessions: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json(qrCodes)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Public: Customer scans QR and enters phone to get WiFi
router.post('/connect', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const { code, phoneNumber, macAddress } = req.body

    const wifiQr = await prisma.wifiQrCode.findUnique({
      where: { code },
      include: { business: true },
    })

    if (!wifiQr || !wifiQr.isActive) {
      return res.status(404).json({ error: 'Invalid or expired QR code' })
    }

    // Check session limit
    const activeSessions = await prisma.wifiSession.count({
      where: { wifiQrCodeId: wifiQr.id, status: 'ACTIVE' },
    })
    if (activeSessions >= wifiQr.maxSessions) {
      return res.status(429).json({ error: 'Maximum active sessions reached' })
    }

    const duration = wifiQr.durationMinutes
    const startTime = new Date()
    const endTime = new Date(startTime.getTime() + duration * 60000)

    const session = await prisma.wifiSession.create({
      data: {
        wifiQrCodeId: wifiQr.id,
        phoneNumber: phoneNumber || null,
        macAddress: macAddress || null,
        durationMinutes: duration,
        status: 'ACTIVE',
        startTime,
        endTime,
      },
    })

    // Here you would integrate with your WiFi gateway (MikroTik, etc.)
    // to actually grant network access to the MAC address
    // Example MikroTik API call would go here

    res.json({
      success: true,
      session: {
        id: session.id,
        durationMinutes: session.durationMinutes,
        startTime: session.startTime,
        endTime: session.endTime,
      },
      wifi: {
        ssid: wifiQr.business.name,
        password: 'welcome', // Or dynamic password
      },
    })
  } catch (error) {
    console.error('WiFi connect error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Public: Get WiFi QR info
router.get('/info/:code', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const wifiQr = await prisma.wifiQrCode.findUnique({
      where: { code: req.params.code },
      include: { business: { select: { name: true, nameAr: true, logo: true } } },
    })
    if (!wifiQr) return res.status(404).json({ error: 'QR code not found' })
    res.json({
      id: wifiQr.id,
      durationMinutes: wifiQr.durationMinutes,
      business: wifiQr.business,
    })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Admin: Get WiFi sessions
router.get('/sessions', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const sessions = await prisma.wifiSession.findMany({
      where: { wifiQrCode: { businessId: req.user!.businessId } },
      orderBy: { startTime: 'desc' },
      take: 100,
      include: { wifiQrCode: { select: { label: true, code: true } } },
    })
    res.json(sessions)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Admin: Disconnect a WiFi session
router.patch('/sessions/:id/disconnect', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const session = await prisma.wifiSession.update({
      where: { id: req.params.id },
      data: { status: 'DISCONNECTED' },
    })
    res.json(session)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Admin: Toggle QR code active status
router.patch('/qr-codes/:id/toggle', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const qr = await prisma.wifiQrCode.findUnique({ where: { id: req.params.id } })
    if (!qr) return res.status(404).json({ error: 'QR code not found' })
    const updated = await prisma.wifiQrCode.update({
      where: { id: req.params.id },
      data: { isActive: !qr.isActive },
    })
    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
