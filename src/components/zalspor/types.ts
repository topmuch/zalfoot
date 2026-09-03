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
  endTime: string
  status: string // PENDING | CONFIRMED | CANCELLED
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
  daily: { date: string; count: number }[]
  statusBreakdown: { status: string; count: number }[]
  upcoming: Reservation[]
}

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
