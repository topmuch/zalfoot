import { db } from '@/lib/db'
import { nowInDakar, timeToMinutes } from '@/lib/time'

/**
 * GET /api/reservations/public — calendrier public du complexe.
 * Renvoie les réservations EN COURS ou À VENIR (PENDING + CONFIRMED),
 * sans aucune donnée sensible (ni téléphone, ni e-mail, ni notes).
 * `live: true` = le créneau se joue en ce moment (heure de Dakar).
 */
export async function GET() {
  const now = nowInDakar()

  const reservations = await db.reservation.findMany({
    where: {
      status: { in: ['PENDING', 'CONFIRMED'] },
      date: { gte: now.date },
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
    const startMin = timeToMinutes(r.startTime)
    const endMin = timeToMinutes(r.endTime, true)
    const today = r.date === now.date
    // Terminé aujourd'hui → exclu (ce n'est plus « en cours » ni « à venir »)
    if (today && endMin <= now.minutes) continue
    const live = today && startMin <= now.minutes && now.minutes < endMin
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
