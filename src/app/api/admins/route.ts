import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthAdmin, hashPassword, unauthorizedResponse } from '@/lib/auth'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const VALID_ROLES = new Set(['ADMIN', 'SUPER_ADMIN'])

function sanitize(admin: {
  id: string
  name: string
  email: string
  role: string
  phone: string | null
  active: boolean
  createdAt: Date
}) {
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    phone: admin.phone,
    active: admin.active,
    createdAt: admin.createdAt,
  }
}

/** GET /api/admins — liste des administrateurs (auth requis). */
export async function GET(request: NextRequest) {
  const auth = await getAuthAdmin(request)
  if (!auth) return unauthorizedResponse()

  const admins = await db.admin.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      active: true,
      createdAt: true,
    },
  })
  return Response.json(admins)
}

/**
 * POST /api/admins — CRÉATION D'UN ADMINISTRATEUR (super admin uniquement).
 * C'est cette route qui rend le bouton « Créer un administrateur » pleinement fonctionnel :
 * validation complète, hachage scrypt du mot de passe, gestion des doublons d'e-mail.
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthAdmin(request)
  if (!auth) return unauthorizedResponse()

  if (auth.role !== 'SUPER_ADMIN') {
    return Response.json(
      { error: 'Seul un super administrateur peut créer des comptes administrateurs.' },
      { status: 403 },
    )
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Requête invalide (JSON attendu).' }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const phone = typeof body.phone === 'string' && body.phone.trim() ? body.phone.trim() : null
  const role = typeof body.role === 'string' && body.role ? body.role.toUpperCase() : 'ADMIN'
  const password = typeof body.password === 'string' ? body.password : ''

  // ===== Validations =====
  if (name.length < 2) {
    return Response.json({ error: 'Le nom complet est requis (2 caractères minimum).' }, { status: 400 })
  }
  if (!EMAIL_REGEX.test(email)) {
    return Response.json({ error: 'Adresse e-mail invalide.' }, { status: 400 })
  }
  if (password.length < 6) {
    return Response.json(
      { error: 'Le mot de passe doit contenir au moins 6 caractères.' },
      { status: 400 },
    )
  }
  if (!VALID_ROLES.has(role)) {
    return Response.json({ error: 'Rôle invalide (ADMIN ou SUPER_ADMIN).' }, { status: 400 })
  }

  // Doublon d'e-mail
  const existing = await db.admin.findUnique({ where: { email } })
  if (existing) {
    return Response.json(
      { error: `Un administrateur avec l'e-mail « ${email} » existe déjà.` },
      { status: 409 },
    )
  }

  try {
    const admin = await db.admin.create({
      data: {
        name,
        email,
        phone,
        role,
        passwordHash: hashPassword(password),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        active: true,
        createdAt: true,
      },
    })

    return Response.json({ admin: sanitize(admin) }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return Response.json(
      { error: `Impossible de créer l'administrateur : ${message}` },
      { status: 500 },
    )
  }
}
