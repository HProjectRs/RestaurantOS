import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { Server as SocketIOServer } from 'socket.io'
import { authenticate, requireRole } from '../middleware/auth'
import { AuthRequest } from '../types'

const router = Router()

function generateOrderNumber(): number {
  return parseInt(Date.now().toString().slice(-6)) + Math.floor(Math.random() * 100)
}

// Create order (public for online, auth for staff)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const io: SocketIOServer = req.app.get('io')
    const { items, tableId, customerName, customerPhone, type, notes } = req.body

    const businessId = req.user?.businessId || req.body.businessId
    if (!businessId) return res.status(400).json({ error: 'businessId required' })

    let subtotal = 0
    const orderItemsData = []

    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({ where: { id: item.menuItemId } })
      if (!menuItem || !menuItem.isAvailable) {
        return res.status(400).json({ error: `Item ${item.menuItemId} not available` })
      }
      const itemPrice = menuItem.discountPrice || menuItem.price
      subtotal += itemPrice * item.quantity
      orderItemsData.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: itemPrice,
        notes: item.notes || null,
        selectedModifiers: item.selectedModifiers || {},
        sortOrder: item.sortOrder || 0,
      })
    }

    const settings = await prisma.business.findUnique({ where: { id: businessId } })
    const tax = subtotal * (settings ? settings.taxRate / 100 : 0.15)
    const serviceCharge = type === 'DINE_IN' ? subtotal * (settings ? settings.serviceChargeRate / 100 : 0.1) : 0
    const total = subtotal + tax + serviceCharge

    const orderNumber = generateOrderNumber()

    const order = await prisma.order.create({
      data: {
        businessId,
        orderNumber,
        tableId: tableId || null,
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        type: type || 'DINE_IN',
        subtotal,
        tax,
        serviceCharge,
        total,
        notes: notes || null,
        isOnlineOrder: !req.user,
        cashierId: req.user?.userId || null,
        items: { create: orderItemsData },
      },
      include: {
        items: { include: { menuItem: true } },
        table: true,
      },
    })

    // Update table status if dine-in
    if (tableId) {
      await prisma.table.update({
        where: { id: tableId },
        data: { status: 'OCCUPIED' },
      })
    }

    // Emit socket event for kitchen display
    io.to(`business:${businessId}`).emit('order:new', order)

    res.status(201).json(order)
  } catch (error) {
    console.error('Create order error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get orders (with filters)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const { status, type, dateFrom, dateTo, limit } = req.query

    const where: any = { businessId: req.user!.businessId }
    if (status) {
      const statuses = (status as string).split(',').map(s => s.trim()).filter(Boolean)
      where.status = statuses.length > 1 ? { in: statuses } : statuses[0]
    }
    if (type) where.type = type as string
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom as string)
      if (dateTo) where.createdAt.lte = new Date(dateTo as string)
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit as string) : 100,
      include: {
        items: { include: { menuItem: true } },
        table: true,
        cashier: { select: { id: true, name: true } },
      },
    })
    res.json(orders)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get single order
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, businessId: req.user!.businessId },
      include: {
        items: { include: { menuItem: true } },
        table: true,
        cashier: { select: { id: true, name: true } },
      },
    })
    if (!order) return res.status(404).json({ error: 'Order not found' })
    res.json(order)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update order status
router.patch('/:id/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const io: SocketIOServer = req.app.get('io')
    const { status } = req.body

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        items: { include: { menuItem: true } },
        table: true,
      },
    })

    // If order is delivered, free the table
    if (status === 'DELIVERED' && order.tableId) {
      // Check if table has other active orders
      const activeOrders = await prisma.order.count({
        where: { tableId: order.tableId, status: { notIn: ['DELIVERED', 'CANCELLED'] } },
      })
      if (activeOrders === 0) {
        await prisma.table.update({
          where: { id: order.tableId! },
          data: { status: 'AVAILABLE' },
        })
      }
    }

    io.to(`business:${order.businessId}`).emit('order:statusUpdate', order)
    res.json(order)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update item status within order (for kitchen)
router.patch('/:orderId/items/:itemId/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const io: SocketIOServer = req.app.get('io')
    const { status } = req.body

    const item = await prisma.orderItem.update({
      where: { id: req.params.itemId },
      data: { status },
      include: { menuItem: true },
    })

    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
      include: {
        items: { include: { menuItem: true } },
        table: true,
      },
    })

    if (order) {
      io.to(`business:${order.businessId}`).emit('order:itemStatusUpdate', {
        orderId: order.id,
        item,
        order,
      })
    }

    res.json(item)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update payment
