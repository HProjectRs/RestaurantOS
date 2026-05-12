import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { authenticate, requireRole } from '../middleware/auth'
import { AuthRequest } from '../types'

const router = Router()
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '..', '..', 'backups')

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// List backups
router.get('/', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const logs = await prisma.backupLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.db') || f.endsWith('.sqlite'))
      .map(f => {
        const stat = fs.statSync(path.join(BACKUP_DIR, f))
        return {
          fileName: f,
          fileSize: stat.size,
          fileSizeFormatted: formatSize(stat.size),
          createdAt: stat.mtime,
        }
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    res.json({ files, logs })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create backup
router.post('/', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const isPostgres = (process.env.DATABASE_URL || '').startsWith('postgresql')

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `restaurantos-backup-${timestamp}.db`
    const filePath = path.join(BACKUP_DIR, fileName)

    if (isPostgres) {
      const dbUrl = new URL(process.env.DATABASE_URL!)
      exec(`pg_dump -h ${dbUrl.hostname} -p ${dbUrl.port || '5432'} -U ${dbUrl.username} -d ${dbUrl.pathname.slice(1)} -F c -f "${filePath}"`, {
        env: { ...process.env, PGPASSWORD: dbUrl.password },
      }, async (error) => {
        if (error) {
          await prisma.backupLog.create({
            data: { fileName, fileSize: 0, status: 'FAILED', notes: error.message },
          })
          return res.status(500).json({ error: 'Backup failed' })
        }
        const stat = fs.statSync(filePath)
        await prisma.backupLog.create({
          data: { fileName, fileSize: stat.size, status: 'SUCCESS' },
        })
        res.json({ fileName, fileSize: stat.size, message: 'Backup created successfully' })
      })
    } else {
      // SQLite backup - simple file copy
      const dbPath = path.join(__dirname, '..', '..', 'prisma', 'dev.db')
      fs.copyFileSync(dbPath, filePath)
      const stat = fs.statSync(filePath)
      await prisma.backupLog.create({
        data: { fileName, fileSize: stat.size, status: 'SUCCESS' },
      })
      res.json({ fileName, fileSize: stat.size, message: 'Backup created successfully' })
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Restore backup
router.post('/restore', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { fileName } = req.body
    if (!fileName) return res.status(400).json({ error: 'fileName required' })

    const filePath = path.join(BACKUP_DIR, fileName)
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Backup file not found' })

    const dbPath = path.join(__dirname, '..', '..', 'prisma', 'dev.db')
    fs.copyFileSync(filePath, dbPath)

    const prisma: PrismaClient = req.app.get('prisma')
    await prisma.backupLog.create({
      data: { fileName: `restore-${fileName}`, fileSize: 0, status: 'SUCCESS', notes: 'Restored from backup' },
    })

    res.json({ message: 'Backup restored successfully. Please restart the server.' })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Auto-backup settings
router.get('/settings', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma')
    const business = await prisma.business.findUnique({
      where: { id: req.user!.businessId },
      select: { id: true },
    })
    if (!business) return res.status(404).json({ error: 'Business not found' })
    res.json({ autoBackupEnabled: true, intervalHours: 24, backupDir: BACKUP_DIR })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
