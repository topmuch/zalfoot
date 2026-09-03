import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto'
import { db } from '@/lib/db'
import { NextRequest } from 'next/server'

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7 // 7 jours

/** Hache un mot de passe avec scrypt (salt aléatoire). Format : "salt:hash" */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

/** Vérifie un mot de passe contre son hash stocké. */
export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(':')
    if (!salt || !hash) return false
    const hashBuffer = Buffer.from(hash, 'hex')
    const candidate = scryptSync(password, salt, 64)
    return hashBuffer.length === candidate.length && timingSafeEqual(hashBuffer, candidate)
  } catch {
    return false
  }
}

/** Crée une session et renvoie le token. */
export async function createSession(adminId: string): Promise<string> {
  const token = randomBytes(32).toString('hex')
  await db.session.create({
    data: {
      token,
      adminId,
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
    },
  })
  return token
}

/** Supprime la session associée à un token. */
export async function deleteSession(token: string): Promise<void> {
  await db.session.deleteMany({ where: { token } })
}

export type AuthAdmin = {
  id: string
  name: string
  email: string
  role: string
  phone: string | null
  active: boolean
  createdAt: Date
}

/** Récupère l'admin authentifié depuis l'en-tête Authorization: Bearer <token>. */
export async function getAuthAdmin(request: NextRequest): Promise<AuthAdmin | null> {
  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  if (!token) return null

  const session = await db.session.findUnique({
    where: { token },
    include: { admin: true },
  })
  if (!session) return null
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {})
    return null
  }
  if (!session.admin.active) return null

  return session.admin
}

/** Réponse 401 standardisée. */
export function unauthorizedResponse() {
  return Response.json({ error: 'Non authentifié. Veuillez vous reconnecter.' }, { status: 401 })
}

/** Couleur déterministe (utile pour avatars). */
export function stringHue(input: string): number {
  return parseInt(createHash('md5').update(input).digest('hex').slice(0, 4), 16) % 360
}
