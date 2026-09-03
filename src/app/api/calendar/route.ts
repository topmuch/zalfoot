import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthAdmin, unauthorizedResponse } from '@/lib/auth'

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/
const VALID_TYPES = new Set(['DISPONIBILITE', 'ENTRAINEMENT', 'MAINTENANCE', 'EVENEMENT'])

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/** GET /api/calendar — tous les événements (auth requis). */
export async function GET(request: NextRequest) {
  const auth = await getAuthAdmin(request)
  if (!auth) return unauthorizedResponse()

  const events = await db.calendarEvent.findMany({
    include: { facility: true },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  })
  return Response.json(events)
}

/** POST /api/calendar — AJOUTER UN ÉVÉNEMENT AU CALENDRIER (auth requis). */
export async function POST(request: NextRequest) {
  const auth = await getAuthAdmin(request)
  if (!auth) return unauthorizedResponse()

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Requête invalide (JSON attendu).' }, { status: 400 })
  }

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const description =
    typeof body.description === 'string' && body.description.trim() ? body.description.trim() : null
  const typeInput = typeof body.type === 'string' && body.type ? body.type.toUpperCase() : 'EVENEMENT'
  const type = VALID_TYPES.has(typeInput) ? typeInput : 'EVENEMENT'
  const facilityId =
    typeof body.facilityId === 'string' && body.facilityId ? body.facilityId : null
  const date = typeof body.date === 'string' ? body.date : ''
  const startTime = typeof body.startTime === 'string' ? body.startTime : ''
  const endTime = typeof body.endTime === 'string' ? body.endTime : ''

  // ===== Validations =====
  if (title.length < 3) {
    return Response.json({ error: 'Le titre est requis (3 caractères minimum).' }, { status: 400 })
  }
  if (!DATE_REGEX.test(date)) {
    return Response.json({ error: 'Date invalide (format attendu AAAA-MM-JJ).' }, { status: 400 })
  }
  if (!TIME_REGEX.test(startTime) || !TIME_REGEX.test(endTime)) {
    return Response.json({ error: 'Horaires invalides (format attendu HH:mm).' }, { status: 400 })
  }
  if (toMinutes(endTime) <= toMinutes(startTime)) {
    return Response.json({ error: "L'heure de fin doit être postérieure à l'heure de début." }, { status: 400 })
  }

  if (facilityId) {
    const facility = await db.facility.findUnique({ where: { id: facilityId } })
    if (!facility) {
      return Response.json({ error: 'Installation introuvable.' }, { status: 404 })
    }
  }

  try {
    const event = await db.calendarEvent.create({
      data: {
        title,
        description,
        type,
        facilityId,
        date,
        startTime,
        endTime,
      },
      include: { facility: true },
    })
    return Response.json({ event }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return Response.json({ error: `Ajout impossible : ${message}` }, { status: 500 })
  }
}
