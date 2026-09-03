import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { createSession, verifyPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body?.password === 'string' ? body.password : ''

    if (!email || !password) {
      return Response.json({ error: 'E-mail et mot de passe requis.' }, { status: 400 })
    }

    const admin = await db.admin.findUnique({ where: { email } })
    if (!admin || !verifyPassword(password, admin.passwordHash)) {
      return Response.json({ error: 'Identifiants incorrects.' }, { status: 401 })
    }
    if (!admin.active) {
      return Response.json(
        { error: 'Ce compte est désactivé. Contactez un super administrateur.' },
        { status: 403 },
      )
    }

    const token = await createSession(admin.id)

    return Response.json({
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        phone: admin.phone,
        active: admin.active,
        createdAt: admin.createdAt,
      },
    })
  } catch {
    return Response.json({ error: 'Erreur serveur lors de la connexion.' }, { status: 500 })
  }
}
