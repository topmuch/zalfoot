import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthAdmin } from '@/lib/auth'

/** Nombre maximum de réservations signalées d'un coup. */
const MAX_NEW = 10

/**
 * GET /api/reservations/new — réservations créées depuis la dernière
 * consultation de l'admin connecté (notification « Nouvelle réservation »
 * affichée à la connexion du dashboard). Auth requise.
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthAdmin(request)
  if (!auth) {
    return Response.json({ error: 'Non authentifié.' }, { status: 401 })
  }

  // Première utilisation (jamais consulté) : rien à signaler, la date de
  // référence sera posée au premier « vu » (POST /api/reservations/seen).
  if (!auth.lastSeenReservationsAt) {
    return Response.json([])
  }

  const reservations = await db.reservation.findMany({
    where: {
      createdAt: { gt: auth.lastSeenReservationsAt },
      status: { not: 'CANCELLED' },
    },
    include: { facility: true },
    orderBy: { createdAt: 'desc' },
    take: MAX_NEW,
  })
  return Response.json(reservations)
}
