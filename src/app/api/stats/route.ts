import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthAdmin, unauthorizedResponse } from '@/lib/auth'

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** GET /api/stats — statistiques du dashboard (auth requis). */
export async function GET(request: NextRequest) {
  const auth = await getAuthAdmin(request)
  if (!auth) return unauthorizedResponse()

  const todayIso = isoDate(new Date())

  const [reservations, activeFacilities, totalAdmins, totalEvents] = await Promise.all([
    db.reservation.findMany({
      where: { status: { in: ['PENDING', 'CONFIRMED', 'CANCELLED'] } },
      include: { facility: { select: { pricePerHour: true } } },
    }),
    db.facility.count({ where: { active: true } }),
    db.admin.count({ where: { active: true } }),
    db.calendarEvent.count(),
  ])

  const confirmed = reservations.filter((r) => r.status === 'CONFIRMED')
  const estimatedRevenue = confirmed.reduce((sum, r) => {
    const hours = Math.max((toMinutes(r.endTime) - toMinutes(r.startTime)) / 60, 0)
    return sum + hours * (r.facility?.pricePerHour ?? 0)
  }, 0)

  // Volume quotidien des 14 derniers jours
  const daily: { date: string; count: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const date = isoDate(d)
    daily.push({ date, count: 0 })
  }
  const dailyMap = new Map(daily.map((entry) => [entry.date, entry]))
  for (const r of reservations) {
    const entry = dailyMap.get(r.date.slice(0, 10))
    if (entry) entry.count += 1
  }

  // Prochaines réservations (aujourd'hui et après, non annulées)
  const upcoming = reservations
    .filter((r) => r.date >= todayIso && r.status !== 'CANCELLED')
    .sort((a, b) => (a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date)))
    .slice(0, 8)

  const statusBreakdown = [
    { status: 'PENDING', count: reservations.filter((r) => r.status === 'PENDING').length },
    { status: 'CONFIRMED', count: confirmed.length },
    { status: 'CANCELLED', count: reservations.filter((r) => r.status === 'CANCELLED').length },
  ]

  return Response.json({
    totalReservations: reservations.length,
    pendingReservations: statusBreakdown[0].count,
    confirmedReservations: confirmed.length,
    cancelledReservations: statusBreakdown[2].count,
    totalAdmins,
    activeFacilities,
    totalEvents,
    estimatedRevenue: Math.round(estimatedRevenue),
    daily,
    statusBreakdown,
    upcoming,
  })
}
