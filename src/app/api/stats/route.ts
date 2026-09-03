import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthAdmin, unauthorizedResponse } from '@/lib/auth'
import { timeToMinutes } from '@/lib/time'

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
  const amountOf = (r: (typeof reservations)[number]): number => {
    if (typeof r.amount === 'number' && r.amount > 0) return r.amount
    const hours = Math.max((timeToMinutes(r.endTime, true) - timeToMinutes(r.startTime)) / 60, 0)
    return hours * (r.facility?.pricePerHour ?? 0)
  }
  const estimatedRevenue = confirmed.reduce((sum, r) => sum + amountOf(r), 0)

  // Paiements Wave : encaissé et en attente
  const paidRevenue = reservations
    .filter((r) => r.paymentStatus === 'PAID')
    .reduce((sum, r) => sum + amountOf(r), 0)
  const unpaidReservations = reservations.filter(
    (r) => r.paymentStatus === 'UNPAID' && r.status !== 'CANCELLED',
  ).length

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
    paidRevenue: Math.round(paidRevenue),
    unpaidReservations,
    daily,
    statusBreakdown,
    upcoming,
  })
}
