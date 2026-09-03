'use client'

import { useMemo, useState } from 'react'
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
  eachDayOfInterval,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  Plus,
  Trash2,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { apiFetch, ApiError } from './api'
import { EVENT_TYPE_META, formatDateFr, type CalendarEvent, type Facility, type Reservation } from './types'

type NewEventForm = {
  title: string
  type: string
  facilityId: string
  date: string
  startTime: string
  endTime: string
  description: string
}

type DayItem =
  | { kind: 'EVENT'; data: CalendarEvent }
  | { kind: 'RESERVATION'; data: Reservation }

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

/** Dialogue « Ajouter un événement au calendrier ». */
function AddEventDialog({
  open,
  onOpenChange,
  facilities,
  defaultDate,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  facilities: Facility[]
  defaultDate: string
  onCreated: () => void
}) {
  const { toast } = useToast()
  const [form, setForm] = useState<NewEventForm>({
    title: '',
    type: 'EVENEMENT',
    facilityId: '',
    date: defaultDate,
    startTime: '18:00',
    endTime: '20:00',
    description: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const set = (patch: Partial<NewEventForm>) => setForm((prev) => ({ ...prev, ...patch }))

  const canSubmit = form.title.trim().length > 2 && form.date && form.startTime && form.endTime > form.startTime

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || submitting) return
    setSubmitting(true)
    try {
      const result = await apiFetch<{ event: CalendarEvent }>('/api/calendar', {
        method: 'POST',
        auth: true,
        body: {
          title: form.title.trim(),
          type: form.type,
          facilityId: form.facilityId || null,
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          description: form.description.trim() || null,
        },
      })
      toast({
        title: 'Événement ajouté au calendrier ✅',
        description: `« ${result.event.title} » le ${formatDateFr(result.event.date)} à ${result.event.startTime}.`,
      })
      onCreated()
      set({ title: '', description: '' })
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Ajout impossible. Réessayez.'
      toast({ title: 'Échec de l’ajout', description: message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg zalspor-scroll max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CalendarDays className="size-5 text-primary" />
            Ajouter un événement
          </DialogTitle>
          <DialogDescription>
            Entraînement, maintenance, disponibilité exceptionnelle ou événement spécial.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="ev-title">Titre *</Label>
            <Input
              id="ev-title"
              placeholder="Ex. Tournoi interne de padel"
              value={form.title}
              onChange={(e) => set({ title: e.target.value })}
              required
              minLength={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="ev-type">Type</Label>
              <Select value={form.type} onValueChange={(v) => set({ type: v })}>
                <SelectTrigger id="ev-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EVENT_TYPE_META)
                    .filter(([key]) => key !== 'RESERVATION')
                    .map(([key, meta]) => (
                      <SelectItem key={key} value={key}>
                        {meta.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ev-facility">Terrain (optionnel)</Label>
              <Select value={form.facilityId} onValueChange={(v) => set({ facilityId: v })}>
                <SelectTrigger id="ev-facility">
                  <SelectValue placeholder="Toutes / aucune" />
                </SelectTrigger>
                <SelectContent>
                  {facilities.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="ev-date">Date *</Label>
              <Input id="ev-date" type="date" value={form.date} onChange={(e) => set({ date: e.target.value })} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ev-start">Début *</Label>
              <Input id="ev-start" type="time" value={form.startTime} onChange={(e) => set({ startTime: e.target.value })} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ev-end">Fin *</Label>
              <Input id="ev-end" type="time" value={form.endTime} onChange={(e) => set({ endTime: e.target.value })} required />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ev-desc">Description</Label>
            <Textarea
              id="ev-desc"
              placeholder="Détails de l’événement, public visé…"
              rows={2}
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
            />
          </div>

          <DialogFooter className="mt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!canSubmit || submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {submitting ? 'Ajout…' : 'Ajouter au calendrier'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DayDetailsDialog({
  day,
  items,
  onOpenChange,
  onDeleteEvent,
}: {
  day: Date | null
  items: DayItem[]
  onOpenChange: (open: boolean) => void
  onDeleteEvent: (eventId: string) => void
}) {
  if (!day) return null
  return (
    <Dialog open={day !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CalendarDays className="size-5 text-primary" />
            {format(day, 'EEEE d MMMM yyyy', { locale: fr })}
          </DialogTitle>
          <DialogDescription>
            {items.length === 0 ? 'Aucun événement ni réservation ce jour-là.' : `${items.length} élément(s) programmé(s).`}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-72 pr-3">
          <div className="grid gap-2">
            {items.map((item) => {
              if (item.kind === 'EVENT') {
                const meta = EVENT_TYPE_META[item.data.type] ?? EVENT_TYPE_META.EVENEMENT
                return (
                  <div
                    key={`ev-${item.data.id}`}
                    className="rounded-lg border p-3 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={meta.pill}>{meta.label}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="size-3" /> {item.data.startTime} – {item.data.endTime}
                        </span>
                      </div>
                      <p className="font-medium mt-1.5 truncate">{item.data.title}</p>
                      {item.data.facility && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="size-3" /> {item.data.facility.name}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 text-destructive hover:text-destructive"
                      onClick={() => onDeleteEvent(item.data.id)}
                      aria-label={`Supprimer ${item.data.title}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                )
              }
              const r = item.data
              return (
                <div key={`res-${r.id}`} className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={EVENT_TYPE_META.RESERVATION.pill}>Réservation</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3" /> {r.startTime} – {r.endTime}
                    </span>
                    <Badge variant={r.status === 'CONFIRMED' ? 'default' : r.status === 'PENDING' ? 'secondary' : 'destructive'}>
                      {r.status === 'CONFIRMED' ? 'Confirmée' : r.status === 'PENDING' ? 'En attente' : 'Annulée'}
                    </Badge>
                  </div>
                  <p className="font-medium mt-1.5 truncate">{r.customerName}</p>
                  {r.facility && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="size-3" /> {r.facility.name}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export function CalendarSection({
  events,
  reservations,
  facilities,
  loading,
  onRefresh,
  onUnauthorized,
}: {
  events: CalendarEvent[]
  reservations: Reservation[]
  facilities: Facility[]
  loading: boolean
  onRefresh: () => void
  onUnauthorized: () => void
}) {
  const { toast } = useToast()
  const [month, setMonth] = useState<Date>(() => startOfMonth(new Date()))
  const [addOpen, setAddOpen] = useState(false)
  const [addDate, setAddDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const byDay = useMemo(() => {
    const map = new Map<string, DayItem[]>()
    for (const e of events) {
      const arr = map.get(e.date) ?? []
      arr.push({ kind: 'EVENT', data: e })
      map.set(e.date, arr)
    }
    for (const r of reservations) {
      if (r.status === 'CANCELLED') continue
      const arr = map.get(r.date) ?? []
      arr.push({ kind: 'RESERVATION', data: r })
      map.set(r.date, arr)
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => a.data.startTime.localeCompare(b.data.startTime))
    }
    return map
  }, [events, reservations])

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { locale: fr, weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(month), { locale: fr, weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [month])

  const monthEventsCount = useMemo(
    () => events.filter((e) => e.date.startsWith(format(month, 'yyyy-MM'))).length,
    [events, month],
  )
  const monthReservationsCount = useMemo(
    () => reservations.filter((r) => r.date.startsWith(format(month, 'yyyy-MM'))).length,
    [reservations, month],
  )

  const selectedDayItems = selectedDay ? (byDay.get(format(selectedDay, 'yyyy-MM-dd')) ?? []) : []

  async function deleteEvent(id: string) {
    try {
      await apiFetch(`/api/calendar/${id}`, { method: 'DELETE', auth: true })
      toast({ title: 'Événement supprimé du calendrier' })
      onRefresh()
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return onUnauthorized()
      toast({
        title: 'Suppression impossible',
        description: error instanceof ApiError ? error.message : 'Réessayez.',
        variant: 'destructive',
      })
    }
  }

  function openAdd(day?: Date) {
    const d = day ?? new Date()
    setAddDate(format(d, 'yyyy-MM-dd'))
    setAddOpen(true)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Calendrier</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {monthEventsCount} événement{monthEventsCount > 1 ? 's' : ''} et {monthReservationsCount} réservation
            {monthReservationsCount > 1 ? 's' : ''} en {format(month, 'MMMM yyyy', { locale: fr })}
          </p>
        </div>

        {/* ===== Bouton AJOUTER un événement au calendrier ===== */}
        <Button onClick={() => openAdd()} size="lg" className="shadow-sm">
          <Plus className="size-4" />
          Ajouter un événement
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarDays className="size-5 text-primary" />
              {format(month, 'MMMM yyyy', { locale: fr })}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => setMonth((m) => subMonths(m, 1))}
                aria-label="Mois précédent"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setMonth(startOfMonth(new Date()))}
              >
                Aujourd&apos;hui
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => setMonth((m) => addMonths(m, 1))}
                aria-label="Mois suivant"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
          <CardDescription className="sr-only">
            Vue mensuelle des événements et réservations
          </CardDescription>

          {/* Légende */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground pt-1">
            {Object.entries(EVENT_TYPE_META)
              .filter(([key]) => key !== 'RESERVATION')
              .map(([key, meta]) => (
                <span key={key} className="flex items-center gap-1.5">
                  <span className={`size-2.5 rounded-full ${meta.dot}`} />
                  {meta.label}
                </span>
              ))}
            <span className="flex items-center gap-1.5">
              <span className={`size-2.5 rounded-full ${EVENT_TYPE_META.RESERVATION.dot}`} />
              Réservation
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0 border-t">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="size-6 animate-spin mr-2" />
              Chargement du calendrier…
            </div>
          ) : (
            <>
              {/* Jours de la semaine */}
              <div className="grid grid-cols-7 border-b bg-muted/30">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="px-2 py-2 text-center text-xs font-semibold text-muted-foreground">
                    {d}
                  </div>
                ))}
              </div>
              {/* Grille des jours */}
              <div className="grid grid-cols-7 auto-rows-[minmax(88px,1fr)]">
                {days.map((day) => {
                  const key = format(day, 'yyyy-MM-dd')
                  const items = byDay.get(key) ?? []
                  const inMonth = isSameMonth(day, month)
                  const today = isToday(day)
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => (items.length > 0 ? setSelectedDay(day) : openAdd(day))}
                      onDoubleClick={() => openAdd(day)}
                      className={`
                        group relative border-b border-r p-1.5 text-left align-top transition-colors
                        hover:bg-primary/5 focus-visible:bg-primary/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary
                        ${inMonth ? '' : 'bg-muted/20 text-muted-foreground/50'}
                      `}
                      aria-label={`Jour du ${format(day, 'd MMMM', { locale: fr })}${items.length ? `, ${items.length} élément(s)` : ', ajouter un événement'}`}
                    >
                      <span
                        className={`
                          inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold
                          ${today ? 'bg-primary text-primary-foreground' : inMonth ? 'text-foreground' : ''}
                        `}
                      >
                        {format(day, 'd')}
                      </span>

                      <span className="mt-1 flex flex-col gap-1">
                        {items.slice(0, 3).map((item) => {
                          const type =
                            item.kind === 'EVENT'
                              ? item.data.type
                              : 'RESERVATION'
                          const meta = EVENT_TYPE_META[type] ?? EVENT_TYPE_META.EVENEMENT
                          return (
                            <span
                              key={`${item.kind}-${item.data.id}`}
                              className={`hidden sm:inline-flex items-center gap-1 truncate rounded border px-1.5 py-0.5 text-[10px] leading-tight font-medium ${meta.pill}`}
                            >
                              <span className={`size-1.5 rounded-full ${meta.dot} shrink-0`} />
                              <span className="truncate">
                                {item.kind === 'EVENT' ? item.data.title : item.data.customerName}
                              </span>
                            </span>
                          )
                        })}
                        {items.length > 3 && (
                          <span className="text-[10px] text-muted-foreground font-medium pl-1">
                            +{items.length - 3} autre{items.length - 3 > 1 ? 's' : ''}
                          </span>
                        )}
                        {items.length > 0 && (
                          <span className="sm:hidden text-[10px] font-semibold text-muted-foreground">
                            {items.length} · {items[0].data.startTime}
                          </span>
                        )}
                      </span>

                      <span className="absolute right-1 top-1 hidden group-hover:inline-flex size-5 items-center justify-center rounded text-muted-foreground">
                        <Plus className="size-3" />
                      </span>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Astuce : cliquez sur un jour occupé pour voir le détail, cliquez sur un jour libre (ou double-cliquez
        n&apos;importe quand) pour ajouter un événement.
      </p>

      <DayDetailsDialog
        day={selectedDay}
        items={selectedDayItems}
        onOpenChange={(open) => !open && setSelectedDay(null)}
        onDeleteEvent={deleteEvent}
      />

      <AddEventDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        facilities={facilities}
        defaultDate={addDate}
        onCreated={onRefresh}
      />
    </div>
  )
}
