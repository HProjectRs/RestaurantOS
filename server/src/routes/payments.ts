import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/auth'
import { AuthRequest } from '../types'

const router = Router()

function getStripe() {
  const Stripe = require('stripe')
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  return new Stripe(key)
}

// Create payment intent for an order
router.post('/create-intent', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const { orderId } = req.body

    const order = await prisma.order.findFirst({
      where: { id: orderId, businessId: req.user!.businessId },
    })

    if (!order) return res.status(404).json({ error: 'Order not found' })
    if (order.paymentStatus === 'PAID') return res.status(400).json({ error: 'Order already paid' })

    const stripe = getStripe()
    if (!stripe) return res.status(400).json({ error: 'Stripe not configured. Set STRIPE_SECRET_KEY in .env' })

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100), // cents
      currency: 'dzd',
      metadata: { orderId: order.id, orderNumber: order.orderNumber, businessId: req.user!.businessId },
    })

    res.json({ clientSecret: paymentIntent.client_secret })
  } catch (error) {
    console.error('Create payment intent error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Stripe webhook (no auth - uses Stripe signature)
router.post('/webhook', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const io: any = req.app.get('io')
    const stripe = getStripe()
    if (!stripe) return res.status(400).json({ error: 'Stripe not configured' })

    const sig = req.headers['stripe-signature'] as string
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

    let event
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object
      const { orderId, businessId } = paymentIntent.metadata

      if (orderId && businessId) {
        const order = await prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: 'PAID', paymentMethod: 'CARD' },
          include: { items: { include: { menuItem: true } }, table: true },
        })

        io.to(`business:${businessId}`).emit('order:paymentUpdate', order)
      }
    }

    res.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get Stripe publishable key
router.get('/config', async (req: AuthRequest, res: Response) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  })
})

export default router
