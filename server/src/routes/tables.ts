import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import QRCode from 'qrcode'
import { authenticate, requireRole } from '../middleware/auth'
import { AuthRequest } from '../types'

const router = Router()

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const tables = await prisma.table.findMany({
      where: { businessId: req.user!.businessId, isActive: true },
      orderBy: { number: 'asc' },
    })
    res.json(tables)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', authenticate, requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const { number, capacity } = req.body
    const domain = process.env.FRONTEND_URL || 'http://localhost:5173'

    const table = await prisma.table.create({
      data: { number, capacity, businessId: req.user!.businessId },
    })

    // Generate QR code pointing to consumer page
    const qrData = `${domain}/consumer?businessId=${req.user!.businessId}&tableId=${table.id}&table=${table.number}`
    const qrCode = await QRCode.toDataURL(qrData)

    const updated = await prisma.table.update({
      where: { id: table.id },
      data: { qrCode },
    })

    res.status(201).json(updated)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/:id', authenticate, requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const table = await prisma.table.update({
      where: { id: req.params.id },
      data: req.body,
    })
    res.json(table)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', authenticate, requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    await prisma.table.update({
      where: { id: req.params.id },
      data: { isActive: false },
    })
    res.json({ message: 'Table removed' })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.patch('/:id/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const { status } = req.body
    const table = await prisma.table.update({
      where: { id: req.params.id },
      data: { status },
    })
    res.json(table)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/:id/regenerate-qr', authenticate, requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const domain = process.env.FRONTEND_URL || 'http://localhost:5173'
    const table = await prisma.table.findUnique({ where: { id: req.params.id } })
    if (!table) return res.status(404).json({ error: 'Table not found' })

    const qrData = `${domain}/consumer?businessId=${table.businessId}&tableId=${table.id}&table=${table.number}`
    const qrCode = await QRCode.toDataURL(qrData)

    const updated = await prisma.table.update({
      where: { id: table.id },
      data: { qrCode },
    })
    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
