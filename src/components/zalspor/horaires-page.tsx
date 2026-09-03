'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  CalendarCheck,
  CalendarDays,
  Clock,
  CreditCard,
  Moon,
  Phone,
  Sparkles,
  Sprout,
  Sun,
  Wallet,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { DEPOSIT_PER_HOUR, formatPrice, type Facility } from './types'

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

/** Graduations de la frise horaire 08 h → minuit */
const HOURS_TICKS = [8, 10, 12, 14, 16, 18, 20, 22, 24]

export function HorairesPage({
  facilities,
  onReserve,
  onOpenCalendar,
}: {
  facilities: Facility[]
  onReserve: () => void
  onOpenCalendar: () => void
}) {
  const pricePerHour = facilities[0]?.pricePerHour ?? 25000
  const deposit = DEPOSIT_PER_HOUR
  const balance = Math.max(pricePerHour - deposit, 0)

  return (
    <motion.div
      key="horaires"
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
              <Clock className="size-3.5" />
              Horaires &amp; tarifs
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mt-5 leading-[1.1]">
              Ouverts de 8 h à minuit, <span className="text-primary">7 jours sur 7.</span>
            </h1>
            <p className="text-lg text-muted-foreground mt-5 max-w-2xl">
              Un tarif unique et transparent :{' '}
              <strong className="text-foreground">{formatPrice(pricePerHour)} par heure</strong> de
              terrain, avec un acompte de{' '}
              <strong className="text-foreground">{formatPrice(deposit)}</strong> par heure à la
              réservation via Wave — le solde se règle sur place.
            </p>
          </div>
        </div>
      </section>

      {/* ===== Horaires d'ouverture ===== */}
      <section className="py-14 sm:py-16">
        <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold tracking-tight">Horaires d&apos;ouverture</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Le complexe accueille les joueurs tous les jours, de 8 h jusqu&apos;à minuit —
            éclairage nocturne inclus.
          </p>

          <Card className="mt-8 overflow-hidden">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Sun className="size-6" />
                  </span>
                  <div>
                    <p className="text-3xl font-extrabold tabular-nums tracking-tight">
                      08:00 <span className="text-muted-foreground font-medium">→</span> 00:00
                    </p>
                    <p className="text-sm text-muted-foreground">
                      de 8 h du matin à minuit, sans interruption
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Moon className="size-6" />
                  </span>
                  <p className="text-sm text-muted-foreground max-w-[16rem]">
                    <strong className="text-foreground">Éclairage nocturne</strong> : jouez aussi
                    le soir, jusqu&apos;au dernier créneau de 23 h → minuit.
                  </p>
                </div>
              </div>

              {/* Frise horaire 08 h → minuit */}
              <div className="mt-8" aria-hidden="true">
                <div className="relative h-3 rounded-full bg-gradient-to-r from-amber-200 via-emerald-300 to-emerald-600 dark:from-amber-500/60 dark:via-emerald-500/60 dark:to-emerald-800" />
                <div className="mt-2 grid grid-cols-9 text-[11px] sm:text-xs text-muted-foreground tabular-nums">
                  {HOURS_TICKS.map((h) => (
                    <span key={h} className="text-center">
                      {h === 24 ? '00:00' : `${String(h).padStart(2, '0')}:00`}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <Badge variant="outline" className="gap-1.5">
                  <CalendarDays className="size-3.5" /> Lundi → dimanche
                </Badge>
                <Badge variant="outline" className="gap-1.5">
                  <Clock className="size-3.5" /> 16 créneaux d&apos;1 heure par jour
                </Badge>
                <Badge variant="outline" className="gap-1.5">
                  <Moon className="size-3.5" /> Nocturnes 7j/7
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ===== Tarifs ===== */}
      <section className="py-14 sm:py-16 bg-muted/40 border-y">
        <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold tracking-tight">Tarifs</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Le prix affiché est le prix payé : le même tarif pour tous les terrains, en ligne comme
            à l&apos;accueil.
          </p>

          <div className="grid gap-5 lg:grid-cols-2 mt-8">
            {/* Carte tarif horaire */}
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Sprout className="size-6" />
                  </span>
                  <h3 className="font-bold text-lg">Location d&apos;un terrain</h3>
                </div>
              </CardHeader>
              <CardContent className="pb-3 flex-1">
                <p className="text-4xl font-extrabold text-primary tabular-nums">
                  {formatPrice(pricePerHour)}
                  <span className="text-sm font-medium text-muted-foreground"> / heure</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Gazon synthétique, buts avec filets, éclairage et vestiaires inclus.
                </p>
                <ul className="mt-4 grid gap-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Sprout className="size-4 text-primary shrink-0" /> Gazon synthétique dernière
                    génération
                  </li>
                  <li className="flex items-center gap-2">
                    <Moon className="size-4 text-primary shrink-0" /> Éclairage nocturne
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="size-4 text-primary shrink-0" /> Vestiaires &amp; douches
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" size="lg" onClick={onReserve}>
                  <CalendarCheck className="size-4" />
                  Réserver {formatPrice(pricePerHour)} / h
                </Button>
              </CardFooter>
            </Card>

            {/* Carte acompte / solde */}
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Wallet className="size-6" />
                  </span>
                  <h3 className="font-bold text-lg">Comment payer</h3>
                </div>
              </CardHeader>
              <CardContent className="pb-3 flex-1 grid gap-3">
                <div className="rounded-xl border border-[#00A0E7]/30 bg-[#00A0E7]/[0.04] p-4 flex items-start gap-3">
                  <Image
                    src="/wave-brand.png"
                    alt="Icône de paiement Wave"
                    width={332}
                    height={419}
                    className="h-11 w-auto rounded-lg shrink-0"
                  />
                  <div>
                    <p className="font-semibold">
                      Acompte de {formatPrice(deposit)} / heure via Wave
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      À la réservation : payez l&apos;acompte en ligne avec Wave pour bloquer votre
                      créneau (liens de paiement générés automatiquement).
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border p-4 flex items-start gap-3 bg-muted/30">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm ring-1 ring-black/5">
                    <CreditCard className="size-5 text-primary" />
                  </span>
                  <div>
                    <p className="font-semibold">
                      Solde de {formatPrice(balance)} / heure sur place
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      Le reste se règle à l&apos;accueil du complexe à votre arrivée, avant le coup
                      d&apos;envoi.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" size="lg" onClick={onOpenCalendar}>
                  <CalendarDays className="size-4" />
                  Voir le calendrier des réservations
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Exemples de calcul */}
          <Card className="mt-5 overflow-hidden">
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <caption className="sr-only">
                  Exemples de tarifs selon la durée de location
                </caption>
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th scope="col" className="px-4 sm:px-6 py-3 font-semibold">
                      Durée
                    </th>
                    <th scope="col" className="px-4 sm:px-6 py-3 font-semibold text-right">
                      Total
                    </th>
                    <th scope="col" className="px-4 sm:px-6 py-3 font-semibold text-right">
                      Acompte Wave
                    </th>
                    <th scope="col" className="px-4 sm:px-6 py-3 font-semibold text-right hidden sm:table-cell">
                      Solde sur place
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4].map((h) => (
                    <tr key={h} className="border-b last:border-0">
                      <td className="px-4 sm:px-6 py-3 font-medium">
                        {h} heure{h > 1 ? 's' : ''}
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-right tabular-nums font-semibold">
                        {formatPrice(h * pricePerHour)}
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-right tabular-nums text-[#0090D2] dark:text-[#4DC3F0]">
                        {formatPrice(h * deposit)}
                      </td>
                      <td className="px-4 sm:px-6 py-3 text-right tabular-nums text-muted-foreground hidden sm:table-cell">
                        {formatPrice(h * (pricePerHour - deposit))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground mt-3">
            Acompte : {formatPrice(deposit)} par heure réservée, versé à la réservation. Toute heure
            entamée est due en totalité.
          </p>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-14 sm:py-20">
        <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-r from-primary to-emerald-600 text-primary-foreground border-0 overflow-hidden">
            <CardContent className="py-10 px-6 sm:px-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold">Votre créneau vous attend</h2>
                <p className="mt-2 text-primary-foreground/85 max-w-lg">
                  {formatPrice(pricePerHour)} l&apos;heure, acompte de {formatPrice(deposit)} via
                  Wave — réservez en moins d&apos;une minute.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="h-12" onClick={onReserve}>
                  <CalendarCheck className="size-5" />
                  Réserver maintenant
                </Button>
                <a
                  href="tel:+221782784949"
                  className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-primary-foreground/30 bg-primary-foreground/10 px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/20 cursor-pointer"
                >
                  <Phone className="size-5" />
                  +221 78 278 49 49
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </motion.div>
  )
}
