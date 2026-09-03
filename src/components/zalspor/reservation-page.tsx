'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
  Loader2,
  Phone,
  Trophy,
  User,
  Users,
} from 'lucide-react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { apiFetch, ApiError } from './api'
import {
  buildWaveUrl,
  formatDateFr,
  formatHourLabel,
  formatPrice,
  type AvailabilitySlot,
  type DayAvailability,
  type Facility,
  type MonthAvailability,
  type PublicSettings,
  type Reservation,
} from './types'
import { DEPOSIT_PER_HOUR } from '../../lib/pricing'

// ============================================================
// Page de réservation — PAGE DÉDIÉE (plus de modale).
// Calendrier visible + créneaux horaires 08:00 → 01:00 du matin (1 h),
// le dernier match commence à minuit (00:00 → 01:00). Sélection
// d'heures consécutives, coordonnées (nom + téléphone sans indicatif),
// puis paiement de l'ACOMPTE (5 000 FCFA / heure réservée) via
// Wave Business. Le solde est réglé sur place.
// 25 000 FCFA / heure.
// ============================================================

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
/** Réservation possible jusqu'à 60 jours à l'avance */
const MAX_DAYS_AHEAD = 60

function isoOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

type Selection = { start: number; end: number }

type Step = 'slot' | 'details' | 'done'

const STEPS: { key: Step; label: string }[] = [
  { key: 'slot', label: 'Créneau' },
  { key: 'details', label: 'Coordonnées' },
  { key: 'done', label: 'Paiement' },
]

