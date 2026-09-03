// ============================================================
// Utilitaires horaires — Zalfoot
// Fuseau de référence du complexe : Africa/Dakar (GMT+0).
// Créneaux d'ouverture : 08:00 → 01:00 du matin, 17 slots d'1 h.
// Le DERNIER MATCH commence à 00:00 (minuit) et se joue jusqu'à 01:00.
// ============================================================

/** Ouverture du complexe (minutes depuis minuit) */
export const OPEN_START_MINUTES = 8 * 60
/** Fermeture du complexe : 01:00 du matin (25 h) — dernier match 00:00 → 01:00 */
export const OPEN_END_MINUTES = 25 * 60
/** Nombre de créneaux d'une heure par jour (08:00 → 01:00) */
export const SLOT_COUNT = (OPEN_END_MINUTES - OPEN_START_MINUTES) / 60

const TZ = 'Africa/Dakar'

/** Date et heure courantes à Dakar : { date: 'YYYY-MM-DD', minutes: minutes depuis minuit } */
export function nowInDakar(): { date: string; minutes: number } {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
  const parts: Record<string, string> = {}
  for (const p of fmt.formatToParts(new Date())) {
    if (p.type !== 'literal') parts[p.type] = p.value
  }
  const hour = Number(parts.hour ?? '0') % 24
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: hour * 60 + Number(parts.minute ?? '0'),
  }
}

/**
 * Convertit "HH:mm" en minutes depuis minuit.
 * « 00:00 » désigne toujours le MINUIT DE FIN de journée (1440) : le complexe
 * ouvre à 08:00, un créneau ne démarre jamais à 0 h du matin.
 */
export function timeToMinutes(time: string, _asEnd = false): number {
  const [h, m] = time.split(':').map(Number)
  const minutes = (h || 0) * 60 + (m || 0)
  if (minutes === 0) return 24 * 60
  return minutes
}

/**
 * Intervalle [début, fin) d'une réservation, minuit franchi inclus.
 * Ex. « 23:00 → 01:00 » = [1380, 1500) ; « 00:00 → 01:00 » = [1440, 1500).
 * La fin n'est reportée au lendemain que si elle tombe avant l'ouverture
 * (seule configuration possible d'un créneau nocturne).
 */
export function reservationInterval(
  startTime: string,
  endTime: string,
): { start: number; end: number } {
  const start = timeToMinutes(startTime)
  let end = timeToMinutes(endTime)
  if (end < start && end <= OPEN_START_MINUTES) end += 24 * 60
  return { start, end }
}

/** Minutes → libellé "HH:mm" (1440 → "00:00" minuit, 1500 → "01:00") */
export function minutesToTime(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

/** Libellé lisible d'un créneau : "20 h – 21 h" (minuit pour 00:00) */
export function slotLabel(start: string, end: string): string {
  const fmt = (t: string) => (t === '00:00' ? 'minuit' : `${Number(t.slice(0, 2))} h`)
  return `${fmt(start)} – ${fmt(end)}`
}

/**
 * Un créneau [start, end) pour `date` est-il déjà passé à Dakar ?
 * Passé = date antérieure à aujourd'hui, ou créneau déjà commencé aujourd'hui.
 */
export function isSlotPast(date: string, startMinutes: number, now = nowInDakar()): boolean {
  if (date < now.date) return true
  if (date > now.date) return false
  return startMinutes <= now.minutes
}
