import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthAdmin } from '@/lib/auth'
import { OPEN_END_MINUTES, OPEN_START_MINUTES, isSlotPast, nowInDakar, timeToMinutes } from '@/lib/time'

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/
const VALID_STATUSES = new Set(['PENDING', 'CONFIRMED', 'CANCELLED'])

/** Vérifie que le créneau ne chevauche pas une réservation active existante. */
async function hasConflict(
  facilityId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeId?: string,
): Promise<boolean> {
  const start = timeToMinutes(startTime)
  const end = timeToMinutes(endTime, true)
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
    const s = timeToMinutes(r.startTime)
    const e = timeToMinutes(r.endTime, true)
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
 * - Sans auth (source PUBLIC) : réservation client via le calendrier de créneaux.
 *   Nom + téléphone obligatoires, créneau 08:00 → minuit à l'heure pile, futur uniquement.
 *   Montant calculé côté serveur, paiement Wave (UNPAID à la création).
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
  const paymentMethodInput = typeof body.paymentMethod === 'string' ? body.paymentMethod.toUpperCase() : ''
  const paymentStatusInput = typeof body.paymentStatus === 'string' ? body.paymentStatus.toUpperCase() : ''

  // ===== Validations communes =====
  if (customerName.length < 2) {
    return Response.json({ error: 'Le nom du client est requis (2 caractères minimum).' }, { status: 400 })
  }
  if (!DATE_REGEX.test(date)) {
    return Response.json({ error: 'Date invalide (format attendu AAAA-MM-JJ).' }, { status: 400 })
  }
  if (!TIME_REGEX.test(startTime) || !TIME_REGEX.test(endTime)) {
    return Response.json({ error: 'Horaires invalides (format attendu HH:mm).' }, { status: 400 })
  }
  if (timeToMinutes(endTime, true) <= timeToMinutes(startTime)) {
    return Response.json({ error: "L'heure de fin doit être postérieure à l'heure de début." }, { status: 400 })
  }
  if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    return Response.json({ error: 'Adresse e-mail invalide.' }, { status: 400 })
  }

  // ===== Validations spécifiques au flux public (calendrier de créneaux) =====
  if (source === 'PUBLIC') {
    // Téléphone obligatoire pour valider la réservation client
    const phoneDigits = (customerPhone ?? '').replace(/\D/g, '')
    if (!customerPhone || phoneDigits.length < 8) {
      return Response.json(
        { error: 'Le numéro de téléphone est requis (au moins 8 chiffres, ex. +221 77 000 00 00).' },
        { status: 400 },
      )
    }

    // Créneaux réservables de 08:00 à minuit (00:00 = fin de journée)
    const startMin = timeToMinutes(startTime)
    const endMin = timeToMinutes(endTime, true)
    if (startMin < OPEN_START_MINUTES || endMin > OPEN_END_MINUTES) {
      return Response.json(
        { error: 'Les réservations sont possibles de 08:00 à minuit uniquement.' },
        { status: 400 },
      )
    }
    if (startMin % 60 !== 0 || endMin % 60 !== 0) {
      return Response.json({ error: 'Les créneaux commencent à l’heure pile (ex. 18:00).' }, { status: 400 })
    }

    // Créneaux déjà passés : interdits (heure de Dakar)
    if (isSlotPast(date, startMin)) {
      return Response.json(
        { error: 'Ce créneau horaire est déjà passé, il ne peut plus être réservé.' },
        { status: 400 },
      )
    }
  }

  const facility = await db.facility.findUnique({ where: { id: facilityId } })
  if (!facility || !facility.active) {
    return Response.json({ error: 'Terrain introuvable ou inactif.' }, { status: 404 })
  }

  if (await hasConflict(facilityId, date, startTime, endTime)) {
    return Response.json(
      {
        error: `Ce créneau est déjà réservé pour « ${facility.name} » le ${date}. Choisissez un autre horaire.`,
      },
      { status: 409 },
    )
  }

  // Montant en FCFA calculé côté serveur (durée × tarif horaire)
  const durationHours = (timeToMinutes(endTime, true) - timeToMinutes(startTime)) / 60
  const amount = Math.round(durationHours * facility.pricePerHour)

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
        amount,
        paymentStatus: auth && paymentStatusInput === 'PAID' ? 'PAID' : 'UNPAID',
        paymentMethod:
          auth && (paymentMethodInput === 'WAVE' || paymentMethodInput === 'ON_SITE')
            ? paymentMethodInput
            : source === 'PUBLIC'
              ? 'WAVE'
              : null,
        notes,
        source,
        ...(source === 'ADMIN' && auth ? { createdByAdminId: auth.id } : {}),
      },
      include: { facility: true },
    })
    return Response.json({ reservation, now: nowInDakar() }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return Response.json({ error: `Création impossible : ${message}` }, { status: 500 })
  }
}
