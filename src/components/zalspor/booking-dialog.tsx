'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
  Loader2,
  Phone,
  User,
  Users,
  Waves,
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
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

// ============================================================
// Réservation client : calendrier visible + créneaux horaires
// 08:00 → 00:00 (minuit), 1 h par créneau.
// Étape 1 : terrain + date + créneaux · Étape 2 : coordonnées
// + paiement Wave · Étape 3 : confirmation avec référence.
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

export function BookingDialog({
  open,
  onOpenChange,
  facilities,
  preselectedFacilityId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  facilities: Facility[]
  preselectedFacilityId?: string
}) {
  const { toast } = useToast()

  const [step, setStep] = useState<Step>('slot')
  const [facilityId, setFacilityId] = useState('')
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

  // ===== Ouverture : terrain présélectionné + réinitialisation =====
  useEffect(() => {
    if (open) {
      setStep('slot')
      setSelection(null)
      setCreated(null)
      setDate(isoOf(new Date()))
      setMonthCursor(startOfMonth(new Date()))
      setFacilityId(preselectedFacilityId ?? facilities[0]?.id ?? '')
      // Lien de paiement Wave (configuré par l'admin)
      apiFetch<PublicSettings>('/api/settings')
        .then((s) => setWaveLink(s.wavePaymentLink))
        .catch(() => setWaveLink(null))
    }
  }, [open, preselectedFacilityId, facilities])

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
    if (open) {
      setSelection(null)
      loadSlots(facilityId, date)
    }
  }, [open, facilityId, date, loadSlots])

  // ===== Résumé mensuel (calendrier : jours complets / bientôt complets) =====
  useEffect(() => {
    if (!open || !facilityId) return
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
  }, [open, facilityId, monthCursor])

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
        description: `Référence ${result.reservation.reference.slice(0, 10).toUpperCase()}. Effectuez le paiement Wave pour la confirmer.`,
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

  function payWithWave() {
    if (!waveLink || !created) return
    const url = buildWaveUrl(waveLink, { amount: created.amount ?? 0, reference: created.reference })
    window.open(url, '_blank', 'noopener')
  }

  // ===== Rendu =====
  const stepTitles: Record<Step, { title: string; desc: string }> = {
    slot: {
      title: 'Réserver votre créneau',
      desc: 'Choisissez le terrain, la date puis votre créneau horaire (08:00 → minuit).',
    },
    details: {
      title: 'Vos coordonnées',
      desc: 'Laissez votre nom et votre numéro de téléphone, puis payez avec Wave.',
    },
    done: { title: 'Réservation enregistrée', desc: 'Votre créneau est bloqué, il ne reste qu’à payer.' },
  }

  const freeCount = slots.filter((s) => s.state === 'FREE').length
  const noSlotsLeft = !slotsLoading && slots.length > 0 && freeCount === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg zalspor-scroll max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CalendarCheck className="size-5 text-primary" />
            {stepTitles[step].title}
          </DialogTitle>
          <DialogDescription>{stepTitles[step].desc}</DialogDescription>
        </DialogHeader>

        {/* ============ ÉTAPE 1 : terrain + calendrier + créneaux ============ */}
        {step === 'slot' && (
          <div className="grid gap-5">
            {facilities.length > 1 ? (
              <div className="grid grid-cols-1 gap-2">
                <Label>Terrain</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {facilities.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFacilityId(f.id)}
                      className={`rounded-xl border px-3 py-2.5 text-left transition-all cursor-pointer ${
                        facilityId === f.id
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'hover:border-primary/40'
                      }`}
                      aria-pressed={facilityId === f.id}
                    >
                      <p className="text-sm font-semibold leading-tight truncate">{f.name.split('—')[0].trim()}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatPrice(f.pricePerHour)}/h · {f.capacity} joueurs
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : facilities.length === 1 ? (
              <Card>
                <CardContent className="flex items-center justify-between py-3 px-4">
                  <span className="text-sm font-semibold">{facilities[0].name}</span>
                  <span className="text-sm text-primary font-bold">{formatPrice(facilities[0].pricePerHour)}/h</span>
                </CardContent>
              </Card>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun terrain disponible pour le moment.</p>
            )}

            {/* ----- Calendrier mensuel ----- */}
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
                      !full && monthSummary !== null && (monthSummary[iso] ?? 16) > 0 && (monthSummary[iso] ?? 16) <= 4
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

            {/* ----- Grille des créneaux 08:00 → minuit ----- */}
            <div className="grid gap-2">
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
                  {Array.from({ length: 16 }).map((_, i) => (
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
                        slot.state === 'BOOKED' ? 'Réservé' : slot.state === 'PAST' ? 'Passé' : slot.state === 'CLOSED' ? 'Fermé' : null
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
                </>
              )}
            </div>

            {/* ----- Récapitulatif + continuation ----- */}
            <div className="rounded-xl bg-muted/50 border px-4 py-3 flex items-center justify-between gap-3 min-h-14">
              {selection && facility ? (
                <>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {slots[selection.start]?.start} → {formatHourLabel(slots[selection.end]?.end ?? '')}
                      <span className="text-muted-foreground font-normal"> · {hours} h</span>
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{facility.name}</p>
                  </div>
                  <p className="text-lg font-extrabold text-primary whitespace-nowrap">{formatPrice(total)}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sélectionnez un créneau libre (plusieurs heures consécutives possibles).
                </p>
              )}
            </div>
          </div>
        )}

        {/* ============ ÉTAPE 2 : coordonnées + paiement Wave ============ */}
        {step === 'details' && facility && selection && (
          <form onSubmit={handleSubmit} className="grid gap-4">
            {/* Récap */}
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="py-4 px-5 grid gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <CalendarCheck className="size-4" /> {formatDateFr(date)}
                  </span>
                  <span className="font-bold">{formatDateFr(date).split(' ')[1] ?? ''}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="size-4" /> Créneau
                  </span>
                  <span className="font-semibold tabular-nums">
                    {slots[selection.start]?.start} → {formatHourLabel(slots[selection.end]?.end ?? '')} ({hours} h)
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Users className="size-4" /> {facility.name}
                  </span>
                  <span className="text-muted-foreground">{facility.capacity} joueurs</span>
                </div>
                <div className="border-t pt-2 mt-1 flex items-center justify-between">
                  <span className="text-sm font-semibold">Total à payer</span>
                  <span className="text-xl font-extrabold text-primary">{formatPrice(total)}</span>
                </div>
              </CardContent>
            </Card>

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
                  placeholder="+221 77 000 00 00"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                  autoComplete="tel"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Le numéro sur lequel vous recevrez la confirmation et le suivi de votre réservation.
              </p>
            </div>

            <div className="rounded-xl border px-4 py-3 flex items-start gap-3 text-sm bg-muted/40">
              <Waves className="size-5 text-[#00A0E7] shrink-0 mt-0.5" />
              <p className="text-muted-foreground leading-relaxed">
                Après validation, votre créneau est <strong className="text-foreground">bloqué</strong> et vous êtes
                redirigé vers <strong className="text-foreground">Wave</strong> pour régler{' '}
                <strong className="text-foreground">{formatPrice(total)}</strong>. La réservation est confirmée dès
                réception du paiement.
              </p>
            </div>

            <DialogFooter className="mt-1 gap-2 sm:gap-0">
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
                className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[#00A0E7] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0090D2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A0E7] disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <Waves className="size-4" />}
                {submitting ? 'Réservation…' : `Valider et payer ${formatPrice(total)}`}
              </button>
            </DialogFooter>
          </form>
        )}

        {/* ============ ÉTAPE 3 : confirmation ============ */}
        {step === 'done' && created && (
          <div className="grid gap-5">
            <div className="flex flex-col items-center text-center gap-3 pt-2">
              <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CheckCircle2 className="size-9" />
              </span>
              <div>
                <p className="text-lg font-bold">Créneau bloqué, {created.customerName.split(' ')[0]} !</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatDateFr(created.date)} · {created.startTime} → {formatHourLabel(created.endTime)} ·{' '}
                  {created.facility?.name}
                </p>
              </div>
              <div className="rounded-xl border bg-muted/40 px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">Référence </span>
                <span className="font-mono font-bold tracking-wide">
                  {created.reference.slice(0, 10).toUpperCase()}
                </span>
              </div>
            </div>

            {waveLink ? (
              <div className="grid gap-3">
                <Button
                  type="button"
                  size="lg"
                  className="h-12 text-base bg-[#00A0E7] hover:bg-[#0090D2] text-white"
                  onClick={payWithWave}
                >
                  <Waves className="size-5" />
                  Payer {formatPrice(created.amount ?? total)} avec Wave
                </Button>
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  Le paiement s&apos;ouvre dans un nouvel onglet. Dès réception, votre résération passe en
                  « Confirmée ».
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed px-4 py-4 flex items-start gap-3 text-sm bg-muted/30">
                <Info className="size-5 text-primary shrink-0 mt-0.5" />
                <p className="text-muted-foreground leading-relaxed">
                  Le paiement <strong className="text-foreground">Wave Business</strong> est en cours
                  d&apos;activation. Votre réservation est bien enregistrée : notre équipe vous contacte au{' '}
                  <strong className="text-foreground">{created.customerPhone}</strong> pour finaliser le règlement de{' '}
                  <strong className="text-foreground">{formatPrice(created.amount ?? total)}</strong>.
                </p>
              </div>
            )}

            <div className="rounded-xl bg-primary/5 border border-primary/25 px-4 py-3 text-sm text-muted-foreground leading-relaxed">
              <p className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
                <Clock className="size-4 text-primary" /> Et ensuite ?
              </p>
              Présentez votre référence à l&apos;accueil 10 minutes avant le coup d&apos;envoi. Vestiaires, douches et
              éclairage nocturne inclus.
            </div>

            <DialogFooter>
              <Button type="button" className="w-full" onClick={() => onOpenChange(false)}>
                Terminer
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Pied de l'étape 1 */}
        {step === 'slot' && (
          <DialogFooter className="mt-1">
            <Button type="button" className="w-full" size="lg" disabled={!canContinue} onClick={() => setStep('details')}>
              {hours > 0 ? `Continuer — ${formatPrice(total)}` : 'Continuer'}
              <ChevronRight className="size-4" />
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