router.patch('/:id/payment', authenticate, requireRole('ADMIN', 'MANAGER', 'CASHIER'), async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const io: SocketIOServer = req.app.get('io')
    const { paymentStatus, paymentMethod } = req.body

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { paymentStatus, paymentMethod },
      include: {
        items: { include: { menuItem: true } },
        table: true,
      },
    })

    // Free table when paid
    if (paymentStatus === 'PAID' && order.tableId) {
      const activeOrders = await prisma.order.count({
        where: { tableId: order.tableId, status: { notIn: ['DELIVERED', 'CANCELLED'] } },
      })
      if (activeOrders === 0) {
        await prisma.table.update({
          where: { id: order.tableId! },
          data: { status: 'AVAILABLE' },
        })
      }
    }

    io.to(`business:${order.businessId}`).emit('order:paymentUpdate', order)
    res.json(order)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Cancel order
router.patch('/:id/cancel', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const io: SocketIOServer = req.app.get('io')

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
      include: { items: { include: { menuItem: true } }, table: true },
    })

    if (order.tableId) {
      await prisma.table.update({
        where: { id: order.tableId },
        data: { status: 'AVAILABLE' },
      })
    }

    io.to(`business:${order.businessId}`).emit('order:cancelled', order)
    res.json(order)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Public: Lookup order by order number (for customer tracking)
