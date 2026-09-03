import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthAdmin } from '@/lib/auth'

/**
 * POST /api/reservations/seen — marque les réservations comme consultées :
 * enregistre la date de référence de l'admin connecté (les réservations
 * reçues ensuite seront à nouveau signalées à la prochaine connexion).
 * Auth requise. Appelé quand l'admin ferme la notification.
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthAdmin(request)
  if (!auth) {
    return Response.json({ error: 'Non authentifié.' }, { status: 401 })
  }

  try {
    await db.admin.update({
      where: { id: auth.id },
      data: { lastSeenReservationsAt: new Date() },
    })
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: 'Mise à jour impossible.' }, { status: 500 })
  }
}
