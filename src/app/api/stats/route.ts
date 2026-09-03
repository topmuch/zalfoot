import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthAdmin, unauthorizedResponse } from '@/lib/auth'
import { timeToMinutes, reservationInterval } from '@/lib/time'
import { computeDeposit } from '@/lib/pricing'

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
  const hoursOf = (r: (typeof reservations)[number]): number => {
    const { start, end } = reservationInterval(r.startTime, r.endTime)
    return Math.max((end - start) / 60, 0)
  }
  const amountOf = (r: (typeof reservations)[number]): number => {
    if (typeof r.amount === 'number' && r.amount > 0) return r.amount
    return hoursOf(r) * (r.facility?.pricePerHour ?? 0)
  }
  const estimatedRevenue = confirmed.reduce((sum, r) => sum + amountOf(r), 0)

  // Acomptes (5 000 F/heure) : encaissés via Wave et en attente
  const depositOf = (r: (typeof reservations)[number]): number => {
    if (typeof r.depositAmount === 'number' && r.depositAmount >= 0) return r.depositAmount
    return computeDeposit(hoursOf(r))
  }
  const paidRevenue = reservations
    .filter((r) => r.paymentStatus === 'PAID')
    .reduce((sum, r) => sum + depositOf(r), 0)
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
    .sort((a, b) =>
      a.date === b.date
        ? timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
        : a.date.localeCompare(b.date),
    )
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