router.get('/track/:orderNumber', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const orderNumber = parseInt(req.params.orderNumber)
    const businessId = req.query.businessId as string

    if (!orderNumber) return res.status(400).json({ error: 'Invalid order number' })

    const order = await prisma.order.findFirst({
      where: { orderNumber, businessId },
      include: {
        items: { include: { menuItem: true } },
        table: true,
      },
    })

    if (!order) return res.status(404).json({ error: 'Order not found' })

    res.json(order)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Public: Call waiter from table
router.post('/call-waiter', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const io: SocketIOServer = req.app.get('io')
    const { tableId, businessId, message } = req.body

    const table = tableId ? await prisma.table.findUnique({ where: { id: tableId } }) : null

    const callData = {
      tableId,
      tableNumber: table?.number || 'Unknown',
      message: message || 'طلب نادل',
      timestamp: new Date().toISOString(),
    }

    io.to(`business:${businessId}`).emit('waiter:called', callData)

    res.json({ success: true, callData })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get active (non-delivered/non-cancelled) order for a table
router.get('/active', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const { tableId, businessId } = req.query

    if (!tableId || !businessId) {
      return res.status(400).json({ error: 'tableId and businessId required' })
    }

    const order = await prisma.order.findFirst({
      where: {
        tableId: tableId as string,
        businessId: businessId as string,
        status: { notIn: ['DELIVERED', 'CANCELLED'] },
      },
      include: {
        items: { include: { menuItem: true } },
        table: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json(order)
  } catch (error) {
    console.error('Get active order error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Add items to existing order (for "order more" / continue ordering)
router.post('/:id/items', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const io: SocketIOServer = req.app.get('io')
    const { items } = req.body
    const orderId = req.params.id

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { table: true },
    })
    if (!existingOrder) return res.status(404).json({ error: 'Order not found' })
    if (existingOrder.status === 'DELIVERED' || existingOrder.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Cannot add items to delivered/cancelled order' })
    }

    let additionalSubtotal = 0
    const newItemsData = []

    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({ where: { id: item.menuItemId } })
      if (!menuItem || !menuItem.isAvailable) {
        return res.status(400).json({ error: `Item ${item.menuItemId} not available` })
      }
      const itemPrice = menuItem.discountPrice || menuItem.price
      additionalSubtotal += itemPrice * item.quantity
      newItemsData.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: itemPrice,
        notes: item.notes || null,
        selectedModifiers: item.selectedModifiers || {},
        sortOrder: item.sortOrder || 0,
      })
    }

    const settings = await prisma.business.findUnique({ where: { id: existingOrder.businessId } })
    const tax = additionalSubtotal * (settings ? settings.taxRate / 100 : 0.15)
    const serviceCharge = existingOrder.type === 'DINE_IN' ? additionalSubtotal * (settings ? settings.serviceChargeRate / 100 : 0.1) : 0

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        subtotal: { increment: additionalSubtotal },
        tax: { increment: tax },
        serviceCharge: { increment: serviceCharge },
        total: { increment: additionalSubtotal + tax + serviceCharge },
        items: { create: newItemsData },
        status: 'PENDING',
      },
      include: {
        items: { include: { menuItem: true } },
        table: true,
      },
    })

    // Re-occupy table if it was freed
    if (existingOrder.tableId) {
      await prisma.table.update({
        where: { id: existingOrder.tableId },
        data: { status: 'OCCUPIED' },
      })
    }

    // Emit as a new order update to kitchen
    io.to(`business:${existingOrder.businessId}`).emit('order:statusUpdate', updatedOrder)
    io.to(`business:${existingOrder.businessId}`).emit('kitchen:itemsAdded', {
      orderId,
      items: newItemsData,
      order: updatedOrder,
    })

    res.json(updatedOrder)
  } catch (error) {
    console.error('Add items to order error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Print receipt for an order
router.get('/:id/receipt', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')

    const order = await prisma.order.findFirst({
      where: { id: req.params.id, businessId: req.user!.businessId },
      include: {
        items: { include: { menuItem: true } },
        table: true,
        cashier: { select: { id: true, name: true } },
      },
    })

    if (!order) return res.status(404).json({ error: 'Order not found' })

    const business = await prisma.business.findUnique({ where: { id: req.user!.businessId } })

    const { generateReceiptData } = require('../services/printer')
    const receiptData = generateReceiptData(order, business)

    res.json(receiptData)
  } catch (error) {
    console.error('Receipt error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Split bill: split an order's items into multiple orders
router.post('/:id/split', authenticate, requireRole('ADMIN', 'MANAGER', 'CASHIER'), async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const io: any = req.app.get('io')
    const { splits } = req.body // [{ items: string[] }] - array of item ID groups

    const originalOrder = await prisma.order.findFirst({
      where: { id: req.params.id, businessId: req.user!.businessId },
      include: { items: true, table: true },
    })

    if (!originalOrder) return res.status(404).json({ error: 'Order not found' })
    if (originalOrder.paymentStatus === 'PAID') return res.status(400).json({ error: 'Cannot split a paid order' })

    const newOrders = []
    const movedItemIds: string[] = []

    for (const split of splits) {
      const itemIds = split.items as string[]
      if (!itemIds.length) continue

      const splitItems = originalOrder.items.filter(i => itemIds.includes(i.id))
      if (!splitItems.length) continue

      let splitSubtotal = 0
      for (const item of splitItems) {
        splitSubtotal += item.price * item.quantity
      }

      const settings = await prisma.business.findUnique({ where: { id: req.user!.businessId } })
      const tax = splitSubtotal * (settings ? settings.taxRate / 100 : 0.15)
      const serviceCharge = originalOrder.type === 'DINE_IN' ? splitSubtotal * (settings ? settings.serviceChargeRate / 100 : 0.1) : 0
      const total = splitSubtotal + tax + serviceCharge

      // Update items to new order
      const newOrder = await prisma.order.create({
        data: {
          businessId: originalOrder.businessId,
          orderNumber: generateOrderNumber(),
          tableId: originalOrder.tableId,
          customerName: originalOrder.customerName,
          type: originalOrder.type,
          subtotal: splitSubtotal,
          tax,
          serviceCharge,
          total,
          isOnlineOrder: false,
        },
      })

      // Move items to new order
      await prisma.orderItem.updateMany({
        where: { id: { in: itemIds } },
        data: { orderId: newOrder.id },
      })

      movedItemIds.push(...itemIds)

      const fullOrder = await prisma.order.findUnique({
        where: { id: newOrder.id },
        include: { items: { include: { menuItem: true } }, table: true },
      })

      newOrders.push(fullOrder)
      io.to(`business:${originalOrder.businessId}`).emit('order:new', fullOrder)
    }

    // Remove moved items from original order totals
    const remainingItems = originalOrder.items.filter(i => !movedItemIds.includes(i.id))
    if (remainingItems.length > 0) {
      let remainingSubtotal = 0
      for (const item of remainingItems) {
        remainingSubtotal += item.price * item.quantity
      }
      const settings = await prisma.business.findUnique({ where: { id: req.user!.businessId } })
      const tax = remainingSubtotal * (settings ? settings.taxRate / 100 : 0.15)
      const serviceCharge = originalOrder.type === 'DINE_IN' ? remainingSubtotal * (settings ? settings.serviceChargeRate / 100 : 0.1) : 0

      await prisma.order.update({
        where: { id: originalOrder.id },
        data: {
          subtotal: remainingSubtotal,
          tax,
          serviceCharge,
          total: remainingSubtotal + tax + serviceCharge,
        },
      })
    }

    const updatedOriginal = await prisma.order.findUnique({
      where: { id: originalOrder.id },
      include: { items: { include: { menuItem: true } }, table: true },
    })

    io.to(`business:${originalOrder.businessId}`).emit('order:statusUpdate', updatedOriginal)

    res.json({ original: updatedOriginal, splits: newOrders })
  } catch (error) {
    console.error('Split bill error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Public: Get recent orders by phone (for customer history)
router.get('/customer/:phone', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const { phone } = req.params
    const businessId = req.query.businessId as string

    const orders = await prisma.order.findMany({
      where: { customerPhone: phone, businessId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        items: { include: { menuItem: true } },
        table: true,
      },
    })

    res.json(orders)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
