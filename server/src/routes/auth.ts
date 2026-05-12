import { Router, Response } from 'express'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { generateToken, generateRefreshToken, verifyRefreshToken, authenticate, requireRole } from '../middleware/auth'
import { AuthRequest } from '../types'

const router = Router()

router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const { email, password, pin } = req.body

    if (!email && !pin) {
      return res.status(400).json({ error: 'Email or PIN required' })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { business: true },
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    if (password) {
      const valid = await bcrypt.compare(password, user.password)
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' })
    }

    if (pin && user.pin !== pin) {
      return res.status(401).json({ error: 'Invalid PIN' })
    }

    const payload = {
      userId: user.id,
      businessId: user.businessId,
      role: user.role,
      name: user.name,
    }
    const accessToken = generateToken(payload)
    const refreshToken = generateRefreshToken(payload)

    res.json({
      accessToken,
      refreshToken,
      token: accessToken, // backward compat
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        businessId: user.businessId,
      },
      business: user.business,
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const { name, email, password, phone, businessName } = req.body

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return res.status(400).json({ error: 'Email already in use' })

    const hashedPassword = await bcrypt.hash(password, 12)

    const business = await prisma.business.create({
      data: {
        name: businessName || name + "'s Restaurant",
        nameAr: '',
      },
    })

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: 'ADMIN',
        businessId: business.id,
      },
    })

    const token = generateToken({
      userId: user.id,
      businessId: business.id,
      role: user.role,
      name: user.name,
    })

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      business,
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/refresh', async (req: AuthRequest, res: Response) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' })

    const decoded = verifyRefreshToken(refreshToken)
    const prisma: PrismaClient = req.app.get('prisma')

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { business: true },
    })
    if (!user || !user.isActive) return res.status(401).json({ error: 'User not found' })

    const payload = {
      userId: user.id,
      businessId: user.businessId,
      role: user.role,
      name: user.name,
    }
    const newAccessToken = generateToken(payload)
    const newRefreshToken = generateRefreshToken(payload)

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    })
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token', code: 'INVALID_REFRESH' })
  }
})

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true, email: true, phone: true, role: true, businessId: true, isActive: true },
    })
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const { name, phone } = req.body
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { name, phone },
    })
    res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/change-password', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const { currentPassword, newPassword } = req.body
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    if (!user) return res.status(404).json({ error: 'User not found' })

    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' })

    const hashedPassword = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })
    res.json({ message: 'Password updated successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
