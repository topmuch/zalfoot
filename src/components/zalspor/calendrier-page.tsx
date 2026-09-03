'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  CalendarCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Radio,
  Trophy,
} from 'lucide-react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { apiFetch } from './api'
import { reservationInterval } from '@/lib/time'
import { formatDateFr, formatHourLabel, type PublicCalendarData, type PublicReservation } from './types'

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function isoOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Couleur du point selon l'état de la réservation. */
function dotClass(r: PublicReservation): string {
  if (r.live) return 'bg-emerald-500 animate-pulse'
  return r.status === 'CONFIRMED' ? 'bg-primary' : 'bg-amber-400'
}

export function CalendrierPage({ onReserve }: { onReserve: () => void }) {
  const [reservations, setReservations] = useState<PublicReservation[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastSync, setLastSync] = useState<string>('')

  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()))
  const [selectedDate, setSelectedDate] = useState<string | null>(() => isoOf(new Date()))

  const loadingRef = useRef(false)

  // ===== Chargement + auto-actualisation (toutes les 30 s) =====
  const load = useCallback(async (announce = false) => {
    if (loadingRef.current) return
    loadingRef.current = true
    try {
      const data = await apiFetch<PublicCalendarData>('/api/reservations/public')
      setReservations(data.reservations)
      setError(null)
      if (announce) {
        setLastSync(
          new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        )
      }
    } catch {
      setError('Impossible de charger les réservations. Réessayez dans un instant.')
    } finally {
      loadingRef.current = false
    }
  }, [])

  useEffect(() => {
    load(true)
    const interval = window.setInterval(() => load(true), 30_000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') load(true)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [load])

  // ===== Groupement par date =====
  const byDate = useMemo(() => {
    const map = new Map<string, PublicReservation[]>()
    for (const r of reservations ?? []) {
      const list = map.get(r.date)
      if (list) list.push(r)
      else map.set(r.date, [r])
    }
    // Tri chronologique réel (le créneau de minuit 00:00 est le DERNIER de la
    // journée, pas le premier comme le tri alphabétique le laisserait croire)
    for (const list of map.values())
      list.sort(
        (a, b) =>
          reservationInterval(a.startTime, a.endTime).start -
          reservationInterval(b.startTime, b.endTime).start,
      )
    return map
  }, [reservations])

  const selectedList = selectedDate ? (byDate.get(selectedDate) ?? []) : []

  const upcoming = useMemo(() => (reservations ?? []).slice(0, 6), [reservations])
  const liveCount = useMemo(() => (reservations ?? []).filter((r) => r.live).length, [reservations])

  // ===== Jours du calendrier =====
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthCursor), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(monthCursor), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [monthCursor])

  const todayIso = isoOf(new Date())
  const prevMonthDisabled = isSameMonth(monthCursor, new Date())
  const nextMonthDisabled = isSameMonth(monthCursor, addMonths(new Date(), 2))

  const loading = reservations === null && !error

  return (
    <motion.div
      key="calendrier"
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      transition={{ duration: 0.35 }}
    >
      {/* ===== En-tête ===== */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-background to-teal-50 dark:from-emerald-950/40 dark:via-background dark:to-teal-950/30" />
        <div className="relative mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="max-w-3xl">
            <Badge className="w-fit gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
              <CalendarDays className="size-3.5" />
              Calendrier des réservations
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mt-5 leading-[1.1]">
              Réservations <span className="text-primary">en cours &amp; à venir</span>
            </h1>
            <p className="text-lg text-muted-foreground mt-5 max-w-2xl">
              Toutes les réservations actives du complexe, mises à jour automatiquement. Choisissez
              un jour pour voir les créneaux occupés — les autres restent disponibles.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-6">
            <Badge variant="outline" className="gap-1.5">
              <Activity className="size-3.5 text-emerald-600" />
              {lastSync ? `Actualisation auto · ${lastSync}` : 'Actualisation auto · 30 s'}
            </Badge>
            {liveCount > 0 && (
              <Badge className="gap-1.5 bg-emerald-600 hover:bg-emerald-600 text-white border-0">
                <Radio className="size-3.5 animate-pulse" />
                {liveCount} match{liveCount > 1 ? 's' : ''} en cours
              </Badge>
            )}
          </div>
        </div>
      </section>

      {/* ===== Corps ===== */}
      <section className="py-14 sm:py-16">
        <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8">
          {error && (
            <Card className="mb-6 border-destructive/40">
              <CardContent className="pt-6 text-sm text-destructive flex items-center justify-between gap-4">
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={() => load(true)}>
                  Réessayer
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Légende */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground mb-6">
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
              En cours (en ce moment)
            </span>
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-primary" aria-hidden="true" />
              Confirmée
            </span>
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-amber-400" aria-hidden="true" />
              En attente d&apos;acompte
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* ===== Calendrier mensuel ===== */}
            <Card className="lg:col-span-2 h-fit">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-bold capitalize">
                    {format(monthCursor, 'MMMM yyyy', { locale: fr })}
                  </h2>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      aria-label="Mois précédent"
                      disabled={prevMonthDisabled}
                      onClick={() => setMonthCursor((m) => addMonths(m, -1))}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      aria-label="Mois suivant"
                      disabled={nextMonthDisabled}
                      onClick={() => setMonthCursor((m) => addMonths(m, 1))}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground mb-2">
                  {WEEKDAYS.map((d) => (
                    <span key={d} className="py-1">
                      {d}
                    </span>
                  ))}
                </div>
                {loading ? (
                  <div className="grid grid-cols-7 gap-1.5" aria-label="Chargement du calendrier">
                    {Array.from({ length: 35 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-1.5">
                    {calendarDays.map((day) => {
                      const iso = isoOf(day)
                      const inMonth = isSameMonth(day, monthCursor)
                      const isToday = iso === todayIso
                      const isSelected = iso === selectedDate
                      const dayList = byDate.get(iso) ?? []
                      const isPast = iso < todayIso
                      const clickable = inMonth && !isPast
                      return (
                        <button
                          key={iso}
                          type="button"
                          disabled={!clickable}
                          aria-label={`${format(day, 'd MMMM', { locale: fr })}${dayList.length ? ` — ${dayList.length} réservation${dayList.length > 1 ? 's' : ''}` : ' — aucun créneau réservé'}`}
                          onClick={() => setSelectedDate(iso)}
                          className={[
                            'relative h-14 sm:h-16 rounded-lg border flex flex-col items-center justify-center gap-1 transition-colors',
                            !inMonth ? 'opacity-0 pointer-events-none' : '',
                            isPast ? 'text-muted-foreground/50 bg-muted/30' : 'hover:border-primary/50 cursor-pointer',
                            isSelected
                              ? 'border-primary bg-primary text-primary-foreground'
                              : isToday
                                ? 'border-primary/60 bg-primary/5'
                                : 'border-border',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          <span className={['text-sm font-semibold tabular-nums', isSelected ? '' : isToday ? 'text-primary' : ''].join(' ')}>
                            {format(day, 'd')}
                          </span>
                          {dayList.length > 0 && (
                            <span className="flex items-center gap-1" aria-hidden="true">
                              {dayList.slice(0, 4).map((r) => (
                                <span key={r.id} className={`size-1.5 rounded-full ${dotClass(r)}`} />
                              ))}
                            </span>
                          )}
                          {dayList.length > 0 && (
                            <span className={['text-[10px] leading-none', isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'].join(' ')}>
                              {dayList.length} résa.
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ===== Colonne droite : détail du jour + prochaines ===== */}
            <div className="grid gap-6 content-start">
              <Card className="h-fit">
                <CardHeader className="pb-3">
                  <h2 className="text-lg font-bold">
                    {selectedDate
                      ? formatDateFr(selectedDate)
                      : 'Choisissez un jour'}
                  </h2>
                </CardHeader>
                <CardContent>
                  {!selectedDate ? (
                    <p className="text-sm text-muted-foreground">
                      Cliquez sur un jour du calendrier pour afficher ses réservations.
                    </p>
                  ) : selectedList.length === 0 ? (
                    <div className="grid gap-3">
                      <p className="text-sm text-muted-foreground">
                        Aucune réservation ce jour-là : tous les créneaux de 08:00 à 01:00 sont
                        disponibles.
                      </p>
                      <Button size="sm" onClick={onReserve}>
                        <CalendarCheck className="size-4" />
                        Réserver ce jour
                      </Button>
                    </div>
                  ) : (
                    <ul className="grid gap-2.5 max-h-80 overflow-y-auto zalspor-scroll pr-1">
                      {selectedList.map((r) => (
                        <li
                          key={r.id}
                          className="rounded-xl border p-3 flex flex-col gap-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold tabular-nums flex items-center gap-1.5">
                              <Clock className="size-4 text-primary" />
                              {r.startTime} → {formatHourLabel(r.endTime)}
                            </span>
                            {r.live ? (
                              <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600 text-white border-0 shrink-0">
                                <Radio className="size-3 animate-pulse" />
                                En cours
                              </Badge>
                            ) : r.status === 'PENDING' ? (
                              <Badge variant="secondary" className="shrink-0">
                                En attente
                              </Badge>
                            ) : (
                              <Badge className="shrink-0">Confirmée</Badge>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2 text-sm">
                            <span className="flex items-center gap-1.5 text-muted-foreground min-w-0">
                              <Trophy className="size-3.5 shrink-0" />
                              <span className="truncate">{r.facilityName}</span>
                            </span>
                            <span className="font-medium truncate">{r.customerName}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card className="h-fit">
                <CardHeader className="pb-3">
                  <h2 className="text-lg font-bold">Prochaines réservations</h2>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="grid gap-2.5">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-14 rounded-xl" />
                      ))}
                    </div>
                  ) : upcoming.length === 0 ? (
                    <div className="grid gap-3">
                      <p className="text-sm text-muted-foreground">
                        Aucune réservation en cours ou à venir pour le moment. Le calendrier se
                        remplira dès la première réservation.
                      </p>
                      <Button size="sm" onClick={onReserve}>
                        <CalendarCheck className="size-4" />
                        Réserver un terrain
                      </Button>
                    </div>
                  ) : (
                    <ul className="grid gap-2.5 max-h-96 overflow-y-auto zalspor-scroll pr-1">
                      {upcoming.map((r) => (
                        <li key={r.id} className="rounded-xl border p-3 grid gap-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold tabular-nums">
                              {r.startTime} → {formatHourLabel(r.endTime)}
                            </span>
                            {r.live ? (
                              <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600 text-white border-0 shrink-0">
                                <Radio className="size-3 animate-pulse" />
                                En cours
                              </Badge>
                            ) : r.status === 'PENDING' ? (
                              <Badge variant="secondary" className="shrink-0">
                                En attente
                              </Badge>
                            ) : (
                              <Badge className="shrink-0">Confirmée</Badge>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2 text-sm">
                            <span className="flex items-center gap-1.5 text-muted-foreground min-w-0">
                              <MapPin className="size-3.5 shrink-0" />
                              <span className="truncate">{r.facilityName}</span>
                            </span>
                            <span className="font-medium truncate">{r.customerName}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDateFr(r.date)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
            <Button size="lg" className="h-12 text-base" onClick={onReserve}>
              <CalendarCheck className="size-5" />
              Réserver un terrain
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Créneaux libres tous les jours de 08:00 à 01:00 du matin.
            </p>
          </div>
        </div>
      </section>
    </motion.div>
  )
}
