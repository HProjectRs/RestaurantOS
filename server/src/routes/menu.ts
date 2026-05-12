import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import multer, { FileFilterCallback } from 'multer'
import path from 'path'
import { authenticate, requireRole } from '../middleware/auth'
import { AuthRequest } from '../types'

const storage = multer.diskStorage({
  destination: (_req: any, _file: any, cb: (error: Error | null, destination: string) => void) => {
    const uploadsDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads')
    cb(null, uploadsDir)
  },
  filename: (_req: any, file: any, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, `menu-${uniqueSuffix}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req: any, file: any, cb: FileFilterCallback) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('Only images allowed (jpg, jpeg, png, webp, gif)'))
    }
  },
})

const router = Router()

// Get all categories with items (public - for customer view)
router.get('/categories', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const businessId = req.query.businessId as string
    if (!businessId) return res.status(400).json({ error: 'businessId required' })

    const categories = await prisma.menuCategory.findMany({
      where: { businessId, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        items: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            modifiers: {
              include: { options: { orderBy: { sortOrder: 'asc' } } },
            },
          },
        },
      },
    })
    res.json(categories)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// CRUD Categories (admin)
router.post('/categories', authenticate, requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const { name, nameAr, description, sortOrder } = req.body
    const category = await prisma.menuCategory.create({
      data: { name, nameAr, description, sortOrder, businessId: req.user!.businessId },
    })
    res.status(201).json(category)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/categories/:id', authenticate, requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const category = await prisma.menuCategory.update({
      where: { id: req.params.id },
      data: req.body,
    })
    res.json(category)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/categories/:id', authenticate, requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    await prisma.menuCategory.delete({ where: { id: req.params.id } })
    res.json({ message: 'Category deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// CRUD Menu Items
router.post('/items', authenticate, requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const item = await prisma.menuItem.create({
      data: { ...req.body, categoryId: req.body.categoryId },
    })
    res.status(201).json(item)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/items/:id', authenticate, requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const item = await prisma.menuItem.update({
      where: { id: req.params.id },
      data: req.body,
    })
    res.json(item)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/items/:id', authenticate, requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    await prisma.menuItem.delete({ where: { id: req.params.id } })
    res.json({ message: 'Item deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.patch('/items/:id/toggle', authenticate, requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const item = await prisma.menuItem.findUnique({ where: { id: req.params.id } })
    if (!item) return res.status(404).json({ error: 'Item not found' })
    const updated = await prisma.menuItem.update({
      where: { id: req.params.id },
      data: { isAvailable: !item.isAvailable },
    })
    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Image upload
router.post('/items/:id/image', authenticate, requireRole('ADMIN', 'MANAGER'), (req: AuthRequest, res: Response) => {
  upload.single('image')(req, res, async (err: any) => {
    if (err) {
      return res.status(400).json({ error: err.message })
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' })
    }

    try {
      const prisma: PrismaClient = req.app.get('prisma')
      const imageUrl = `/api/uploads/${req.file.filename}`
      const item = await prisma.menuItem.update({
        where: { id: req.params.id },
        data: { image: imageUrl },
      })
      res.json(item)
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' })
    }
  })
})

// Modifiers
router.post('/items/:id/modifiers', authenticate, requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const modifier = await prisma.menuModifier.create({
      data: { ...req.body, menuItemId: req.params.id },
      include: { options: true },
    })
    res.status(201).json(modifier)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/modifiers/:id', authenticate, requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const modifier = await prisma.menuModifier.update({
      where: { id: req.params.id },
      data: req.body,
      include: { options: true },
    })
    res.json(modifier)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/modifiers/:id', authenticate, requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    await prisma.menuModifier.delete({ where: { id: req.params.id } })
    res.json({ message: 'Modifier deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
