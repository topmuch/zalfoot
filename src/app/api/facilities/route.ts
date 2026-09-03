import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthAdmin } from '@/lib/auth'

const VALID_TYPES = new Set([
  'FOOTBALL',
  'TENNIS',
  'BASKETBALL',
  'PADEL',
  'GYM',
  'PISCINE',
  'MULTISPORT',
])

/** GET /api/facilities — liste publique des installations. */
export async function GET() {
  const facilities = await db.facility.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
  })
  return Response.json(facilities)
}

/** POST /api/facilities — ajouter une installation (super admin requis). */
export async function POST(request: NextRequest) {
  const auth = await getAuthAdmin(request)
  if (!auth) {
    return Response.json({ error: 'Non authentifié.' }, { status: 401 })
  }
  if (auth.role !== 'SUPER_ADMIN') {
    return Response.json(
      { error: 'Seul un super administrateur peut ajouter des installations.' },
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
  const typeInput = typeof body.type === 'string' ? body.type.toUpperCase() : ''
  const description =
    typeof body.description === 'string' && body.description.trim() ? body.description.trim() : null
  const pricePerHour = Number(body.pricePerHour)
  const capacity = Number(body.capacity)

  if (name.length < 3) {
    return Response.json({ error: 'Le nom est requis (3 caractères minimum).' }, { status: 400 })
  }
  if (!VALID_TYPES.has(typeInput)) {
    return Response.json({ error: 'Type d’installation invalide.' }, { status: 400 })
  }
  if (!Number.isFinite(pricePerHour) || pricePerHour < 0) {
    return Response.json({ error: 'Tarif horaire invalide.' }, { status: 400 })
  }
  if (!Number.isInteger(capacity) || capacity < 1) {
    return Response.json({ error: 'Capacité invalide (entier positif).' }, { status: 400 })
  }

  try {
    const facility = await db.facility.create({
      data: { name, type: typeInput, description, pricePerHour, capacity },
    })
    return Response.json({ facility }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return Response.json({ error: `Création impossible : ${message}` }, { status: 500 })
  }
}
