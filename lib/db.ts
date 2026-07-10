import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

let dbUrl = "file:./dev.db"

if (process.env.VERCEL) {
  const tmpDbPath = '/tmp/dev.db'
  // Only copy if it doesn't exist to preserve writes during this cold start
  if (!fs.existsSync(tmpDbPath)) {
    const bundledDbPath = path.join(process.cwd(), 'prisma', 'dev.db')
    if (fs.existsSync(bundledDbPath)) {
      fs.copyFileSync(bundledDbPath, tmpDbPath)
    }
  }
  dbUrl = "file:/tmp/dev.db"
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
