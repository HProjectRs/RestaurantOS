import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireRole } from '../middleware/auth'
import { AuthRequest } from '../types'

const router = Router()

router.get('/dashboard', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const businessId = req.user!.businessId
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayEnd = new Date(today)
    todayEnd.setHours(23, 59, 59, 999)

    const [
      todayOrders,
      todayRevenue,
      pendingOrders,
      activeTables,
      totalItems,
      totalCategories,
      recentOrders,
      topItems,
    ] = await Promise.all([
      prisma.order.count({
        where: { businessId, createdAt: { gte: today, lte: todayEnd } },
      }),
      prisma.order.aggregate({
        where: { businessId, createdAt: { gte: today, lte: todayEnd }, paymentStatus: 'PAID' },
        _sum: { total: true },
      }),
      prisma.order.count({
        where: { businessId, status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] } },
      }),
      prisma.table.count({
        where: { businessId, status: 'OCCUPIED' },
      }),
      prisma.menuItem.count({
        where: { category: { businessId }, isActive: true },
      }),
      prisma.menuCategory.count({
        where: { businessId, isActive: true },
      }),
      prisma.order.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          items: { include: { menuItem: true } },
          table: true,
        },
      }),
      prisma.orderItem.groupBy({
        by: ['menuItemId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
      }),
    ])

    // Get top item names
    const itemIds = topItems.map(i => i.menuItemId)
    const items = await prisma.menuItem.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, name: true, nameAr: true },
    })
    const itemMap = new Map(items.map(i => [i.id, i]))
    const topSellingItems = topItems.map(i => ({
      ...i,
      menuItem: itemMap.get(i.menuItemId),
    }))

    res.json({
      todayOrders,
      todayRevenue: todayRevenue._sum.total || 0,
      pendingOrders,
      activeTables,
      totalItems,
      totalCategories,
      recentOrders,
      topSellingItems,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/sales', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const businessId = req.user!.businessId
    const { from, to, groupBy } = req.query

    const dateFrom = from ? new Date(from as string) : new Date(new Date().setDate(new Date().getDate() - 30))
    const dateTo = to ? new Date(to as string) : new Date()

    const orders = await prisma.order.findMany({
      where: {
        businessId,
        createdAt: { gte: dateFrom, lte: dateTo },
        paymentStatus: 'PAID',
      },
      orderBy: { createdAt: 'asc' },
    })

    // Group by day, week, or month
    const grouped: Record<string, { count: number; total: number; orders: number[] }> = {}
    for (const order of orders) {
      let key: string
      const d = new Date(order.createdAt)
      if (groupBy === 'month') {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      } else if (groupBy === 'week') {
        const startOfWeek = new Date(d)
        startOfWeek.setDate(d.getDate() - d.getDay())
        key = startOfWeek.toISOString().slice(0, 10)
      } else {
        key = d.toISOString().slice(0, 10)
      }

      if (!grouped[key]) grouped[key] = { count: 0, total: 0, orders: [] }
      grouped[key].count++
      grouped[key].total += order.total
      grouped[key].orders.push(order.orderNumber)
    }

    const salesData = Object.entries(grouped).map(([date, data]) => ({
      date,
      count: data.count,
      total: data.total,
    })).sort((a, b) => a.date.localeCompare(b.date))

    res.json(salesData)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/categories', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const businessId = req.user!.businessId
    const { from, to } = req.query

    const dateFrom = from ? new Date(from as string) : new Date(0)
    const dateTo = to ? new Date(to as string) : new Date()

    const categories = await prisma.menuCategory.findMany({
      where: { businessId, isActive: true },
      include: {
        items: {
          include: {
            orderItems: {
              where: {
                order: {
                  createdAt: { gte: dateFrom, lte: dateTo },
                  paymentStatus: 'PAID',
                },
              },
            },
          },
        },
      },
    })

    const categoryData = categories.map(cat => {
      const totalSold = cat.items.reduce((sum, item) => {
        return sum + item.orderItems.reduce((s, oi) => s + oi.quantity, 0)
      }, 0)
      const revenue = cat.items.reduce((sum, item) => {
        return sum + item.orderItems.reduce((s, oi) => s + oi.price * oi.quantity, 0)
      }, 0)
      return {
        id: cat.id,
        name: cat.name,
        nameAr: cat.nameAr,
        totalSold,
        revenue,
      }
    })

    res.json(categoryData)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/employees', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const businessId = req.user!.businessId
    const { from, to } = req.query

    const dateFrom = from ? new Date(from as string) : new Date(0)
    const dateTo = to ? new Date(to as string) : new Date()

    const employees = await prisma.user.findMany({
      where: { businessId, isActive: true, role: { not: 'ADMIN' } },
      select: {
        id: true,
        name: true,
        role: true,
        orders: {
          where: { createdAt: { gte: dateFrom, lte: dateTo } },
          select: { id: true, total: true },
        },
      },
    })

    const employeeData = employees.map(emp => ({
      id: emp.id,
      name: emp.name,
      role: emp.role,
      orderCount: emp.orders.length,
      totalSales: emp.orders.reduce((sum, o) => sum + o.total, 0),
    }))

    res.json(employeeData)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Advanced: Item performance with time analysis
router.get('/items-performance', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const businessId = req.user!.businessId
    const { from, to } = req.query

    const dateFrom = from ? new Date(from as string) : new Date(new Date().setDate(new Date().getDate() - 30))
    const dateTo = to ? new Date(to as string) : new Date()

    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          businessId,
          createdAt: { gte: dateFrom, lte: dateTo },
          paymentStatus: 'PAID',
        },
      },
      include: {
        menuItem: { select: { id: true, name: true, nameAr: true, price: true } },
        order: { select: { createdAt: true } },
      },
    })

    // Aggregate by item
    const itemMap: Record<string, { name: string; nameAr: string; quantity: number; revenue: number; orders: number; hourly: number[] }> = {}
    for (const oi of orderItems) {
      const id = oi.menuItemId
      if (!itemMap[id]) {
        itemMap[id] = {
          name: oi.menuItem.name,
          nameAr: oi.menuItem.nameAr || '',
          quantity: 0,
          revenue: 0,
          orders: 0,
          hourly: new Array(24).fill(0),
        }
      }
      itemMap[id].quantity += oi.quantity
      itemMap[id].revenue += oi.price * oi.quantity
      itemMap[id].orders++
      const hour = new Date(oi.order.createdAt).getHours()
      itemMap[id].hourly[hour]++
    }

    const items = Object.entries(itemMap).map(([id, data]) => ({
      id,
      ...data,
      avgPerOrder: data.orders > 0 ? data.quantity / data.orders : 0,
    })).sort((a, b) => b.quantity - a.quantity)

    res.json(items)
  } catch (error) {
    console.error('Items performance error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Advanced: Peak hours analysis
router.get('/peak-hours', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const businessId = req.user!.businessId
    const { from, to } = req.query

    const dateFrom = from ? new Date(from as string) : new Date(new Date().setDate(new Date().getDate() - 30))
    const dateTo = to ? new Date(to as string) : new Date()

    const orders = await prisma.order.findMany({
      where: {
        businessId,
        createdAt: { gte: dateFrom, lte: dateTo },
      },
      select: { createdAt: true, total: true },
    })

    const hourly: { hour: number; count: number; revenue: number }[] = []
    for (let h = 0; h < 24; h++) {
      hourly.push({ hour: h, count: 0, revenue: 0 })
    }

    for (const order of orders) {
      const hour = new Date(order.createdAt).getHours()
      hourly[hour].count++
      hourly[hour].revenue += order.total
    }

    const dow: { day: number; count: number; revenue: number }[] = []
    for (let d = 0; d < 7; d++) {
      dow.push({ day: d, count: 0, revenue: 0 })
    }

    for (const order of orders) {
      const day = new Date(order.createdAt).getDay()
      dow[day].count++
      dow[day].revenue += order.total
    }

    res.json({ hourly, dow })
  } catch (error) {
    console.error('Peak hours error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Advanced: Payment method breakdown
router.get('/payment-methods', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const businessId = req.user!.businessId
    const { from, to } = req.query

    const dateFrom = from ? new Date(from as string) : new Date(0)
    const dateTo = to ? new Date(to as string) : new Date()

    const orders = await prisma.order.findMany({
      where: {
        businessId,
        paymentStatus: 'PAID',
        createdAt: { gte: dateFrom, lte: dateTo },
      },
      select: { paymentMethod: true, total: true },
    })

    const methods: Record<string, { count: number; revenue: number }> = {}
    for (const order of orders) {
      const method = order.paymentMethod || 'UNKNOWN'
      if (!methods[method]) methods[method] = { count: 0, revenue: 0 }
      methods[method].count++
      methods[method].revenue += order.total
    }

    res.json(methods)
  } catch (error) {
    console.error('Payment methods error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