export function ReservationPage({
  facilities,
  preselectedFacilityId,
  onBack,
}: {
  facilities: Facility[]
  preselectedFacilityId?: string
  onBack: () => void
}) {
  const { toast } = useToast()

  const [step, setStep] = useState<Step>('slot')
  const [facilityId, setFacilityId] = useState(() => preselectedFacilityId ?? facilities[0]?.id ?? '')
  const [date, setDate] = useState(() => isoOf(new Date()))
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()))
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [monthSummary, setMonthSummary] = useState<Record<string, number> | null>(null)
  const [selection, setSelection] = useState<Selection | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState<Reservation | null>(null)
  const [waveLink, setWaveLink] = useState<string | null>(null)

  const fetchSeq = useRef(0)

  const facility = useMemo(
    () => facilities.find((f) => f.id === facilityId),
    [facilities, facilityId],
  )
  const todayIso = isoOf(new Date())
  const maxIso = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + MAX_DAYS_AHEAD)
    return isoOf(d)
  }, [])

  // ===== Lien de paiement Wave (configuré par l'admin) =====
  useEffect(() => {
    apiFetch<PublicSettings>('/api/settings')
      .then((s) => setWaveLink(s.wavePaymentLink))
      .catch(() => setWaveLink(null))
  }, [])

  // ===== Créneaux du jour sélectionné =====
  const loadSlots = useCallback(async (fid: string, day: string) => {
    if (!fid || !day) return
    const seq = ++fetchSeq.current
    setSlotsLoading(true)
    try {
      const data = await apiFetch<DayAvailability>(
        `/api/availability?facilityId=${encodeURIComponent(fid)}&date=${day}`,
      )
      if (seq === fetchSeq.current) setSlots(data.slots)
    } catch {
      if (seq === fetchSeq.current) setSlots([])
    } finally {
      if (seq === fetchSeq.current) setSlotsLoading(false)
    }
  }, [])

  useEffect(() => {
    setSelection(null)
    loadSlots(facilityId, date)
  }, [facilityId, date, loadSlots])

  // ===== Résumé mensuel (calendrier : jours complets / bientôt complets) =====
  useEffect(() => {
    if (!facilityId) return
    let cancelled = false
    apiFetch<MonthAvailability>(
      `/api/availability?facilityId=${encodeURIComponent(facilityId)}&month=${monthKey(monthCursor)}`,
    )
      .then((data) => {
        if (!cancelled) setMonthSummary(data.days)
      })
      .catch(() => {
        if (!cancelled) setMonthSummary(null)
      })
    return () => {
      cancelled = true
    }
  }, [facilityId, monthCursor])

  // ===== Remonter en haut de la page à chaque étape =====
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  // ===== Sélection de créneaux consécutifs =====
  function toggleSlot(idx: number) {
    const slot = slots[idx]
    if (!slot || slot.state !== 'FREE') return
    if (!selection) {
      setSelection({ start: idx, end: idx })
      return
    }
    if (idx >= selection.start && idx <= selection.end) {
      if (idx === selection.start && idx === selection.end) setSelection(null)
      else if (idx === selection.start) setSelection({ start: idx + 1, end: selection.end })
      else if (idx === selection.end) setSelection({ start: selection.start, end: idx - 1 })
      return
    }
    if (idx === selection.start - 1) setSelection({ start: idx, end: selection.end })
    else if (idx === selection.end + 1) setSelection({ start: selection.start, end: idx })
    else setSelection({ start: idx, end: idx })
  }

  const selectedSlots = useMemo(
    () => (selection ? slots.slice(selection.start, selection.end + 1) : []),
    [selection, slots],
  )
  const hours = selection ? selection.end - selection.start + 1 : 0
  const total = facility && hours > 0 ? hours * facility.pricePerHour : 0
  /** Acompte : 5 000 FCFA par heure réservée */
  const deposit = hours > 0 ? hours * DEPOSIT_PER_HOUR : 0
  /** Solde à régler sur place */
  const balance = Math.max(total - deposit, 0)
  const canContinue = hours > 0 && !!facility

  // ===== Jours du calendrier =====
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthCursor), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(monthCursor), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [monthCursor])

  const prevMonthDisabled = isSameMonth(monthCursor, new Date())
  const nextMonthDisabled = isSameMonth(monthCursor, addMonths(new Date(), 2))

  // ===== Soumission =====
  const canSubmit =
    step === 'details' &&
    !!facility &&
    hours > 0 &&
    customerName.trim().length > 1 &&
    customerPhone.replace(/\D/g, '').length >= 8

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || submitting || !selection || !facility) return
    const startSlot = slots[selection.start]
    const endSlot = slots[selection.end]
    if (!startSlot || !endSlot) return
    setSubmitting(true)
    try {
      const result = await apiFetch<{ reservation: Reservation }>('/api/reservations', {
        method: 'POST',
        body: {
          facilityId: facility.id,
          date,
          startTime: startSlot.start,
          endTime: endSlot.end,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          source: 'PUBLIC',
        },
      })
      setCreated(result.reservation)
      setStep('done')
      toast({
        title: 'Réservation enregistrée ! 🎉',
        description: `Référence ${result.reservation.reference.slice(0, 10).toUpperCase()}. Versez l'acompte de ${formatPrice(result.reservation.depositAmount ?? deposit)} via Wave pour la confirmer.`,
      })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Une erreur est survenue. Réessayez.'
      toast({ title: 'Échec de la réservation', description: message, variant: 'destructive' })
      // Conflit ou créneau devenu indisponible → retour au choix du créneau
      if (error instanceof ApiError && (error.status === 409 || error.status === 400)) {
        setStep('slot')
        setSelection(null)
        loadSlots(facilityId, date)
      }
    } finally {
      setSubmitting(false)
    }
  }

  // ===== Paiement Wave : acompte de 5 000 F / heure =====
  const depositToPay = created?.depositAmount ?? deposit
  const totalCreated = created?.amount ?? total
  const balanceToPay = Math.max(totalCreated - depositToPay, 0)

  function payWithWave() {
    if (!waveLink || !created) return
    const url = buildWaveUrl(waveLink, { amount: depositToPay, reference: created.reference })
    window.open(url, '_blank', 'noopener')
  }

  /** Nouvelle réservation : réinitialise le parcours. */
  function reset() {
    const today = isoOf(new Date())
    setStep('slot')
    setSelection(null)
    setCreated(null)
    setCustomerName('')
    setCustomerPhone('')
    setDate(today)
    setMonthCursor(startOfMonth(new Date()))
    loadSlots(facilityId, today)
  }

  // ===== Rendu =====
  const freeCount = slots.filter((s) => s.state === 'FREE').length
  const noSlotsLeft = !slotsLoading && slots.length > 0 && freeCount === 0
  const stepIndex = step === 'slot' ? 0 : step === 'details' ? 1 : 2

  const slotRange =
    selection && slots.length > 0
      ? `${slots[selection.start]?.start} → ${formatHourLabel(slots[selection.end]?.end ?? '')}`
      : null

  return (
    <div>
      {/* ===== En-tête de la page ===== */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-emerald-50 via-background to-teal-50 dark:from-emerald-950/40 dark:via-background dark:to-teal-950/30">
        <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground -ml-2"
            onClick={onBack}
          >
            <ArrowLeft className="size-4" />
            Retour à l&apos;accueil
          </Button>

          <div className="mt-4 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Réserver votre <span className="text-primary">terrain de football</span>
              </h1>
              <p className="text-muted-foreground mt-3 max-w-2xl leading-relaxed">
                Choisissez la date et l&apos;heure (08:00 → 01:00 du matin) parmi les créneaux libres, puis
                bloquez votre terrain avec un acompte de{' '}
                <strong className="text-foreground">{formatPrice(DEPOSIT_PER_HOUR)}</strong> par
                heure réservée, payé avec Wave.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <Badge variant="outline" className="gap-1.5">
                  <Clock className="size-3.5" /> 25 000 FCFA / heure
                </Badge>
                <Badge variant="outline" className="gap-1.5 bg-[#00A0E7]/5 border-[#00A0E7]/30 text-[#0090D2] dark:text-[#4DC3F0]">
                  <Image
                    src="/wave-brand.png"
                    alt="Wave"
                    width={332}
                    height={419}
                    className="h-4 w-auto rounded-[4px]"
                  />
                  Acompte {formatPrice(DEPOSIT_PER_HOUR)}/h via Wave
                </Badge>
                <Badge variant="outline" className="gap-1.5">
                  <Users className="size-3.5" /> Solde sur place
                </Badge>
              </div>
            </div>

            {/* Stepper */}
            <ol className="flex items-center gap-2 sm:gap-3 w-full lg:w-auto lg:min-w-[380px]" aria-label="Étapes de réservation">
              {STEPS.map((s, i) => {
                const done = i < stepIndex
                const active = i === stepIndex
                const clickable = done && step !== 'slot'
                return (
                  <li key={s.key} className="flex items-center gap-2 sm:gap-3 flex-1 lg:flex-none min-w-0">
                    <button
                      type="button"
                      disabled={!clickable}
                      onClick={() => setStep(s.key)}
                      className={`flex items-center gap-2 min-w-0 rounded-lg px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        clickable ? 'cursor-pointer' : 'cursor-default'
                      }`}
                      aria-current={active ? 'step' : undefined}
                    >
                      <span
                        className={`flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold border-2 transition-colors ${
                          active
                            ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                            : done
                              ? 'bg-primary/10 border-primary text-primary'
                              : 'bg-muted/60 border-border text-muted-foreground/70'
                        }`}
                      >
                        {done ? <Check className="size-4" /> : i + 1}
                      </span>
                      <span
                        className={`text-xs sm:text-sm font-semibold truncate ${
                          active ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {s.label}
                      </span>
                    </button>
                    {i < STEPS.length - 1 && (
                      <span
                        className={`h-0.5 flex-1 lg:w-8 rounded ${done ? 'bg-primary/40' : 'bg-border'}`}
                        aria-hidden
                      />
                    )}
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      </section>

      {/* ===== Contenu ===== */}
      <section className="py-8 sm:py-12">
        <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8">
          {facilities.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                Aucun terrain n&apos;est disponible pour le moment. Réessayez bientôt.
              </CardContent>
            </Card>
          ) : step === 'slot' ? (
            /* ============ ÉTAPE 1 : terrain + calendrier + créneaux ============ */
            <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              {/* ----- Colonne gauche : terrain + calendrier ----- */}
              <div className="grid gap-6 content-start">
                <div className="grid gap-2">
                  <Label className="flex items-center gap-1.5">
                    <Trophy className="size-3.5 text-primary" />
                    Terrain
                  </Label>
                  <div className="grid gap-2">
                    {facilities.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFacilityId(f.id)}
                        className={`rounded-xl border px-4 py-3 text-left transition-all cursor-pointer ${
                          facilityId === f.id
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'hover:border-primary/40'
                        }`}
                        aria-pressed={facilityId === f.id}
                      >
                        <p className="text-sm font-semibold leading-tight">{f.name}</p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3 text-primary" />
                            {formatPrice(f.pricePerHour)}/h
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="size-3" />
                            {f.capacity} joueurs
                          </span>
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Calendrier mensuel */}
                <div className="rounded-xl border bg-card">
                  <div className="flex items-center justify-between px-3 py-2.5 border-b">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      disabled={prevMonthDisabled}
                      onClick={() => setMonthCursor((m) => addMonths(m, -1))}
                      aria-label="Mois précédent"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <p className="text-sm font-semibold capitalize">
                      {format(monthCursor, 'MMMM yyyy', { locale: fr })}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      disabled={nextMonthDisabled}
                      onClick={() => setMonthCursor((m) => addMonths(m, 1))}
                      aria-label="Mois suivant"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                  <div className="p-3">
                    <div className="grid grid-cols-7 gap-1 mb-1">
                      {WEEKDAYS.map((d) => (
                        <p key={d} className="text-center text-[11px] font-medium text-muted-foreground py-1">
                          {d}
                        </p>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((day) => {
                        const iso = isoOf(day)
                        const inMonth = isSameMonth(day, monthCursor)
                        const past = iso < todayIso
                        const tooFar = iso > maxIso
                        const full = monthSummary !== null && (monthSummary[iso] ?? -1) === 0 && !past && !tooFar
                        const almostFull =
                          !full && monthSummary !== null && (monthSummary[iso] ?? 17) > 0 && (monthSummary[iso] ?? 17) <= 4
                        const disabled = !inMonth || past || tooFar || full
                        const selected = date === iso
                        const today = isSameDay(day, new Date())
                        return (
                          <button
                            key={iso}
                            type="button"
                            disabled={disabled}
                            onClick={() => setDate(iso)}
                            className={`relative h-10 rounded-lg text-sm transition-colors ${
                              selected
                                ? 'bg-primary text-primary-foreground font-bold shadow-sm cursor-pointer'
                                : disabled
                                  ? 'text-muted-foreground/40 cursor-not-allowed'
                                  : 'hover:bg-primary/10 cursor-pointer'
                            } ${full ? 'line-through' : ''} ${today && !selected ? 'ring-1 ring-primary/50 font-semibold' : ''}`}
                            aria-label={`Choisir le ${format(day, 'd MMMM', { locale: fr })}${full ? ' (complet)' : ''}`}
                            aria-pressed={selected}
                          >
                            {format(day, 'd')}
                            {almostFull && !selected ? (
                              <span
                                className="absolute bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-amber-500"
                                aria-hidden
                              />
                            ) : null}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* ----- Colonne droite : créneaux + récapitulatif ----- */}
              <div className="grid gap-6 content-start">
                <Card>
                  <CardContent className="p-5 grid gap-4">
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <Label className="flex items-center gap-1.5 min-w-0">
                        <Clock className="size-3.5 text-primary shrink-0" />
                        <span className="truncate">Créneaux du {formatDateFr(date)}</span>
                      </Label>
                      <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                        {slotsLoading ? '…' : `${freeCount} libre${freeCount > 1 ? 's' : ''} / ${slots.length}`}
                      </span>
                    </div>

                    {slotsLoading ? (
                      <div className="grid grid-cols-4 gap-2">
                        {Array.from({ length: 17 }).map((_, i) => (
                          <Skeleton key={i} className="h-16 rounded-xl" />
                        ))}
                      </div>
                    ) : slots.length === 0 ? (
                      <div className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
                        Disponibilités indisponibles pour cette date.
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-4 gap-2">
                          {slots.map((slot, idx) => {
                            const isSelected =
                              selection !== null && idx >= selection.start && idx <= selection.end
                            const stateLabel =
                              slot.state === 'BOOKED'
                                ? 'Réservé'
                                : slot.state === 'PAST'
                                  ? 'Passé'
                                  : slot.state === 'CLOSED'
                                    ? 'Fermé'
                                    : null
                            return (
                              <button
                                key={slot.start}
                                type="button"
                                disabled={slot.state !== 'FREE'}
                                onClick={() => toggleSlot(idx)}
                                className={`h-16 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all ${
                                  isSelected
                                    ? 'bg-primary border-primary text-primary-foreground shadow-md scale-[1.03]'
                                    : slot.state === 'FREE'
                                      ? 'hover:border-primary hover:bg-primary/5 cursor-pointer'
                                      : 'bg-muted/70 border-transparent text-muted-foreground/60 cursor-not-allowed grayscale'
                                }`}
                                aria-pressed={isSelected}
                                aria-label={`Créneau ${slot.start} – ${slot.end}${stateLabel ? ` (${stateLabel})` : ' (libre)'}`}
                              >
                                <span className="text-sm font-bold tabular-nums">{slot.start}</span>
                                <span className={`text-[10px] leading-none ${isSelected ? 'text-primary-foreground/80' : ''}`}>
                                  {stateLabel ?? `${slot.end}`}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                        {noSlotsLeft && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Info className="size-3.5 shrink-0" />
                            Plus de créneau disponible ce jour — choisissez une autre date.
                          </p>
                        )}
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground border-t pt-3">
                          <span className="flex items-center gap-1.5">
                            <span className="size-2.5 rounded-sm border border-primary/40 bg-primary/10" aria-hidden />
                            Libre
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="size-2.5 rounded-sm bg-muted grayscale border border-border" aria-hidden />
                            Réservé / passé (non réservable)
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="size-2.5 rounded-sm bg-amber-500" aria-hidden />
                            Bientôt complet
                          </span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Récapitulatif des montants */}
                <Card className="border-primary/25">
                  <CardContent className="p-5 grid gap-4">
                    {selection && facility ? (
                      <>
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-bold tabular-nums">
                              {slotRange}
                              <span className="text-muted-foreground font-normal"> · {hours} h</span>
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{facility.name}</p>
                          </div>
                          <Badge>{hours} heure{hours > 1 ? 's' : ''}</Badge>
                        </div>
                        <div className="border-t pt-3 grid gap-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Total de la location</span>
                            <span className="font-semibold tabular-nums">{formatPrice(total)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Acompte à payer avec Wave</span>
                            <span className="font-bold text-[#0090D2] dark:text-[#4DC3F0] tabular-nums">
                              {formatPrice(deposit)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Solde à régler sur place</span>
                            <span className="font-semibold tabular-nums">{formatPrice(balance)}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Info className="size-4 shrink-0 text-primary" />
                        Sélectionnez un ou plusieurs créneaux libres (heures consécutives).
                      </p>
                    )}
                    <Button type="button" size="lg" disabled={!canContinue} onClick={() => setStep('details')}>
                      {hours > 0 ? `Continuer — acompte ${formatPrice(deposit)}` : 'Continuer'}
                      <ArrowRight className="size-4" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : step === 'details' && facility ? (
            /* ============ ÉTAPE 2 : coordonnées ============ */
            <div className="grid gap-6 lg:grid-cols-2 max-w-5xl mx-auto items-start">
              {/* Résumé */}
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-5 sm:p-6 grid gap-3">
                  <p className="font-bold flex items-center gap-2">
                    <CalendarCheck className="size-5 text-primary" />
                    Votre réservation
                  </p>
                  <div className="grid gap-2.5 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Trophy className="size-4" /> Terrain
                      </span>
                      <span className="font-semibold text-right">{facility.name}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <CalendarCheck className="size-4" /> Date
                      </span>
                      <span className="font-semibold">{formatDateFr(date)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Clock className="size-4" /> Créneau
                      </span>
                      <span className="font-semibold tabular-nums">
                        {slotRange} ({hours} h)
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Users className="size-4" /> Capacité
                      </span>
                      <span className="text-muted-foreground">{facility.capacity} joueurs</span>
                    </div>
                  </div>
                  <div className="border-t pt-3 mt-1 grid gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total de la location</span>
                      <span className="font-semibold tabular-nums">{formatPrice(total)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Acompte avec Wave</span>
                      <span className="font-bold text-[#0090D2] dark:text-[#4DC3F0] tabular-nums">
                        {formatPrice(deposit)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Solde sur place</span>
                      <span className="font-semibold tabular-nums">{formatPrice(balance)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Formulaire */}
              <Card>
                <CardContent className="p-5 sm:p-6">
                  <form onSubmit={handleSubmit} className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="bk-name">Nom complet *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          id="bk-name"
                          className="pl-9"
                          placeholder="Ex. Aïssatou Diallo"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          required
                          minLength={2}
                          autoComplete="name"
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="bk-phone">Numéro de téléphone (Wave) *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          id="bk-phone"
                          className="pl-9"
                          type="tel"
                          inputMode="tel"
                          placeholder="77 123 45 67"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          required
                          autoComplete="tel"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Tapez votre numéro directement, sans indicatif — ex. 77 123 45 67. C&apos;est
                        celui qui recevra la confirmation et le suivi de votre réservation.
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#00A0E7]/30 bg-[#00A0E7]/[0.04] px-4 py-3 flex items-start gap-3">
                      <Image
                        src="/wave-brand.png"
                        alt="Wave"
                        width={332}
                        height={419}
                        className="h-[43px] w-auto rounded-lg shrink-0 shadow-sm"
                      />
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Après validation, votre créneau est <strong className="text-foreground">bloqué</strong>{' '}
                        et vous payez l&apos;acompte de{' '}
                        <strong className="text-foreground">{formatPrice(deposit)}</strong> avec Wave. Le
                        solde de <strong className="text-foreground">{formatPrice(balance)}</strong> se
                        règle sur place.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep('slot')}
                        disabled={submitting}
                      >
                        <ArrowLeft className="size-4" />
                        Retour
                      </Button>
                      <button
                        type="submit"
                        disabled={!canSubmit || submitting}
                        className="inline-flex h-10 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
                      >
                        {submitting ? <Loader2 className="size-4 animate-spin" /> : <CalendarCheck className="size-4" />}
                        {submitting ? 'Réservation…' : 'Valider ma réservation'}
                      </button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          ) : step === 'done' && created ? (
            /* ============ ÉTAPE 3 : confirmation + paiement Wave ============ */
            <div className="max-w-2xl mx-auto grid gap-6">
              <Card>
                <CardContent className="p-6 sm:p-8 grid gap-6">
                  <div className="flex flex-col items-center text-center gap-3">
                    <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <CheckCircle2 className="size-9" />
                    </span>
                    <div>
                      <p className="text-xl font-extrabold">
                        Créneau bloqué, {created.customerName.split(' ')[0]} !
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDateFr(created.date)} · {created.startTime} →{' '}
                        {formatHourLabel(created.endTime)} · {created.facility?.name}
                      </p>
                    </div>
                    <div className="rounded-xl border bg-muted/40 px-4 py-2.5 text-sm">
                      <span className="text-muted-foreground">Référence </span>
                      <span className="font-mono font-bold tracking-wide">
                        {created.reference.slice(0, 10).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Paiement de l'acompte avec Wave */}
                  <div className="rounded-2xl border border-[#00A0E7]/30 bg-[#00A0E7]/[0.04] p-5 grid gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <Image
                          src="/wave-brand.png"
                          alt="Icône de paiement Wave"
                          width={332}
                          height={419}
                          className="h-16 w-auto rounded-xl shrink-0 shadow-sm"
                        />
                        <div className="min-w-0">
                          <p className="font-bold">Acompte à payer avec Wave</p>
                          <p className="text-xs text-muted-foreground">
                            {formatPrice(DEPOSIT_PER_HOUR)} par heure réservée · sécurise votre créneau
                          </p>
                        </div>
                      </div>
                      <p className="text-2xl font-extrabold text-[#0090D2] dark:text-[#4DC3F0] tabular-nums">
                        {formatPrice(depositToPay)}
                      </p>
                    </div>

                    {waveLink ? (
                      <div className="grid gap-2">
                        <Button
                          type="button"
                          size="lg"
                          className="h-12 text-base bg-[#00A0E7] hover:bg-[#0090D2] text-white"
                          onClick={payWithWave}
                        >
                          <Image
                            src="/wave-brand.png"
                            alt=""
                            width={332}
                            height={419}
                            className="h-7 w-auto rounded-[5px] shrink-0"
                          />
                          Payer {formatPrice(depositToPay)} avec Wave
                        </Button>
                        <p className="text-xs text-muted-foreground text-center leading-relaxed">
                          Le paiement s&apos;ouvre dans un nouvel onglet. Dès réception de l&apos;acompte,
                          votre réservation passe en « Confirmée ». Le solde de{' '}
                          <strong className="text-foreground">{formatPrice(balanceToPay)}</strong> est à
                          régler sur place à votre arrivée.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed px-4 py-4 flex items-start gap-3 text-sm bg-muted/30">
                        <Info className="size-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-muted-foreground leading-relaxed">
                          Le paiement <strong className="text-foreground">Wave</strong> est en cours
                          d&apos;activation. Votre réservation est bien enregistrée : notre équipe vous
                          contacte au{' '}
                          <strong className="text-foreground">{created.customerPhone}</strong> pour
                          finaliser l&apos;acompte de{' '}
                          <strong className="text-foreground">{formatPrice(depositToPay)}</strong>.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl bg-primary/5 border border-primary/25 px-4 py-3 text-sm text-muted-foreground leading-relaxed">
                    <p className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
                      <Clock className="size-4 text-primary" /> Et ensuite ?
                    </p>
                    Présentez votre référence à l&apos;accueil 10 minutes avant le coup d&apos;envoi.
                    Vestiaires, douches et éclairage nocturne inclus.
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <Button type="button" variant="outline" onClick={reset}>
                      <CalendarCheck className="size-4" />
                      Faire une autre réservation
                    </Button>
                    <Button type="button" onClick={onBack}>
                      <ArrowLeft className="size-4" />
                      Retour à l&apos;accueil
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
