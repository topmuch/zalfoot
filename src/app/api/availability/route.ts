import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { OPEN_END_MINUTES, OPEN_START_MINUTES, SLOT_COUNT, isSlotPast, reservationInterval } from '@/lib/time'

/**
 * GET /api/availability (public)
 * Deux usages :
 *  1. ?facilityId=...&date=YYYY-MM-DD   → état de chaque créneau horaire du jour (08:00 → 01:00)
 *  2. ?facilityId=...&month=YYYY-MM     → nombre de créneaux libres par jour du mois
 *
 * États d'un créneau :
 *  - PAST    : créneau déjà passé (heure de Dakar) → ne peut plus être réservé
 *  - BOOKED  : déjà réservé (PENDING ou CONFIRMED)
 *  - CLOSED  : terrain fermé (événement calendrier hors « disponibilité »)
 *  - FREE    : réservable
 */

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const MONTH_REGEX = /^\d{4}-\d{2}$/

type SlotState = 'FREE' | 'BOOKED' | 'PAST' | 'CLOSED'

type Interval = { start: number; end: number }

function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end
}

async function getDayIntervals(facilityId: string, dates: string[]) {
  const [reservations, events] = await Promise.all([
    db.reservation.findMany({
      where: { facilityId, date: { in: dates }, status: { in: ['PENDING', 'CONFIRMED'] } },
      select: { date: true, startTime: true, endTime: true },
    }),
    // Les événements « DISPONIBILITE » n'occupent pas le terrain ; les autres le bloquent.
    db.calendarEvent.findMany({
      where: { facilityId, date: { in: dates }, type: { not: 'DISPONIBILITE' } },
      select: { date: true, startTime: true, endTime: true },
    }),
  ])

  const toInterval = (row: { startTime: string; endTime: string }): Interval =>
    reservationInterval(row.startTime, row.endTime)

  const byDate = new Map<string, { booked: Interval[]; closed: Interval[] }>()
  for (const d of dates) byDate.set(d, { booked: [], closed: [] })
  for (const r of reservations) byDate.get(r.date)?.booked.push(toInterval(r))
  for (const e of events) byDate.get(e.date)?.closed.push(toInterval(e))
  return byDate
}

function slotStatesForDate(date: string, booked: Interval[], closed: Interval[]): SlotState[] {
  const states: SlotState[] = []
  for (let s = OPEN_START_MINUTES; s < OPEN_END_MINUTES; s += 60) {
    const slot = { start: s, end: s + 60 }
    if (isSlotPast(date, s)) states.push('PAST')
    else if (booked.some((i) => overlaps(slot, i))) states.push('BOOKED')
    else if (closed.some((i) => overlaps(slot, i))) states.push('CLOSED')
    else states.push('FREE')
  }
  return states
}

function minutesToTime(minutes: number): string {
  const m = minutes % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const facilityId = url.searchParams.get('facilityId') ?? ''
  const date = url.searchParams.get('date') ?? ''
  const month = url.searchParams.get('month') ?? ''

  if (!facilityId) {
    return Response.json({ error: 'Paramètre facilityId requis.' }, { status: 400 })
  }

  const facility = await db.facility.findUnique({ where: { id: facilityId } })
  if (!facility || !facility.active) {
    return Response.json({ error: 'Terrain introuvable ou inactif.' }, { status: 404 })
  }

  // ===== Disponibilité d'un jour précis =====
  if (DATE_REGEX.test(date)) {
    const byDate = await getDayIntervals(facilityId, [date])
    const { booked, closed } = byDate.get(date) ?? { booked: [], closed: [] }
    const states = slotStatesForDate(date, booked, closed)
    const slots = states.map((state, i) => ({
      start: minutesToTime(OPEN_START_MINUTES + i * 60),
      end: minutesToTime(OPEN_START_MINUTES + (i + 1) * 60),
      state,
    }))
    return Response.json({
      facilityId,
      date,
      open: { start: '08:00', end: '01:00' },
      pricePerHour: facility.pricePerHour,
      slots,
    })
  }

  // ===== Résumé d'un mois (pour le calendrier) =====
  if (MONTH_REGEX.test(month)) {
    const [y, m] = month.split('-').map(Number)
    const daysInMonth = new Date(y, m, 0).getDate()
    const dates: string[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      dates.push(`${month}-${String(d).padStart(2, '0')}`)
    }

    const byDate = await getDayIntervals(facilityId, dates)
    const days: Record<string, number> = {}
    for (const day of dates) {
      const { booked, closed } = byDate.get(day) ?? { booked: [], closed: [] }
      days[day] = slotStatesForDate(day, booked, closed).filter((s) => s === 'FREE').length
    }

    return Response.json({ facilityId, month, totalSlotsPerDay: SLOT_COUNT, days })
  }

  return Response.json({ error: 'Paramètre date (YYYY-MM-DD) ou month (YYYY-MM) requis.' }, { status: 400 })
}
