'use client'

import { useMemo, useState } from 'react'
import {
  Ban,
  BadgeCheck,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
  Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  formatDateFr,
  formatHourLabel,
  formatPrice,
  type Admin,
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

/** Minutes écoulées depuis minuit ("18:30" → 1110). */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  const hours = Number.isFinite(h) ? h : 0
  const minutes = Number.isFinite(m) ? m : 0
  return hours * 60 + minutes
}

/**
 * Créneau valide : la fin est strictement après le début.
 * « 00:00 » en fin de créneau = minuit de fin de journée (1440),
 * ce qui autorise par ex. 23:00 → 00:00.
 */
function isValidSlot(start: string, end: string): boolean {
  const endMinutes = end === '00:00' ? 24 * 60 : timeToMinutes(end)
  return endMinutes > timeToMinutes(start)
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
          (r.facility?.name ?? '').toLowerCase().includes(q)
        )
      })
      .sort((a, b) => (a.date === b.date ? a.startTime.localeCompare(b.startTime) : b.date.localeCompare(a.date)))
  }, [reservations, statusFilter, search])

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

  /** Marque une réservation comme payée / impayée (Wave ou sur place). */
  async function updatePayment(id: string, paymentStatus: 'PAID' | 'UNPAID') {
    setBusyId(id)
    try {
      await apiFetch(`/api/reservations/${id}`, { method: 'PATCH', auth: true, body: { paymentStatus } })
      toast({
        title: 'Paiement mis à jour',
        description:
          paymentStatus === 'PAID'
            ? 'La réservation est marquée comme payée.'
            : 'La réservation est marquée comme impayée.',
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

  const counts = useMemo(() => ({
    ALL: reservations.length,
    PENDING: reservations.filter((r) => r.status === 'PENDING').length,
    CONFIRMED: reservations.filter((r) => r.status === 'CONFIRMED').length,
    CANCELLED: reservations.filter((r) => r.status === 'CANCELLED').length,
  }), [reservations])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Réservations</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} affichée{filtered.length > 1 ? 's' : ''} sur {reservations.length} au total
          </p>
        </div>

        {/* ===== Bouton AJOUTER une réservation ===== */}
        <Button onClick={() => setAddOpen(true)} size="lg" className="shadow-sm">
          <Plus className="size-4" />
          Ajouter une réservation
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((f) => (
                <Button
                  key={f.value}
                  size="sm"
                  variant={statusFilter === f.value ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(f.value)}
                  className="h-8"
                >
                  {f.label}
                  <Badge
                    variant="secondary"
                    className="ml-1.5 px-1.5 py-0 text-[11px] font-semibold"
                  >
                    {counts[f.value as keyof typeof counts]}
                  </Badge>
                </Button>
              ))}
            </div>
            <div className="relative w-full lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher (client, référence, terrain)…"
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
            <div className="max-h-[540px] overflow-y-auto zalspor-scroll border-t">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead className="min-w-[130px]">Référence</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="hidden md:table-cell">Terrain</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="hidden sm:table-cell">Créneau</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="hidden md:table-cell">Paiement</TableHead>
                    <TableHead className="hidden lg:table-cell">Source</TableHead>
                    <TableHead className="w-12 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => {
                    const meta = RESERVATION_STATUS_META[r.status] ?? { label: r.status, variant: 'outline' as const }
                    const payMeta = PAYMENT_STATUS_META[r.paymentStatus] ?? {
                      label: r.paymentStatus,
                      variant: 'outline' as const,
                    }
                    return (
                      <TableRow key={r.id} className={busyId === r.id ? 'opacity-50' : undefined}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {r.reference.slice(0, 10).toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{r.customerName}</div>
                          {r.customerPhone && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Phone className="size-3" /> {r.customerPhone}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{r.facility?.name ?? '—'}</TableCell>
                        <TableCell className="text-sm whitespace-nowrap">{formatDateFr(r.date)}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm whitespace-nowrap">
                          {r.startTime} – {formatHourLabel(r.endTime)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={meta.variant}>{meta.label}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-col items-start gap-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {r.paymentMethod ? (
                                <Badge variant="outline" className="px-1.5 py-0 text-[11px] font-medium">
                                  {PAYMENT_METHOD_META[r.paymentMethod] ?? r.paymentMethod}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                              <Badge variant={payMeta.variant} className="px-1.5 py-0 text-[11px]">
                                {payMeta.label}
                              </Badge>
                            </div>
                            {typeof r.amount === 'number' && (
                              <span className="text-[11px] text-muted-foreground">{formatPrice(r.amount)}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge variant={r.source === 'ADMIN' ? 'default' : 'outline'}>
                            {r.source === 'ADMIN' ? 'Admin' : 'Public'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8" aria-label="Actions">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
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
                                  Marquer payé
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => updatePayment(r.id, 'UNPAID')}>
                                  <Wallet className="size-4 text-muted-foreground" />
                                  Marquer impayé
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
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
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
