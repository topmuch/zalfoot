import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthAdmin } from '@/lib/auth'

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/
const VALID_STATUSES = new Set(['PENDING', 'CONFIRMED', 'CANCELLED'])

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/** Vérifie que le créneau ne chevauche pas une réservation active existante. */
async function hasConflict(
  facilityId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeId?: string,
): Promise<boolean> {
  const start = toMinutes(startTime)
  const end = toMinutes(endTime)
  const reservations = await db.reservation.findMany({
    where: {
      facilityId,
      date,
      status: { in: ['PENDING', 'CONFIRMED'] },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { startTime: true, endTime: true },
  })
  return reservations.some((r) => {
    const s = toMinutes(r.startTime)
    const e = toMinutes(r.endTime)
    return start < e && s < end
  })
}

/** GET /api/reservations — liste (auth requis). */
export async function GET(request: NextRequest) {
  const auth = await getAuthAdmin(request)
  if (!auth) {
    return Response.json({ error: 'Non authentifié.' }, { status: 401 })
  }

  const url = new URL(request.url)
  const status = url.searchParams.get('status')
  const date = url.searchParams.get('date')

  const reservations = await db.reservation.findMany({
    where: {
      ...(status && VALID_STATUSES.has(status) ? { status } : {}),
      ...(date && DATE_REGEX.test(date) ? { date } : {}),
    },
    include: { facility: true },
    orderBy: [{ date: 'desc' }, { startTime: 'asc' }],
  })
  return Response.json(reservations)
}

/**
 * POST /api/reservations — créer une réservation.
 * - Sans auth (source PUBLIC) : demande client, statut initial PENDING, date future obligatoire.
 * - Avec auth (source ADMIN) : création directe par un admin, statut libre.
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Requête invalide (JSON attendu).' }, { status: 400 })
  }

  const auth = await getAuthAdmin(request)
  const source = auth && body.source === 'ADMIN' ? 'ADMIN' : 'PUBLIC'

  const customerName = typeof body.customerName === 'string' ? body.customerName.trim() : ''
  const customerEmail =
    typeof body.customerEmail === 'string' && body.customerEmail.trim() ? body.customerEmail.trim() : null
  const customerPhone =
    typeof body.customerPhone === 'string' && body.customerPhone.trim() ? body.customerPhone.trim() : null
  const facilityId = typeof body.facilityId === 'string' ? body.facilityId : ''
  const date = typeof body.date === 'string' ? body.date : ''
  const startTime = typeof body.startTime === 'string' ? body.startTime : ''
  const endTime = typeof body.endTime === 'string' ? body.endTime : ''
  const notes = typeof body.notes === 'string' && body.notes.trim() ? body.notes.trim() : null
  const statusInput = typeof body.status === 'string' ? body.status.toUpperCase() : 'PENDING'
  const status = auth && VALID_STATUSES.has(statusInput) ? statusInput : 'PENDING'

  // ===== Validations =====
  if (customerName.length < 2) {
    return Response.json({ error: 'Le nom du client est requis (2 caractères minimum).' }, { status: 400 })
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
  if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    return Response.json({ error: 'Adresse e-mail invalide.' }, { status: 400 })
  }

  // Réservation publique : interdire les dates passées
  const today = new Date()
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate(),
  ).padStart(2, '0')}`
  if (source === 'PUBLIC' && date < todayIso) {
    return Response.json({ error: 'Impossible de réserver une date passée.' }, { status: 400 })
  }

  const facility = await db.facility.findUnique({ where: { id: facilityId } })
  if (!facility || !facility.active) {
    return Response.json({ error: 'Installation introuvable ou inactive.' }, { status: 404 })
  }

  if (await hasConflict(facilityId, date, startTime, endTime)) {
    return Response.json(
      {
        error: `Ce créneau est déjà réservé pour « ${facility.name} » le ${date}. Choisissez un autre horaire.`,
      },
      { status: 409 },
    )
  }

  try {
    const reservation = await db.reservation.create({
      data: {
        customerName,
        customerEmail,
        customerPhone,
        facilityId,
        date,
        startTime,
        endTime,
        status,
        notes,
        source,
        ...(source === 'ADMIN' && auth ? { createdByAdminId: auth.id } : {}),
      },
      include: { facility: true },
    })
    return Response.json({ reservation }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return Response.json({ error: `Création impossible : ${message}` }, { status: 500 })
  }
}
