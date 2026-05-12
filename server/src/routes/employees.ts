import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { authenticate, requireRole } from '../middleware/auth'
import { AuthRequest } from '../types'

const router = Router()

/**
 * GET /api/employees
 * Get all employees for the current business with shift and salary info.
 * @returns {Array<{id, name, email, phone, role, isActive, shiftId, shift, salary, salaryPeriod, createdAt}>}
 */
router.get('/', authenticate, requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const employees = await prisma.user.findMany({
      where: { businessId: req.user!.businessId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        shiftId: true,
        shift: true,
        salary: true,
        salaryPeriod: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    })
    res.json(employees)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * POST /api/employees
 * Create a new employee user.
 * @body {name, email, password?, phone, role?, pin?, shiftId?, salary?, salaryPeriod?}
 * @returns 201 {id, name, email, phone, role, isActive}
 * @throws 400 if email already in use
 */
router.post('/', authenticate, requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const { name, email, password, phone, role, pin, shiftId, salary, salaryPeriod } = req.body

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return res.status(400).json({ error: 'Email already in use' })

    const hashedPassword = password ? await bcrypt.hash(password, 12) : ''

    const employee = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: role || 'WAITER',
        pin,
        shiftId,
        salary: salary || 0,
        salaryPeriod: salaryPeriod || 'MONTHLY',
        businessId: req.user!.businessId,
      },
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true },
    })

    res.status(201).json(employee)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * PUT /api/employees/:id
 * Update an employee's details.
 * @body {name?, phone?, role?, pin?, shiftId?, isActive?}
 * @returns {id, name, email, phone, role, isActive}
 */
router.put('/:id', authenticate, requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const { name, phone, role, pin, shiftId, isActive } = req.body
    const data: any = {}
    if (name !== undefined) data.name = name
    if (phone !== undefined) data.phone = phone
    if (role !== undefined) data.role = role
    if (pin !== undefined) data.pin = pin
    if (shiftId !== undefined) data.shiftId = shiftId
    if (isActive !== undefined) data.isActive = isActive

    const employee = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true },
    })
    res.json(employee)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * DELETE /api/employees/:id
 * Soft-delete an employee (sets isActive to false).
 * @returns {message: string}
 */
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: false },
    })
    res.json({ message: 'Employee deactivated' })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * GET /api/employees/shifts
 * Get all shifts for the current business with user count.
 * @returns {Array<Shift & {_count: {users: number}}>}
 */
router.get('/shifts', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const shifts = await prisma.shift.findMany({
      where: { businessId: req.user!.businessId },
      include: { _count: { select: { users: true } } },
    })
    res.json(shifts)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * POST /api/employees/shifts
 * Create a new shift.
 * @body {name, startTime, endTime, days}
 * @returns 201 {Shift}
 */
router.post('/shifts', authenticate, requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const shift = await prisma.shift.create({
      data: { ...req.body, businessId: req.user!.businessId },
    })
    res.status(201).json(shift)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * PUT /api/employees/shifts/:id
 * Update a shift.
 * @body {name?, startTime?, endTime?, days?}
 * @returns {Shift}
 */
router.put('/shifts/:id', authenticate, requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const shift = await prisma.shift.update({
      where: { id: req.params.id },
      data: req.body,
    })
    res.json(shift)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * DELETE /api/employees/shifts/:id
 * Delete a shift by ID.
 * @returns {message: string}
 */
router.delete('/shifts/:id', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    await prisma.shift.delete({ where: { id: req.params.id } })
    res.json({ message: 'Shift deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * PUT /api/employees/:id/salary
 * Update an employee's salary information.
 * @body {salary: number, salaryPeriod: 'MONTHLY'|'WEEKLY'|'DAILY'}
 * @returns {id, name, salary, salaryPeriod}
 */
router.put('/:id/salary', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const { salary, salaryPeriod } = req.body
    const employee = await prisma.user.update({
      where: { id: req.params.id },
      data: { salary, salaryPeriod },
      select: { id: true, name: true, salary: true, salaryPeriod: true },
    })
    res.json(employee)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * GET /api/employees/payroll
 * Get payroll report with salary info and this month's order stats.
 * @returns {Array<{id, name, role, salary, salaryPeriod, thisMonthOrders, thisMonthSales}>}
 */
router.get('/payroll', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const businessId = req.user!.businessId

    const employees = await prisma.user.findMany({
      where: { businessId, isActive: true },
      select: {
        id: true,
        name: true,
        role: true,
        salary: true,
        salaryPeriod: true,
        orders: {
          where: {
            createdAt: { gte: new Date(new Date().setDate(1)) },
          },
          select: { total: true },
        },
      },
    })

    const payrollData = employees.map(emp => ({
      id: emp.id,
      name: emp.name,
      role: emp.role,
      salary: emp.salary,
      salaryPeriod: emp.salaryPeriod,
      thisMonthOrders: emp.orders.length,
      thisMonthSales: emp.orders.reduce((s, o) => s + o.total, 0),
    }))

    res.json(payrollData)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * POST /api/employees/clock-in
 * Record a clock-in for the authenticated employee.
 * @returns {Attendance} created attendance record
 */
router.post('/clock-in', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const record = await prisma.attendance.create({
      data: {
        userId: req.user!.userId,
        businessId: req.user!.businessId,
        clockIn: new Date(),
        date: new Date().toISOString().slice(0, 10),
      },
    })
    res.json(record)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * POST /api/employees/clock-out
 * Record a clock-out for the authenticated employee.
 * @returns {Attendance} updated attendance record with clockOut time
 * @throws 404 if no active clock-in found
 */
router.post('/clock-out', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const today = new Date().toISOString().slice(0, 10)
    const record = await prisma.attendance.findFirst({
      where: { userId: req.user!.userId, date: today, clockOut: null },
    })
    if (!record) return res.status(404).json({ error: 'No active clock-in found' })

    const updated = await prisma.attendance.update({
      where: { id: record.id },
      data: { clockOut: new Date() },
    })
    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * GET /api/employees/attendance
 * Get attendance records with optional filters.
 * @query {from?: string, to?: string, userId?: string}
 * @returns {Array<Attendance & {user: {id, name, role}}>}
 */
router.get('/attendance', authenticate, requireRole('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const { from, to, userId } = req.query

    const where: any = { businessId: req.user!.businessId }
    if (userId) where.userId = userId as string
    if (from || to) {
      where.date = {}
      if (from) where.date.gte = from as string
      if (to) where.date.lte = to as string
    }

    const records = await prisma.attendance.findMany({
      where,
      include: { user: { select: { id: true, name: true, role: true } } },
      orderBy: { date: 'desc' },
    })
    res.json(records)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
