'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  Activity,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  Footprints,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Waves,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
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
import { useToast } from '@/hooks/use-toast'
import { apiFetch, ApiError } from './api'
import { FACILITY_TYPE_LABELS, formatPrice, type Facility } from './types'

const FACILITY_ICONS: Record<string, typeof Trophy> = {
  FOOTBALL: Trophy,
  TENNIS: Activity,
  BASKETBALL: Flame,
  PADEL: Zap,
  GYM: Dumbbell,
  PISCINE: Waves,
  MULTISPORT: Footprints,
}

type BookingForm = {
  facilityId: string
  date: string
  startTime: string
  endTime: string
  customerName: string
  customerEmail: string
  customerPhone: string
  notes: string
}

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

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
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<BookingForm>({
    facilityId: preselectedFacilityId ?? '',
    date: todayIso(),
    startTime: '18:00',
    endTime: '19:00',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    notes: '',
  })

  const selected = facilities.find((f) => f.id === form.facilityId)
  const set = (patch: Partial<BookingForm>) => setForm((prev) => ({ ...prev, ...patch }))

  const canSubmit =
    form.facilityId &&
    form.date &&
    form.startTime &&
    form.endTime &&
    form.customerName.trim().length > 1 &&
    form.endTime > form.startTime

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || submitting) return
    setSubmitting(true)
    try {
      const result = await apiFetch<{ reservation: { reference: string } }>('/api/reservations', {
        method: 'POST',
        body: {
          facilityId: form.facilityId,
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          customerName: form.customerName.trim(),
          customerEmail: form.customerEmail.trim() || null,
          customerPhone: form.customerPhone.trim() || null,
          notes: form.notes.trim() || null,
          source: 'PUBLIC',
        },
      })
      toast({
        title: 'Réservation envoyée ! 🎉',
        description: `Référence ${result.reservation.reference}. Vous recevrez une confirmation sous 24 h.`,
      })
      onOpenChange(false)
      setForm((prev) => ({ ...prev, customerName: '', customerEmail: '', customerPhone: '', notes: '' }))
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Une erreur est survenue. Réessayez.'
      toast({ title: 'Échec de la réservation', description: message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg zalspor-scroll max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CalendarCheck className="size-5 text-primary" />
            Réserver une installation
          </DialogTitle>
          <DialogDescription>
            Choisissez votre terrain, votre créneau et laissez vos coordonnées. Confirmation sous 24 h.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="booking-facility">Installation *</Label>
            <Select value={form.facilityId} onValueChange={(v) => set({ facilityId: v })}>
              <SelectTrigger id="booking-facility">
                <SelectValue placeholder="Sélectionnez un terrain ou une salle" />
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
              <Label htmlFor="booking-date">Date *</Label>
              <Input
                id="booking-date"
                type="date"
                min={todayIso()}
                value={form.date}
                onChange={(e) => set({ date: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="booking-start">Début *</Label>
              <Input
                id="booking-start"
                type="time"
                value={form.startTime}
                onChange={(e) => set({ startTime: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="booking-end">Fin *</Label>
              <Input
                id="booking-end"
                type="time"
                value={form.endTime}
                onChange={(e) => set({ endTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="booking-name">Nom complet *</Label>
            <Input
              id="booking-name"
              placeholder="Ex. Aïssatou Diallo"
              value={form.customerName}
              onChange={(e) => set({ customerName: e.target.value })}
              required
              minLength={2}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="booking-email">E-mail</Label>
              <Input
                id="booking-email"
                type="email"
                placeholder="vous@exemple.com"
                value={form.customerEmail}
                onChange={(e) => set({ customerEmail: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="booking-phone">Téléphone</Label>
              <Input
                id="booking-phone"
                placeholder="+221 77 000 00 00"
                value={form.customerPhone}
                onChange={(e) => set({ customerPhone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="booking-notes">Notes (optionnel)</Label>
            <Textarea
              id="booking-notes"
              placeholder="Précisions, équipement souhaité…"
              rows={2}
              value={form.notes}
              onChange={(e) => set({ notes: e.target.value })}
            />
          </div>

          {selected && (
            <div className="rounded-lg bg-muted/60 border px-4 py-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Clock className="size-4" />
                Tarif : <strong className="text-foreground">{formatPrice(selected.pricePerHour)}/heure</strong>
              </span>
              <Badge variant="outline">{FACILITY_TYPE_LABELS[selected.type] ?? selected.type}</Badge>
            </div>
          )}

          <DialogFooter className="mt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!canSubmit || submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              {submitting ? 'Envoi…' : 'Confirmer la réservation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

export function Landing({
  facilities,
  onOpenAdmin,
  onReserve,
}: {
  facilities: Facility[]
  onOpenAdmin: () => void
  onReserve: (facilityId?: string) => void
}) {
  const [bookingOpen, setBookingOpen] = useState(false)
  const [preselected, setPreselected] = useState<string | undefined>()
  const [navOpen, setNavOpen] = useState(false)

  function openBooking(facilityId?: string) {
    setPreselected(facilityId)
    setBookingOpen(true)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <a href="#" className="flex items-center gap-2.5" aria-label="Zalspor, accueil">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Zap className="size-5" />
              </span>
              <span className="text-xl font-extrabold tracking-tight">
                ZAL<span className="text-primary">SPOR</span>
              </span>
            </a>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
              <a href="#installations" className="hover:text-foreground transition-colors">Installations</a>
              <a href="#fonctionnement" className="hover:text-foreground transition-colors">Fonctionnement</a>
              <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
            </nav>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="hidden sm:inline-flex" onClick={onOpenAdmin}>
                <ShieldCheck className="size-4" />
                Espace admin
              </Button>
              <Button size="sm" onClick={() => openBooking()}>
                <CalendarCheck className="size-4" />
                Réserver
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Menu"
                onClick={() => setNavOpen((v) => !v)}
              >
                {navOpen ? '✕' : '☰'}
              </Button>
            </div>
          </div>
          {navOpen && (
            <nav className="md:hidden pb-3 flex flex-col gap-1 text-sm">
              <a href="#installations" className="rounded-md px-3 py-2 hover:bg-muted" onClick={() => setNavOpen(false)}>
                Installations
              </a>
              <a href="#fonctionnement" className="rounded-md px-3 py-2 hover:bg-muted" onClick={() => setNavOpen(false)}>
                Fonctionnement
              </a>
              <a href="#contact" className="rounded-md px-3 py-2 hover:bg-muted" onClick={() => setNavOpen(false)}>
                Contact
              </a>
              <button
                className="rounded-md px-3 py-2 text-left hover:bg-muted flex items-center gap-2"
                onClick={() => {
                  setNavOpen(false)
                  onOpenAdmin()
                }}
              >
                <ShieldCheck className="size-4" /> Espace admin
              </button>
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1">
        {/* ===== Hero ===== */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-background to-teal-50 dark:from-emerald-950/40 dark:via-background dark:to-teal-950/30" />
          <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
                className="flex flex-col gap-5"
              >
                <Badge className="w-fit gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                  <Sparkles className="size-3.5" />
                  Complexe sportif nouvelle génération
                </Badge>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08]">
                  Réservez votre <span className="text-primary">terrain</span> en quelques clics.
                </h1>
                <p className="text-lg text-muted-foreground max-w-xl">
                  Football, tennis, basket, padel, fitness ou natation : consultez les disponibilités en
                  temps réel et bloquez votre créneau en moins d&apos;une minute.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" className="h-12 text-base" onClick={() => openBooking()}>
                    <CalendarCheck className="size-5" />
                    Réserver maintenant
                  </Button>
                  <Button size="lg" variant="outline" className="h-12 text-base" onClick={onOpenAdmin}>
                    <ShieldCheck className="size-5" />
                    Espace admin
                  </Button>
                </div>

                <dl className="grid grid-cols-3 gap-4 pt-6 mt-2 border-t">
                  {[
                    { k: '6+', v: 'Installations' },
                    { k: '24/7', v: 'Disponibilités' },
                    { k: '98%', v: 'Clients satisfaits' },
                  ].map((s) => (
                    <div key={s.v} className="flex flex-col">
                      <dt className="text-2xl sm:text-3xl font-extrabold text-primary">{s.k}</dt>
                      <dd className="text-sm text-muted-foreground">{s.v}</dd>
                    </div>
                  ))}
                </dl>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="relative"
              >
                <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5 aspect-[2/1]">
                  <Image
                    src="/hero-football.png"
                    alt="Terrain de football du complexe sportif Zalspor, pelouse verte balisée avec buts et projecteurs"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                </div>
                <div className="absolute -bottom-5 left-5 right-5 sm:left-8 sm:right-auto">
                  <Card className="shadow-lg border-emerald-100">
                    <CardContent className="flex items-center gap-3 py-3 px-4">
                      <span className="flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        <Users className="size-5" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold leading-none">+1 200 sportifs / mois</p>
                        <p className="text-xs text-muted-foreground mt-1">nous font confiance</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ===== Installations ===== */}
        <section id="installations" className="py-14 sm:py-20 bg-muted/40 border-y">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight">Nos installations</h2>
                <p className="text-muted-foreground mt-2 max-w-2xl">
                  Des équipements entretenus quotidiennement, ouverts de 6 h à 23 h, 7 jours sur 7.
                </p>
              </div>
              <Badge variant="outline" className="w-fit gap-1.5">
                <MapPin className="size-3.5" /> Route de l&apos;Aéroport, Dakar
              </Badge>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {facilities.map((f, i) => {
                const Icon = FACILITY_ICONS[f.type] ?? Trophy
                return (
                  <motion.div
                    key={f.id}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-50px' }}
                    variants={fadeInUp}
                    transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
                  >
                    <Card className="h-full flex flex-col overflow-hidden hover:shadow-lg hover:border-primary/40 transition-all group">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <Icon className="size-6" />
                          </span>
                          <Badge variant="secondary">{FACILITY_TYPE_LABELS[f.type] ?? f.type}</Badge>
                        </div>
                        <h3 className="text-lg font-bold leading-snug mt-3">{f.name}</h3>
                      </CardHeader>
                      <CardContent className="pb-3 flex-1">
                        <p className="text-sm text-muted-foreground line-clamp-2">{f.description}</p>
                        <div className="flex items-center gap-4 mt-4 text-sm">
                          <span className="flex items-center gap-1.5 text-foreground font-semibold">
                            <Clock className="size-4 text-primary" />
                            {formatPrice(f.pricePerHour)}/h
                          </span>
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Users className="size-4" />
                            {f.capacity} pers.
                          </span>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button
                          className="w-full"
                          variant={i % 2 === 0 ? 'default' : 'outline'}
                          onClick={() => openBooking(f.id)}
                          disabled={!f.active}
                        >
                          <CalendarCheck className="size-4" />
                          {f.active ? 'Réserver' : 'Indisponible'}
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ===== Fonctionnement ===== */}
        <section id="fonctionnement" className="py-14 sm:py-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-center">Comment ça marche ?</h2>
            <p className="text-muted-foreground text-center mt-2 max-w-xl mx-auto">
              Trois étapes suffisent pour jouer.
            </p>
            <div className="grid gap-6 sm:grid-cols-3 mt-10">
              {[
                { n: '1', icon: CalendarCheck, t: 'Choisissez votre créneau', d: 'Sélectionnez l’installation, la date et l’horaire qui vous conviennent.' },
                { n: '2', icon: CheckCircle2, t: 'Confirmez votre demande', d: 'Laissez vos coordonnées : notre équipe valide sous 24 heures.' },
                { n: '3', icon: Trophy, t: 'Jouez !', d: 'Présentez votre référence à l’accueil et profitez du terrain.' },
              ].map((step) => (
                <Card key={step.n} className="relative overflow-hidden">
                  <span className="absolute -top-3 -right-1 text-7xl font-black text-primary/5 select-none">
                    {step.n}
                  </span>
                  <CardContent className="pt-6 flex flex-col items-start gap-3">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <step.icon className="size-6" />
                    </span>
                    <h3 className="font-bold text-lg">{step.t}</h3>
                    <p className="text-sm text-muted-foreground">{step.d}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Contact / CTA ===== */}
        <section id="contact" className="pb-14 sm:pb-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <Card className="bg-gradient-to-r from-primary to-emerald-600 text-primary-foreground border-0 overflow-hidden">
              <CardContent className="py-10 px-6 sm:px-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold">Prêt à jouer ce week-end ?</h2>
                  <p className="mt-2 text-primary-foreground/85 max-w-lg">
                    Réservez en ligne maintenant ou appelez-nous, notre équipe vous répond 7 j/7 de 8 h à 20 h.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Button size="lg" variant="secondary" className="h-12" onClick={() => openBooking()}>
                    <CalendarCheck className="size-5" />
                    Réserver maintenant
                  </Button>
                  <div className="flex flex-col gap-1 text-sm text-primary-foreground/90 pl-1">
                    <span className="flex items-center gap-2"><Phone className="size-4" /> +221 33 800 00 00</span>
                    <span className="flex items-center gap-2"><Mail className="size-4" /> contact@zalspor.com</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* ===== Footer (sticky) ===== */}
      <footer className="mt-auto border-t bg-muted/40">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="size-4" />
            </span>
            <span className="font-bold text-foreground">Zalspor</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <p>Réservations d&apos;installations sportives — Dakar, Sénégal</p>
        </div>
      </footer>

      <BookingDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        facilities={facilities.filter((f) => f.active)}
        preselectedFacilityId={preselected}
      />
    </div>
  )
}

export function ReserveCta({ onClick }: { onClick: () => void }) {
  return (
    <Button onClick={onClick}>
      <CalendarCheck className="size-4" />
      Réserver
    </Button>
  )
}
