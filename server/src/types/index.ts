import { Request } from 'express'

export interface AuthPayload {
  userId: string
  businessId: string
  role: string
  name: string
}

export interface AuthRequest extends Request {
  user?: AuthPayload
  file?: Express.Multer.File
}

export interface SocketUser {
  userId: string
  businessId: string
  role: string
}
