import { db } from '@/lib/db'
import { nowInDakar, reservationInterval } from '@/lib/time'

/** Date ISO du jour précédent (pour inclure les nocturnes qui franchissent minuit). */
function previousDate(iso: string): string {
  return new Date(new Date(`${iso}T00:00:00Z`).getTime() - 86_400_000)
    .toISOString()
    .slice(0, 10)
}

/**
 * GET /api/reservations/public — calendrier public du complexe.
 * Renvoie les réservations EN COURS ou À VENIR (PENDING + CONFIRMED),
 * sans aucune donnée sensible (ni téléphone, ni e-mail, ni notes).
 * `live: true` = le créneau se joue en ce moment (heure de Dakar),
 * y compris un match nocturne qui franchit minuit (ex. 23:00 → 01:00).
 */
export async function GET() {
  const now = nowInDakar()
  const yesterday = previousDate(now.date)

  const reservations = await db.reservation.findMany({
    where: {
      status: { in: ['PENDING', 'CONFIRMED'] },
      // Hier inclus : les nocturnes (23:00 → 01:00, 00:00 → 01:00) se
      // terminent après minuit et doivent rester visibles pendant le match.
      date: { gte: yesterday },
      // Un terrain désactivé n'apparaît plus sur le calendrier public
      facility: { active: true },
    },
    select: {
      id: true,
      reference: true,
      customerName: true,
      date: true,
      startTime: true,
      endTime: true,
      status: true,
      paymentStatus: true,
      facility: { select: { name: true } },
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    take: 300,
  })

  const items = []
  for (const r of reservations) {
    const { start, end } = reservationInterval(r.startTime, r.endTime)
    // « Maintenant » exprimé dans la journée de la réservation :
    // hier soir + minuit franchi = minutes d'aujourd'hui + 24 h.
    const nowRef =
      r.date === now.date ? now.minutes : r.date === yesterday ? now.minutes + 24 * 60 : null
    // Terminé → exclu (ce n'est plus « en cours » ni « à venir »)
    if (nowRef !== null && nowRef >= end) continue
    const live = nowRef !== null && start <= nowRef && nowRef < end
    items.push({
      id: r.id,
      reference: r.reference,
      customerName: r.customerName,
      date: r.date,
      startTime: r.startTime,
      endTime: r.endTime,
      status: r.status,
      paymentStatus: r.paymentStatus,
      facilityName: r.facility?.name ?? 'Terrain',
      live,
    })
  }

  return Response.json({ reservations: items, now })
}
