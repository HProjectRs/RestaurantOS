import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireRole } from '../middleware/auth'
import { AuthRequest } from '../types'

const router = Router()

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const settings = await prisma.business.findUnique({
      where: { id: req.user!.businessId },
    })
    res.json(settings)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Public: Get first available business (for demo)
router.get('/public', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const business = await prisma.business.findFirst()
    if (!business) return res.status(404).json({ error: 'No business found' })
    res.json({ id: business.id, name: business.name, nameAr: business.nameAr, logo: business.logo, currency: business.currency })
  } catch (error) {
    console.error('Public settings error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Public: Get business info by ID
router.get('/public/:id', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const business = await prisma.business.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, nameAr: true, logo: true, currency: true },
    })
    if (!business) return res.status(404).json({ error: 'Business not found' })
    res.json(business)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const settings = await prisma.business.update({
      where: { id: req.user!.businessId },
      data: req.body,
    })
    res.json(settings)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
