import { Response, NextFunction } from 'express'
import { AuthRequest } from '../types'

function sanitizeValue(value: any): any {
  if (typeof value === 'string') {
    return value
      .replace(/</g, '&#60;')
      .replace(/>/g, '&#62;')
      .replace(/"/g, '&#34;')
      .replace(/'/g, '&#39;')
      .replace(/&(?!amp;|lt;|gt;|#34;|#39;|quot;)/g, '&amp;')
  }
  if (Array.isArray(value)) return value.map(sanitizeValue)
  if (value && typeof value === 'object') return sanitizeObject(value)
  return value
}

function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeValue(value)
  }
  return sanitized
}

export function sanitizeInput(req: AuthRequest, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    req.body = sanitizeObject(req.body)
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query as Record<string, any>)
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params)
  }
  next()
}

export function sanitizeHtml(dirty: string): string {
  return dirty
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}
