import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireRole } from '../middleware/auth'
import { AuthRequest } from '../types'

const router = Router()

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const expenses = await prisma.expense.findMany({
      where: { businessId: req.user!.businessId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    res.json(expenses)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', authenticate, requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const expense = await prisma.expense.create({
      data: {
        businessId: req.user!.businessId,
        description: req.body.description,
        amount: req.body.amount,
        category: req.body.category || 'أخرى',
        notes: req.body.notes || null,
        date: req.body.date || new Date().toISOString(),
      },
    })
    res.status(201).json(expense)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/:id', authenticate, requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: req.body,
    })
    res.json(expense)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', authenticate, requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    await prisma.expense.delete({ where: { id: req.params.id } })
    res.json({ message: 'Expense deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
