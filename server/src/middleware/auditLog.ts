import { Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthRequest } from '../types'

export function logAction(action: string, entity: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res)
    res.json = function (body: any) {
      try {
        const prisma: PrismaClient = req.app.get('prisma')
        const entityId = req.params?.id || body?.id || null
        const details = JSON.stringify({
          method: req.method,
          path: req.path,
          body: sanitizeBody(req.body),
          statusCode: res.statusCode,
        })
        prisma.auditLog.create({
          data: {
            businessId: req.user?.businessId || null,
            userId: req.user?.userId || null,
            action,
            entity,
            entityId,
            details,
            ipAddress: req.ip,
          },
        }).catch(() => {})
      } catch {}
      return originalJson(body)
    }
    next()
  }
}

function sanitizeBody(body: any): any {
  if (!body) return {}
  const sanitized = { ...body }
  delete sanitized.password
  delete sanitized.currentPassword
  delete sanitized.newPassword
  delete sanitized.token
  delete sanitized.refreshToken
  return sanitized
}
