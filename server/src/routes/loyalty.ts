import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireRole } from '../middleware/auth'
import { AuthRequest } from '../types'

const router = Router()

// Get loyalty program settings for business
router.get('/program', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    let program = await prisma.loyaltyProgram.findFirst({
      where: { businessId: req.user!.businessId },
    })
    if (!program) {
      program = await prisma.loyaltyProgram.create({
        data: { businessId: req.user!.businessId },
      })
    }
    res.json(program)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update loyalty program settings
router.put('/program', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const program = await prisma.loyaltyProgram.upsert({
      where: { id: req.body.id || '' },
      create: { businessId: req.user!.businessId, ...req.body },
      update: req.body,
    })
    res.json(program)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Find customer by phone
router.get('/customers/search', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const { phone } = req.query
    if (!phone) return res.status(400).json({ error: 'Phone required' })

    const customer = await prisma.loyaltyCustomer.findFirst({
      where: { businessId: req.user!.businessId, phone: phone as string },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } },
    })
    res.json(customer)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Register or find loyalty customer
router.post('/customers', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const { phone, name } = req.body

    const program = await prisma.loyaltyProgram.findFirst({
      where: { businessId: req.user!.businessId },
    })
    if (!program) return res.status(400).json({ error: 'Loyalty program not configured' })

    let customer = await prisma.loyaltyCustomer.findFirst({
      where: { businessId: req.user!.businessId, phone },
    })

    if (customer) {
      if (name) await prisma.loyaltyCustomer.update({ where: { id: customer.id }, data: { name } })
    } else {
      customer = await prisma.loyaltyCustomer.create({
        data: { businessId: req.user!.businessId, programId: program.id, phone, name },
      })
    }

    res.json(customer)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Add points (call this when order is paid)
router.post('/points/add', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const { customerId, points, orderId, description } = req.body

    const transaction = await prisma.loyaltyTransaction.create({
      data: {
        customerId,
        type: 'EARN',
        points,
        referenceType: orderId ? 'ORDER' : 'MANUAL',
        referenceId: orderId || null,
        description: description || 'نقاط مكتسبة',
      },
    })

    await prisma.loyaltyCustomer.update({
      where: { id: customerId },
      data: {
        totalPoints: { increment: points },
        totalSpent: { increment: orderId ? points : 0 },
        lastVisit: new Date(),
      },
    })

    res.json(transaction)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Redeem points
router.post('/points/redeem', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const { customerId, points, description } = req.body

    const customer = await prisma.loyaltyCustomer.findUnique({ where: { id: customerId } })
    if (!customer) return res.status(404).json({ error: 'Customer not found' })
    if (customer.totalPoints < points) return res.status(400).json({ error: 'Insufficient points' })

    const transaction = await prisma.loyaltyTransaction.create({
      data: {
        customerId,
        type: 'REDEEM',
        points: -points,
        referenceType: 'MANUAL',
        description: description || 'نقاط مستخدمة',
      },
    })

    await prisma.loyaltyCustomer.update({
      where: { id: customerId },
      data: { totalPoints: { decrement: points } },
    })

    res.json(transaction)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get all loyalty customers
router.get('/customers', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const customers = await prisma.loyaltyCustomer.findMany({
      where: { businessId: req.user!.businessId },
      include: { _count: { select: { transactions: true } } },
      orderBy: { totalPoints: 'desc' },
    })
    res.json(customers)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
