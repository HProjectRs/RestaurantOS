import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AuthRequest, AuthPayload } from '../types'

const JWT_SECRET = process.env.JWT_SECRET
const REFRESH_SECRET = process.env.REFRESH_SECRET

if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set')
  process.exit(1)
}
if (!REFRESH_SECRET) {
  console.error('FATAL: REFRESH_SECRET environment variable is not set')
  process.exit(1)
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided', code: 'NO_TOKEN' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload
    req.user = decoded
    next()
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' })
    }
    return res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' })
  }
}

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    next()
  }
}

export const generateToken = (payload: AuthPayload): string => {
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d'
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions)
}

export const generateRefreshToken = (payload: AuthPayload): string => {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' })
}

export const verifyRefreshToken = (token: string): AuthPayload => {
  return jwt.verify(token, REFRESH_SECRET) as AuthPayload
}
