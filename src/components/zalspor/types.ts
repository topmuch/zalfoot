// Types partagés de l'application Zalfoot

export type Facility = {
  id: string
  name: string
  type: string
  description: string | null
  pricePerHour: number
  capacity: number
  active: boolean
  createdAt: string
}

export type Reservation = {
  id: string
  reference: string
  customerName: string
  customerEmail: string | null
  customerPhone: string | null
  facilityId: string
  facility: Facility | null
  date: string
  startTime: string
  endTime: string // "00:00" = minuit
  status: string // PENDING | CONFIRMED | CANCELLED
  amount: number | null // montant total FCFA (durée × 25 000 F/h)
  depositAmount: number | null // acompte FCFA (5 000 F/heure, versé via Wave)
  paymentStatus: string // UNPAID | PAID (acompte reçu)
  paymentMethod: string | null // WAVE | ON_SITE
  notes: string | null
  source: string // PUBLIC | ADMIN
  createdAt: string
}

export type CalendarEvent = {
  id: string
  title: string
  description: string | null
  type: string // DISPONIBILITE | ENTRAINEMENT | MAINTENANCE | EVENEMENT
  facilityId: string | null
  facility: Facility | null
  date: string
  startTime: string
  endTime: string
  createdAt: string
}

export type Admin = {
  id: string
  name: string
  email: string
  role: string // SUPER_ADMIN | ADMIN
  phone: string | null
  active: boolean
  createdAt: string
}

export type Stats = {
  totalReservations: number
  pendingReservations: number
  confirmedReservations: number
  cancelledReservations: number
  totalAdmins: number
  activeFacilities: number
  totalEvents: number
  estimatedRevenue: number
  paidRevenue: number
  unpaidReservations: number
  daily: { date: string; count: number }[]
  statusBreakdown: { status: string; count: number }[]
  upcoming: Reservation[]
}

/** Réglages publics (paiement Wave…) */
export type PublicSettings = {
  wavePaymentLink: string | null
}

/** Réservation affichée sur le calendrier public (aucune donnée sensible). */
export type PublicReservation = {
  id: string
  reference: string
  customerName: string
  date: string
  startTime: string
  endTime: string // "00:00" = minuit
  status: 'PENDING' | 'CONFIRMED'
  paymentStatus: string
  facilityName: string
  live: boolean // true = créneau en cours en ce moment (heure de Dakar)
}

/** Réponse de /api/reservations/public */
export type PublicCalendarData = {
  reservations: PublicReservation[]
  now: { date: string; minutes: number }
}

/** Disponibilité d'un jour : créneaux 08:00 → 00:00 */
export type AvailabilitySlot = {
  start: string
  end: string
  state: 'FREE' | 'BOOKED' | 'PAST' | 'CLOSED'
}

export type DayAvailability = {
  facilityId: string
  date: string
  open: { start: string; end: string }
  pricePerHour: number
  slots: AvailabilitySlot[]
}

export type MonthAvailability = {
  facilityId: string
  month: string
  totalSlotsPerDay: number
  days: Record<string, number>
}

/** Tarification partagée client / serveur (voir src/lib/pricing.ts) */
export { DEPOSIT_PER_HOUR, computeDeposit } from '../../lib/pricing'

export const FACILITY_TYPE_LABELS: Record<string, string> = {
  FOOTBALL: 'Football',
}

export const EVENT_TYPE_META: Record<string, { label: string; dot: string; pill: string }> = {
  EVENEMENT: { label: 'Événement', dot: 'bg-violet-500', pill: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 border-violet-200 dark:border-violet-800' },
  ENTRAINEMENT: { label: 'Entraînement', dot: 'bg-emerald-500', pill: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  MAINTENANCE: { label: 'Maintenance', dot: 'bg-orange-500', pill: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-800' },
  DISPONIBILITE: { label: 'Disponibilité', dot: 'bg-teal-500', pill: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-200 dark:border-teal-800' },
  RESERVATION: { label: 'Réservation', dot: 'bg-amber-500', pill: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
}

export const RESERVATION_STATUS_META: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: { label: 'En attente', variant: 'secondary' },
  CONFIRMED: { label: 'Confirmée', variant: 'default' },
  CANCELLED: { label: 'Annulée', variant: 'destructive' },
}

export const PAYMENT_STATUS_META: Record<string, { label: string; variant: 'default' | 'outline' }> = {
  UNPAID: { label: 'Acompte dû', variant: 'outline' },
  PAID: { label: 'Acompte reçu', variant: 'default' },
}

export const PAYMENT_METHOD_META: Record<string, string> = {
  WAVE: 'Wave',
  ON_SITE: 'Sur place',
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace('XOF', 'FCFA')
}

export function formatDateFr(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTimeFr(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Libellé lisible d'une heure : 00:00 → « minuit » */
export function formatHourLabel(time: string): string {
  return time === '00:00' ? 'minuit' : time
}

/** Construit l'URL de paiement Wave à partir du lien configuré. */
export function buildWaveUrl(
  link: string,
  params: { amount?: number; reference?: string } = {},
): string {
  let url = link
  if (params.amount !== undefined) url = url.replaceAll('{amount}', String(Math.round(params.amount)))
  if (params.reference) url = url.replaceAll('{reference}', params.reference)
  return url
}
