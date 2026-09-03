'use client'

import { useMemo, useState } from 'react'
import {
  ArrowDownWideNarrow,
  Ban,
  BadgeCheck,
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Timer,
  Trash2,
  User,
  Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { apiFetch, ApiError } from './api'
import {
  PAYMENT_METHOD_META,
  PAYMENT_STATUS_META,
  RESERVATION_STATUS_META,
  formatHourLabel,
  formatPrice,
  type Facility,
  type Reservation,
} from './types'

type NewReservationForm = {
  customerName: string
  customerEmail: string
  customerPhone: string
  facilityId: string
  date: string
  startTime: string
  endTime: string
  status: string
  notes: string
}

type SortMode = 'recent' | 'upcoming'

const SORT_OPTIONS: { value: SortMode; label: string; title: string }[] = [
  { value: 'recent', label: 'Récentes', title: 'Classer par date et heure récentes (les plus récentes en premier)' },
  { value: 'upcoming', label: 'Prochaines', title: 'Classer par date et heure proches (aujourd’hui et à venir en premier)' },
]

/** Date du jour au format YYYY-MM-JJ (heure locale). */
function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Minutes depuis minuit ("18:30" → 1110 ; "00:00" = minuit de fin de journée → 1440). */
function timeToMinutes(time: string, _endOfDay = false): number {
  const [h, m] = time.split(':').map(Number)
  const hours = Number.isFinite(h) ? h : 0
  const minutes = Number.isFinite(m) ? m : 0
  const total = hours * 60 + minutes
  if (total === 0) return 24 * 60
  return total
}

/** Intervalle du créneau, minuit franchi inclus ("23:00"→"01:00" = 1380 → 1500). */
function slotRange(start: string, end: string): { start: number; end: number } {
  const s = timeToMinutes(start)
  let e = timeToMinutes(end, true)
  if (e < s && e <= 8 * 60) e += 24 * 60
  return { start: s, end: e }
}

/** Minutes actuelles depuis minuit. */
function nowMinutes(): number {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

/** Le créneau est-il entièrement terminé ? (gère les nocturnes après minuit) */
function isReservationPast(r: Reservation): boolean {
  const today = todayStr()
  if (r.date > today) return false
  const { end } = slotRange(r.startTime, r.endTime)
  if (r.date === today) return end <= nowMinutes()
  // Réservation d'hier qui franchit minuit : terminée seulement après sa fin réelle
  if (end > 24 * 60) return end - 24 * 60 <= nowMinutes()
  return true
}

/**
 * Créneau valide : la fin est strictement après le début,
 * y compris en franchissant minuit ("23:00" → "01:00").
 */
function isValidSlot(start: string, end: string): boolean {
  const { start: s, end: e } = slotRange(start, end)
  return e > s
}

function emptyForm(facilities: Facility[]): NewReservationForm {
  const d = new Date()
  return {
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    facilityId: facilities[0]?.id ?? '',
    date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    startTime: '18:00',
    endTime: '19:00',
    status: 'CONFIRMED',
    notes: '',
  }
}

/** Dialogue « Ajouter une réservation » (création directe par un admin). */
function AddReservationDialog({
  open,
  onOpenChange,
  facilities,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  facilities: Facility[]
  onCreated: () => void
}) {
  const { toast } = useToast()
  const [form, setForm] = useState<NewReservationForm>(() => emptyForm(facilities))
  const [submitting, setSubmitting] = useState(false)

  const set = (patch: Partial<NewReservationForm>) => setForm((prev) => ({ ...prev, ...patch }))

  const selectedFacility = facilities.find((f) => f.id === form.facilityId)
  const canSubmit =
    form.customerName.trim().length > 1 &&
    form.facilityId &&
    form.date &&
    form.startTime &&
    isValidSlot(form.startTime, form.endTime)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || submitting) return
    setSubmitting(true)
    try {
      const result = await apiFetch<{ reservation: Reservation }>('/api/reservations', {
        method: 'POST',
        auth: true,
        body: {
          customerName: form.customerName.trim(),
          customerEmail: form.customerEmail.trim() || null,
          customerPhone: form.customerPhone.trim() || null,
          facilityId: form.facilityId,
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          status: form.status,
          notes: form.notes.trim() || null,
          source: 'ADMIN',
        },
      })
      toast({
        title: 'Réservation créée ✅',
        description: `${result.reservation.customerName} — ${result.reservation.date} ${result.reservation.startTime}. Réf. ${result.reservation.reference}.`,
      })
      onCreated()
      setForm(emptyForm(facilities))
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Création impossible. Réessayez.'
      toast({ title: 'Échec de la création', description: message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setForm(emptyForm(facilities))
        onOpenChange(o)
      }}
    >
      <DialogContent className="sm:max-w-lg zalspor-scroll max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CalendarPlus className="size-5 text-primary" />
            Ajouter une réservation
          </DialogTitle>
          <DialogDescription>
            Créez une réservation pour un client (par téléphone ou en présentiel).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="res-name">Nom du client *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="res-name"
                placeholder="Ex. Cheikh Fall"
                className="pl-9"
                value={form.customerName}
                onChange={(e) => set({ customerName: e.target.value })}
                required
                minLength={2}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="res-email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="res-email"
                  type="email"
                  placeholder="client@exemple.com"
                  className="pl-9"
                  value={form.customerEmail}
                  onChange={(e) => set({ customerEmail: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="res-phone">Téléphone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="res-phone"
                  placeholder="+221 77 000 00 00"
                  className="pl-9"
                  value={form.customerPhone}
                  onChange={(e) => set({ customerPhone: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="res-facility">Terrain *</Label>
            <Select value={form.facilityId} onValueChange={(v) => set({ facilityId: v })}>
              <SelectTrigger id="res-facility">
                <SelectValue placeholder="Choisir un terrain" />
              </SelectTrigger>
              <SelectContent>
                {facilities.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name} — {formatPrice(f.pricePerHour)}/h
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="res-date">Date *</Label>
              <Input id="res-date" type="date" value={form.date} onChange={(e) => set({ date: e.target.value })} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="res-start">Début *</Label>
              <Input id="res-start" type="time" value={form.startTime} onChange={(e) => set({ startTime: e.target.value })} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="res-end">Fin *</Label>
              <Input id="res-end" type="time" value={form.endTime} onChange={(e) => set({ endTime: e.target.value })} required />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="res-status">Statut initial</Label>
            <Select value={form.status} onValueChange={(v) => set({ status: v })}>
              <SelectTrigger id="res-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="CONFIRMED">Confirmée</SelectItem>
                <SelectItem value="CANCELLED">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="res-notes">Notes internes</Label>
            <Textarea
              id="res-notes"
              placeholder="Match amical, acompte versé…"
              rows={2}
              value={form.notes}
              onChange={(e) => set({ notes: e.target.value })}
            />
          </div>

          {selectedFacility && (
            <div className="rounded-lg bg-muted/60 border px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="size-4 shrink-0" />
              Tarif : <strong className="text-foreground">{formatPrice(selectedFacility.pricePerHour)}/heure</strong>
              <Badge variant="outline" className="ml-auto">{selectedFacility.name.split('—')[0].trim()}</Badge>
            </div>
          )}

          <DialogFooter className="mt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!canSubmit || submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {submitting ? 'Création…' : 'Créer la réservation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const STATUS_FILTERS = [
  { value: 'ALL', label: 'Toutes' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'CONFIRMED', label: 'Confirmées' },
  { value: 'CANCELLED', label: 'Annulées' },
]

/** Libellé compact de la date : « Aujourd’hui », « Demain » ou date courte. */
function dateLabel(date: string): { text: string; isToday: boolean } {
  const today = todayStr()
  if (date === today) return { text: "Aujourd'hui", isToday: true }
  const [y, m, d] = date.split('-').map(Number)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`
  if (date === tStr) return { text: 'Demain', isToday: false }
  if (y && m && d) {
    return {
      text: new Date(y, m - 1, d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }),
      isToday: false,
    }
  }
  return { text: date, isToday: false }
}

export function ReservationsSection({
  reservations,
  facilities,
  loading,
  onRefresh,
  onUnauthorized,
}: {
  reservations: Reservation[]
  facilities: Facility[]
  loading: boolean
  onRefresh: () => void
  onUnauthorized: () => void
}) {
  const { toast } = useToast()
  const [addOpen, setAddOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('recent')
  const [busyId, setBusyId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return reservations
      .filter((r) => statusFilter === 'ALL' || r.status === statusFilter)
      .filter((r) => {
        if (!q) return true
        return (
          r.customerName.toLowerCase().includes(q) ||
          r.reference.toLowerCase().includes(q) ||
          (r.facility?.name ?? '').toLowerCase().includes(q) ||
          (r.customerPhone ?? '').toLowerCase().includes(q)
        )
      })
  }, [reservations, statusFilter, search])

  /** Tri : « Récentes » (date+heure décroissantes) ou « Prochaines » (proches d'abord). */
  const sorted = useMemo(() => {
    const list = [...filtered]
    const today = todayStr()
    // Tri chronologique réel : le créneau de minuit (00:00) est le dernier de la journée
    if (sortMode === 'recent') {
      list.sort((a, b) =>
        a.date === b.date
          ? timeToMinutes(b.startTime) - timeToMinutes(a.startTime)
          : b.date.localeCompare(a.date),
      )
    } else {
      list.sort((a, b) => {
        const aUpcoming = a.date >= today
        const bUpcoming = b.date >= today
        if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1
        if (aUpcoming) {
          return a.date === b.date
            ? timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
            : a.date.localeCompare(b.date)
        }
        return a.date === b.date
          ? timeToMinutes(b.startTime) - timeToMinutes(a.startTime)
          : b.date.localeCompare(b.date)
      })
    }
    return list
  }, [filtered, sortMode])

  async function updateStatus(id: string, status: string) {
    setBusyId(id)
    try {
      await apiFetch(`/api/reservations/${id}`, { method: 'PATCH', auth: true, body: { status } })
      toast({
        title: 'Statut mis à jour',
        description: status === 'CONFIRMED' ? 'La réservation est confirmée.' : 'La réservation est annulée.',
      })
      onRefresh()
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return onUnauthorized()
      toast({
        title: 'Action impossible',
        description: error instanceof ApiError ? error.message : 'Réessayez.',
        variant: 'destructive',
      })
    } finally {
      setBusyId(null)
    }
  }

  /** Marque l'acompte d'une réservation comme reçu / non reçu (Wave ou sur place). */
  async function updatePayment(id: string, paymentStatus: 'PAID' | 'UNPAID') {
    setBusyId(id)
    try {
      await apiFetch(`/api/reservations/${id}`, { method: 'PATCH', auth: true, body: { paymentStatus } })
      toast({
        title: 'Paiement mis à jour',
        description:
          paymentStatus === 'PAID'
            ? 'L’acompte est marqué comme reçu.'
            : 'L’acompte est marqué comme non reçu.',
      })
      onRefresh()
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return onUnauthorized()
      toast({
        title: 'Action impossible',
        description: error instanceof ApiError ? error.message : 'Réessayez.',
        variant: 'destructive',
      })
    } finally {
      setBusyId(null)
    }
  }

  async function deleteReservation(id: string) {
    setBusyId(id)
    try {
      await apiFetch(`/api/reservations/${id}`, { method: 'DELETE', auth: true })
      toast({ title: 'Réservation supprimée' })
      onRefresh()
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return onUnauthorized()
      toast({
        title: 'Suppression impossible',
        description: error instanceof ApiError ? error.message : 'Réessayez.',
        variant: 'destructive',
      })
    } finally {
      setBusyId(null)
    }
  }

  const counts = useMemo(
    () => ({
      ALL: reservations.length,
      PENDING: reservations.filter((r) => r.status === 'PENDING').length,
      CONFIRMED: reservations.filter((r) => r.status === 'CONFIRMED').length,
      CANCELLED: reservations.filter((r) => r.status === 'CANCELLED').length,
    }),
    [reservations],
  )

  /** Menu d'actions commun (table + cartes). */
  const actionsMenu = (r: Reservation) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          aria-label="Actions"
          disabled={busyId === r.id}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>
          Réf. {r.reference.slice(0, 10).toUpperCase()}
        </DropdownMenuLabel>
        {r.status !== 'CONFIRMED' && (
          <DropdownMenuItem onClick={() => updateStatus(r.id, 'CONFIRMED')}>
            <CheckCircle2 className="size-4 text-emerald-600" />
            Confirmer
          </DropdownMenuItem>
        )}
        {r.status !== 'CANCELLED' && (
          <DropdownMenuItem onClick={() => updateStatus(r.id, 'CANCELLED')}>
            <Ban className="size-4 text-orange-600" />
            Annuler
          </DropdownMenuItem>
        )}
        {r.paymentStatus !== 'PAID' ? (
          <DropdownMenuItem onClick={() => updatePayment(r.id, 'PAID')}>
            <BadgeCheck className="size-4 text-emerald-600" />
            Acompte reçu
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => updatePayment(r.id, 'UNPAID')}>
            <Wallet className="size-4 text-muted-foreground" />
            Acompte non reçu
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => deleteReservation(r.id)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="size-4" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Réservations</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} affichée{filtered.length > 1 ? 's' : ''} sur {reservations.length} au total
          </p>
        </div>

        <Button onClick={() => setAddOpen(true)} size="lg" className="shadow-sm">
          <Plus className="size-4" />
          Ajouter une réservation
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {STATUS_FILTERS.map((f) => (
                <Button
                  key={f.value}
                  size="sm"
                  variant={statusFilter === f.value ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(f.value)}
                  className="h-8"
                >
                  {f.label}
                  <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[11px] font-semibold">
                    {counts[f.value as keyof typeof counts]}
                  </Badge>
                </Button>
              ))}
              {/* Tri par date/heure */}
              <span className="hidden xl:inline-flex items-center gap-1 text-xs text-muted-foreground ml-2">
                <ArrowDownWideNarrow className="size-3.5" />
                Tri :
              </span>
              <div className="flex gap-1">
                {SORT_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    size="sm"
                    variant={sortMode === opt.value ? 'secondary' : 'ghost'}
                    title={opt.title}
                    onClick={() => setSortMode(opt.value)}
                    className="h-8 px-2.5"
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="relative w-full xl:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher (client, téléphone, référence, terrain)…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Rechercher une réservation"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="size-6 animate-spin mr-2" />
              Chargement des réservations…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <CalendarPlus className="size-10 opacity-30" />
              <p className="text-sm">Aucune réservation ne correspond à ces critères.</p>
              <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="size-4" />
                Ajouter une réservation
              </Button>
            </div>
          ) : (
            <>
              {/* ===== Vue table (desktop) — compacte, sans défilement horizontal ===== */}
              <div className="hidden md:block overflow-x-auto zalspor-scroll">
                <Table className="min-w-0 w-full table-auto">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead className="hidden xl:table-cell">Terrain</TableHead>
                      <TableHead>Créneau</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Paiement</TableHead>
                      <TableHead className="w-12 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.map((r) => {
                      const meta = RESERVATION_STATUS_META[r.status] ?? {
                        label: r.status,
                        variant: 'outline' as const,
                      }
                      const payMeta = PAYMENT_STATUS_META[r.paymentStatus] ?? {
                        label: r.paymentStatus,
                        variant: 'outline' as const,
                      }
                      const past = isReservationPast(r)
                      const dLabel = dateLabel(r.date)
                      return (
                        <TableRow
                          key={r.id}
                          className={busyId === r.id ? 'opacity-50' : past ? 'opacity-55' : undefined}
                        >
                          <TableCell className="max-w-[180px]">
                            <div className="font-medium truncate">{r.customerName}</div>
                            {r.customerPhone && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Phone className="size-3 shrink-0" />
                                <span className="truncate">{r.customerPhone}</span>
                              </div>
                            )}
                            <div className="text-[10px] font-mono text-muted-foreground/70 mt-0.5 xl:hidden">
                              {r.reference.slice(0, 10).toUpperCase()}
                              {r.source === 'ADMIN' ? ' · admin' : ''}
                            </div>
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            <div className="text-sm truncate max-w-[160px]">{r.facility?.name ?? '—'}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {r.source === 'ADMIN' ? 'Créée par un admin' : 'Site web'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div
                              className={`text-sm font-semibold whitespace-nowrap ${
                                dLabel.isToday ? 'text-primary' : ''
                              }`}
                            >
                              {dLabel.text}
                              {past && <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">passé</span>}
                            </div>
                            <div className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1 mt-0.5">
                              <Timer className="size-3 shrink-0" />
                              {r.startTime} – {formatHourLabel(r.endTime)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={meta.variant} className="whitespace-nowrap">
                              {meta.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[190px]">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {r.paymentMethod ? (
                                <Badge variant="outline" className="px-1.5 py-0 text-[11px] font-medium whitespace-nowrap">
                                  {PAYMENT_METHOD_META[r.paymentMethod] ?? r.paymentMethod}
                                </Badge>
                              ) : null}
                              <Badge variant={payMeta.variant} className="px-1.5 py-0 text-[11px] whitespace-nowrap">
                                {payMeta.label}
                              </Badge>
                            </div>
                            {typeof r.amount === 'number' && (
                              <div className="text-[11px] text-muted-foreground mt-1 whitespace-nowrap">
                                {formatPrice(r.amount)}
                                {typeof r.depositAmount === 'number' && (
                                  <span className="text-muted-foreground/80"> · ac. {formatPrice(r.depositAmount)}</span>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">{actionsMenu(r)}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* ===== Vue cartes (mobile) — empilées, zéro défilement latéral ===== */}
              <div className="md:hidden divide-y">
                {sorted.map((r) => {
                  const meta = RESERVATION_STATUS_META[r.status] ?? {
                    label: r.status,
                    variant: 'outline' as const,
                  }
                  const payMeta = PAYMENT_STATUS_META[r.paymentStatus] ?? {
                    label: r.paymentStatus,
                    variant: 'outline' as const,
                  }
                  const past = isReservationPast(r)
                  const dLabel = dateLabel(r.date)
                  return (
                    <div
                      key={r.id}
                      className={`p-4 flex flex-col gap-2 ${busyId === r.id ? 'opacity-50' : past ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant={meta.variant}>{meta.label}</Badge>
                          <Badge variant={payMeta.variant} className="px-1.5 py-0 text-[11px]">
                            {payMeta.label}
                          </Badge>
                          {r.paymentMethod && (
                            <Badge variant="outline" className="px-1.5 py-0 text-[11px] font-medium">
                              {PAYMENT_METHOD_META[r.paymentMethod] ?? r.paymentMethod}
                            </Badge>
                          )}
                        </div>
                        {actionsMenu(r)}
                      </div>

                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{r.customerName}</p>
                          {r.customerPhone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Phone className="size-3 shrink-0" />
                              <span className="truncate">{r.customerPhone}</span>
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-sm font-semibold ${dLabel.isToday ? 'text-primary' : ''}`}>
                            {dLabel.text}
                            {past && <span className="ml-1 text-[10px] font-normal text-muted-foreground">passé</span>}
                          </p>
                          <p className="text-xs text-muted-foreground whitespace-nowrap">
                            {r.startTime} – {formatHourLabel(r.endTime)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5 min-w-0">
                          <CalendarClock className="size-3.5 shrink-0" />
                          <span className="truncate">{r.facility?.name ?? '—'}</span>
                        </span>
                        <span className="whitespace-nowrap">
                          {typeof r.amount === 'number' ? formatPrice(r.amount) : '—'}
                          {typeof r.depositAmount === 'number' && (
                            <span className="text-muted-foreground/80"> · ac. {formatPrice(r.depositAmount)}</span>
                          )}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-muted-foreground/70">
                        {r.reference.slice(0, 10).toUpperCase()}
                        {r.source === 'ADMIN' ? ' · créée par un admin' : ' · site web'}
                      </p>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AddReservationDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        facilities={facilities.filter((f) => f.active)}
        onCreated={onRefresh}
      />
    </div>
  )
}
