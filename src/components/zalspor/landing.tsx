'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  BadgeCheck,
  CalendarCheck,
  Clock,
  Flame,
  GraduationCap,
  Heart,
  LogIn,
  MapPin,
  Phone,
  Sparkles,
  Sprout,
  Target,
  Trophy,
  Users,
  Waves,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice, type Facility } from './types'
import { Brand } from './brand'
import { ReservationPage } from './reservation-page'
import { HorairesPage } from './horaires-page'
import { CalendrierPage } from './calendrier-page'
import { ContactPage } from './contact-page'
import { ThemeToggle } from './theme-toggle'

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

type PublicPage =
  | 'accueil'
  | 'horaires'
  | 'calendrier'
  | 'concept'
  | 'apropos'
  | 'contact'
  | 'reserver'

const NAV_LINKS: { page: PublicPage; anchor?: string; label: string }[] = [
  { page: 'accueil', anchor: 'installations', label: 'Terrains' },
  { page: 'horaires', label: 'Horaires & Tarifs' },
  { page: 'calendrier', label: 'Calendrier' },
  { page: 'concept', label: 'Le Concept' },
  { page: 'apropos', label: 'À propos' },
  { page: 'contact', label: 'Contact' },
]

/** Coordonnées du complexe (page Contact + pied de page). */
const CONTACT = {
  name: 'Zalfoot',
  address: 'Croisement Kaolack - Mbour, Sénégal',
  phone: '+221 78 278 49 49',
  phoneHref: 'tel:+221782784949',
}

export function Landing({
  facilities,
  onOpenAdmin,
}: {
  facilities: Facility[]
  onOpenAdmin: () => void
}) {
  const [page, setPage] = useState<PublicPage>('accueil')
  const [preselected, setPreselected] = useState<string | undefined>()
  const [navOpen, setNavOpen] = useState(false)

  /** Ouvre la PAGE de réservation (terrain présélectionné en option). */
  function openBooking(facilityId?: string) {
    setPreselected(facilityId)
    goTo('reserver')
  }

  function goTo(target: PublicPage, anchor?: string) {
    setPage(target)
    setNavOpen(false)
    if (anchor) {
      window.setTimeout(() => {
        document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 120)
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8">
          <div className="flex h-24 items-center justify-between">
            <button
              type="button"
              onClick={() => goTo('accueil')}
              className="flex items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Zalfoot, retour à l’accueil"
            >
              <Brand size={80} />
            </button>

            <nav className="hidden lg:flex items-center gap-4 text-sm font-medium text-muted-foreground">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.label}
                  type="button"
                  className="hover:text-foreground transition-colors cursor-pointer"
                  onClick={() => goTo(link.page, link.anchor)}
                >
                  {link.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="outline" size="sm" className="hidden xl:inline-flex" onClick={onOpenAdmin}>
                <LogIn className="size-4" />
                Connexion
              </Button>
              <Button size="sm" onClick={() => openBooking()}>
                <CalendarCheck className="size-4" />
                Réserver
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Menu"
                onClick={() => setNavOpen((v) => !v)}
              >
                {navOpen ? '✕' : '☰'}
              </Button>
            </div>
          </div>
          {navOpen && (
            <nav className="lg:hidden pb-3 flex flex-col gap-1 text-sm">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.label}
                  type="button"
                  className="rounded-md px-3 py-2 text-left hover:bg-muted cursor-pointer"
                  onClick={() => goTo(link.page, link.anchor)}
                >
                  {link.label}
                </button>
              ))}
              <button
                type="button"
                className="rounded-md px-3 py-2 text-left hover:bg-muted flex items-center gap-2 cursor-pointer font-semibold text-foreground"
                onClick={() => openBooking()}
              >
                <CalendarCheck className="size-4 text-primary" /> Réserver un terrain
              </button>
              <button
                type="button"
                className="rounded-md px-3 py-2 text-left hover:bg-muted flex items-center gap-2 cursor-pointer"
                onClick={() => {
                  setNavOpen(false)
                  onOpenAdmin()
                }}
              >
                <LogIn className="size-4" /> Connexion
              </button>
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1">
        {page === 'accueil' && (
          <motion.div
            key="accueil"
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.35 }}
          >
            {/* ===== Hero (haut de page) : image du ballon sur le terrain + écritures superposées ===== */}
            <section className="relative overflow-hidden">
              <div className="relative flex items-center min-h-[560px] sm:min-h-[520px] lg:min-h-[600px]">
                <Image
                  src="/hero-football.png"
                  alt="Terrain de football de Zalfoot, pelouse verte balisée avec buts et projecteurs"
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover"
                />
                {/* Voiles sombres pour la lisibilité des écritures superposées */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/15" />

                <div className="relative w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16 lg:py-20">
                  <div className="max-w-2xl flex flex-col gap-5">
                    <Badge className="w-fit gap-1.5 border-white/30 bg-white/15 text-white backdrop-blur">
                      <Sparkles className="size-3.5" />
                      Location de terrains de football à l&apos;heure
                    </Badge>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1] text-white">
                      Réservez votre <span className="text-emerald-400">terrain de football</span> en
                      quelques clics.
                    </h1>
                    <p className="text-base sm:text-lg text-white/85 max-w-xl">
                      Gazon synthétique entretenu, éclairage nocturne, vestiaires : consultez les
                      disponibilités en temps réel et bloquez votre heure de foot en moins
                      d&apos;une minute.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button size="lg" className="h-12 text-base" onClick={() => openBooking()}>
                        <CalendarCheck className="size-5" />
                        Réserver maintenant
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="h-12 text-base border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                        onClick={onOpenAdmin}
                      >
                        <LogIn className="size-5" />
                        Connexion
                      </Button>
                    </div>

                    <dl className="grid grid-cols-3 gap-4 pt-6 mt-2 border-t border-white/25">
                      {[
                        { k: String(facilities.length || 3), v: 'Terrains de football' },
                        { k: '7j/7', v: 'De 8 h à minuit' },
                        { k: '98%', v: 'Joueurs satisfaits' },
                      ].map((s) => (
                        <div key={s.v} className="flex flex-col">
                          <dt className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{s.k}</dt>
                          <dd className="text-sm text-white/75">{s.v}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              </div>
            </section>

            {/* ===== Terrains : écritures placées sous l'image du hero ===== */}
            <section id="installations" className="py-14 sm:py-20 bg-muted/40 border-y">
              <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Nos terrains de football</h2>
                    <p className="text-muted-foreground mt-2 max-w-2xl">
                      Du gazon synthétique, tout simplement. Surface stable par tous les temps,
                      entretenu quotidiennement, propre même en saison des pluies.
                    </p>
                  </div>
                  <Badge variant="outline" className="w-fit gap-1.5">
                    <MapPin className="size-3.5" /> {CONTACT.address}
                  </Badge>
                </div>

                {/* Cartes terrains — centrées horizontalement, même quand il ne reste qu'un terrain actif */}
                <div className="flex flex-wrap justify-center gap-5">
                  {facilities.map((f, i) => (
                    <motion.div
                      key={f.id}
                      className="w-full sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)]"
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
                              <Sprout className="size-6" />
                            </span>
                            <Badge variant="secondary" className="gap-1.5 shrink-0 mt-0.5">
                              <Sprout className="size-3" /> Gazon synthétique
                            </Badge>
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
                              {f.capacity} joueurs
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
                            {f.active ? 'Réserver ce terrain' : 'Indisponible'}
                          </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* ===== Fonctionnement : écritures « Comment ça marche ? » superposées sur l'image ===== */}
            <section id="fonctionnement" className="py-14 sm:py-20">
              <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8">
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-50px' }}
                  variants={fadeInUp}
                  transition={{ duration: 0.5 }}
                  className="relative rounded-2xl overflow-hidden shadow-xl ring-1 ring-black/5"
                >
                  <div className="relative min-h-[300px] sm:min-h-[360px] flex items-center justify-center">
                    <Image
                      src="/gazon-synthetique.png"
                      alt="Gazon synthétique dernière génération des terrains de football Zalfoot"
                      fill
                      sizes="100vw"
                      className="object-cover"
                    />
                    {/* Voile sombre pour la lisibilité des écritures superposées */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
                    <div className="relative text-center px-6 py-10">
                      <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                        Comment ça marche ?
                      </h2>
                      <p className="text-white/85 mt-3 text-base sm:text-lg max-w-xl mx-auto">
                        Trois étapes suffisent pour jouer.
                      </p>
                    </div>
                  </div>
                </motion.div>
                <div className="grid gap-6 sm:grid-cols-3 mt-8">
                  {[
                    { n: '1', icon: CalendarCheck, t: 'Choisissez votre créneau', d: 'Calendrier visible : sélectionnez la date et l’heure (08:00 → minuit) parmi les créneaux libres.' },
                    { n: '2', icon: Waves, t: 'Payez l’acompte avec Wave', d: 'Bloquez votre créneau avec un acompte de 5 000 FCFA par heure via Wave — le solde se règle sur place.' },
                    { n: '3', icon: Trophy, t: 'Jouez !', d: 'Votre créneau est bloqué : présentez votre référence à l’accueil et profitez de votre heure de foot.' },
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
              <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8">
                <Card className="bg-gradient-to-r from-primary to-emerald-600 text-primary-foreground border-0 overflow-hidden">
                  <CardContent className="py-10 px-6 sm:px-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold">Prêt à jouer ce week-end ?</h2>
                      <p className="mt-2 text-primary-foreground/85 max-w-lg">
                        Réservez votre heure de foot en ligne maintenant, ou appelez-nous 7 j/7 de
                        8 h à minuit.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                      <Button size="lg" variant="secondary" className="h-12" onClick={() => openBooking()}>
                        <CalendarCheck className="size-5" />
                        Réserver maintenant
                      </Button>
                      <a
                        href={CONTACT.phoneHref}
                        className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-primary-foreground/30 bg-primary-foreground/10 px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/20 cursor-pointer"
                      >
                        <Phone className="size-4" />
                        {CONTACT.phone}
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </motion.div>
        )}

        {page === 'concept' && (
          <motion.div
            key="concept"
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.35 }}
          >
            {/* En-tête du concept */}
            <section className="relative overflow-hidden border-b">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-background to-teal-50 dark:from-emerald-950/40 dark:via-background dark:to-teal-950/30" />
              <div className="relative mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
                <div className="max-w-3xl">
                  <Badge className="w-fit gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                    <Target className="size-3.5" />
                    Notre concept
                  </Badge>
                  <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mt-5 leading-[1.1]">
                    Le foot à l&apos;heure, <span className="text-primary">sans complication.</span>
                  </h1>
                  <p className="text-lg text-muted-foreground mt-5 max-w-2xl">
                    Zalfoot fait une seule chose, et la fait bien : louer des terrains de football à
                    l&apos;heure. Pas d&apos;abonnement, pas de frais cachés — vous choisissez un créneau,
                    vous jouez.
                  </p>
                </div>
              </div>
            </section>

            {/* Les 3 piliers */}
            <section className="py-14 sm:py-16">
              <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-extrabold tracking-tight text-center">Ce qui change pour vous</h2>
                <div className="grid gap-6 sm:grid-cols-3 mt-10">
                  {[
                    {
                      icon: CalendarCheck,
                      t: 'Réservation en 1 minute',
                      d: 'Les disponibilités sont visibles en temps réel. Vous bloquez votre heure en ligne, à toute heure du jour ou de la nuit.',
                    },
                    {
                      icon: BadgeCheck,
                      t: 'Prix transparents',
                      d: 'Un tarif clair, affiché à l’heure, identique en ligne et sur place. Vous savez exactement ce que vous payez avant de venir.',
                    },
                    {
                      icon: Trophy,
                      t: 'Terrains prêts à jouer',
                      d: 'Gazon entretenu quotidiennement, buts et filets en place, vestiaires, douches et éclairage nocturne. Vous n’apportez que le ballon.',
                    },
                  ].map((p) => (
                    <Card key={p.t} className="h-full">
                      <CardContent className="pt-6 flex flex-col items-start gap-3">
                        <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <p.icon className="size-6" />
                        </span>
                        <h3 className="font-bold text-lg">{p.t}</h3>
                        <p className="text-sm text-muted-foreground">{p.d}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </section>

            {/* Pour qui */}
            <section className="py-14 sm:py-16 bg-muted/40 border-y">
              <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-extrabold tracking-tight text-center">Pour qui ?</h2>
                <p className="text-muted-foreground text-center mt-2 max-w-xl mx-auto">
                  Le concept s&apos;adapte à toutes les envies de foot.
                </p>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mt-10">
                  {[
                    { icon: Users, t: 'Équipes amicales', d: 'Le match du week-end entre voisins ou collègues, programmé en deux clics.' },
                    { icon: Flame, t: 'Fans de five', d: 'Le petit terrain 5v5 pour l’entre-soirée, sans chercher qui garde le créneau.' },
                    { icon: Trophy, t: 'Tournois & sociétés', d: 'Des heures consécutives pour vos tournois corporatifs et compétitions amicales.' },
                    { icon: GraduationCap, t: 'Écoles & académies', d: 'Des créneaux réguliers pour les entraînements et cours d’EPS.' },
                  ].map((a) => (
                    <Card key={a.t} className="h-full">
                      <CardContent className="pt-6 flex flex-col items-start gap-3">
                        <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <a.icon className="size-5" />
                        </span>
                        <h3 className="font-bold">{a.t}</h3>
                        <p className="text-sm text-muted-foreground">{a.d}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </section>

            {/* Tarifs */}
            <section className="py-14 sm:py-16">
              <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-extrabold tracking-tight text-center">Nos tarifs à l&apos;heure</h2>
                <p className="text-muted-foreground text-center mt-2 max-w-xl mx-auto">
                  Le prix affiché est le prix payé. Réservation en ligne ou à l&apos;accueil, c&apos;est le même.
                </p>
                <div className="flex flex-wrap justify-center gap-5 mt-10 max-w-4xl mx-auto">
                  {facilities.map((f) => (
                    <Card key={f.id} className="h-full flex flex-col w-full sm:w-[calc((100%-2.5rem)/3)]">
                      <CardHeader className="pb-3">
                        <h3 className="font-bold leading-snug">{f.name}</h3>
                      </CardHeader>
                      <CardContent className="pb-3 flex-1">
                        <p className="text-sm text-muted-foreground line-clamp-2">{f.description}</p>
                        <p className="text-3xl font-extrabold text-primary mt-4">
                          {formatPrice(f.pricePerHour)}
                          <span className="text-sm font-medium text-muted-foreground"> /heure</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                          <Users className="size-3.5" /> jusqu&apos;à {f.capacity} joueurs
                        </p>
                        <p className="text-xs mt-2 flex items-center gap-1.5 text-[#0090D2] dark:text-[#4DC3F0]">
                          <Waves className="size-3.5" /> Acompte de {formatPrice(5000)}/h à la réservation,
                          solde sur place
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={() => openBooking(f.id)}
                          disabled={!f.active}
                        >
                          <CalendarCheck className="size-4" />
                          Réserver
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            </section>

            {/* CTA */}
            <section className="pb-14 sm:pb-20">
              <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8">
                <Card className="bg-gradient-to-r from-primary to-emerald-600 text-primary-foreground border-0 overflow-hidden">
                  <CardContent className="py-10 px-6 sm:px-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold">Envie de tester le concept ?</h2>
                      <p className="mt-2 text-primary-foreground/85 max-w-lg">
                        Réservez votre première heure de foot et jugez par vous-même.
                      </p>
                    </div>
                    <Button size="lg" variant="secondary" className="h-12" onClick={() => openBooking()}>
                      <CalendarCheck className="size-5" />
                      Réserver un terrain
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </section>
          </motion.div>
        )}

        {page === 'apropos' && (
          <motion.div
            key="apropos"
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.35 }}
          >
            {/* En-tête */}
            <section className="relative overflow-hidden border-b">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-background to-teal-50 dark:from-emerald-950/40 dark:via-background dark:to-teal-950/30" />
              <div className="relative mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
                <div className="max-w-3xl">
                  <Badge className="w-fit gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                    <Sparkles className="size-3.5" />
                    À propos
                  </Badge>
                  <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mt-5 leading-[1.1]">
                    Zalfoot, <span className="text-primary">le foot d&apos;abord.</span>
                  </h1>
                  <p className="text-lg text-muted-foreground mt-5 max-w-2xl">
                    Née de la passion du ballon entre Kaolack et Mbour, Zalfoot met la location de
                    terrains de football à portée de clic, pour que l&apos;envie de jouer ne dépende
                    plus jamais d&apos;un coup de fil compliqué.
                  </p>
                </div>
              </div>
            </section>

            {/* Histoire */}
            <section className="py-14 sm:py-16">
              <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
                  <div className="relative rounded-2xl overflow-hidden shadow-xl ring-1 ring-black/5 aspect-[4/3] order-2 lg:order-1">
                    <Image
                      src="/hero-football.png"
                      alt="Terrain de football de Zalfoot au coucher du soleil"
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
                  </div>
                  <div className="order-1 lg:order-2">
                    <h2 className="text-3xl font-extrabold tracking-tight">Notre histoire</h2>
                    <div className="mt-4 flex flex-col gap-4 text-muted-foreground">
                      <p>
                        Zalfoot est partie d&apos;un constat simple : entre Kaolack et Mbour, trouver un
                        terrain de football au bon créneau relevait souvent du parcours du
                        combattant — appels, allers-retours, créneaux doubles…
                      </p>
                      <p>
                        Nous avons donc construit une plateforme qui fait une seule chose :
                        afficher les disponibilités de nos terrains en temps réel et permettre à
                        chacun de bloquer une heure en quelques clics, à n&apos;importe quelle heure.
                      </p>
                      <p>
                        Aujourd&apos;hui, des centaines d&apos;équipes, d&apos;amis et d&apos;académies
                        jouent chaque semaine sur nos pelouses — et nous entretenons chaque terrain
                        comme si notre propre match s&apos;y jouait le soir.
                      </p>
                    </div>
                    <dl className="grid grid-cols-3 gap-4 pt-6 mt-6 border-t">
                      {[
                        { k: String(facilities.length || 3), v: 'Terrains' },
                        { k: '+1 200', v: 'Joueurs / mois' },
                        { k: '7j/7', v: 'Ouverture' },
                      ].map((s) => (
                        <div key={s.v} className="flex flex-col">
                          <dt className="text-2xl sm:text-3xl font-extrabold text-primary">{s.k}</dt>
                          <dd className="text-sm text-muted-foreground">{s.v}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              </div>
            </section>

            {/* Mission + valeurs */}
            <section className="py-14 sm:py-16 bg-muted/40 border-y">
              <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8">
                <Card className="bg-gradient-to-r from-primary to-emerald-600 text-primary-foreground border-0">
                  <CardContent className="py-8 px-6 sm:px-10 flex items-start gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15">
                      <Target className="size-6" />
                    </span>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-extrabold">Notre mission</h2>
                      <p className="mt-2 text-primary-foreground/85 max-w-2xl">
                        Rendre le football accessible à tous, à toute heure : des terrains toujours prêts,
                        des créneaux clairs et une réservation qui prend moins d&apos;une minute.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-6 sm:grid-cols-3 mt-8">
                  {[
                    { icon: Zap, t: 'Simplicité', d: 'Une heure, un terrain, trois clics. Zéro paperasse, zéro attente.' },
                    { icon: BadgeCheck, t: 'Transparence', d: 'Un tarif unique à l’heure, annoncé et appliqué, sans surprise.' },
                    { icon: Heart, t: 'Passion', d: 'Nous sommes des joueurs avant d’être des loueurs : le terrain est toujours impeccable.' },
                  ].map((v) => (
                    <Card key={v.t}>
                      <CardContent className="pt-6 flex flex-col items-start gap-3">
                        <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <v.icon className="size-5" />
                        </span>
                        <h3 className="font-bold text-lg">{v.t}</h3>
                        <p className="text-sm text-muted-foreground">{v.d}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </section>

            {/* Contact */}
            <section className="py-14 sm:py-16">
              <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-extrabold tracking-tight text-center">Venez nous rencontrer</h2>
                <p className="text-muted-foreground text-center mt-2 max-w-xl mx-auto">
                  Une question, un projet de tournoi, un créneau régulier ? Écrivez-nous ou passez
                  nous voir.
                </p>
                <div className="grid gap-5 sm:grid-cols-3 mt-10 max-w-4xl mx-auto">
                  {[
                    { icon: MapPin, t: 'Adresse', d: CONTACT.address },
                    { icon: Phone, t: 'Téléphone', d: CONTACT.phone },
                    { icon: Clock, t: 'Horaires', d: '7 j/7 · 08:00 → 00:00' },
                  ].map((c) => (
                    <Card key={c.t} className="text-center">
                      <CardContent className="pt-6 flex flex-col items-center gap-2">
                        <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <c.icon className="size-5" />
                        </span>
                        <h3 className="font-bold">{c.t}</h3>
                        <p className="text-sm text-muted-foreground">{c.d}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="flex justify-center mt-10">
                  <Button size="lg" className="h-12 text-base" onClick={() => openBooking()}>
                    <CalendarCheck className="size-5" />
                    Réserver un terrain
                  </Button>
                </div>
              </div>
            </section>
          </motion.div>
        )}
        {page === 'horaires' && (
          <HorairesPage
            facilities={facilities}
            onReserve={() => openBooking()}
            onOpenCalendar={() => goTo('calendrier')}
          />
        )}

        {page === 'calendrier' && <CalendrierPage onReserve={() => openBooking()} />}

        {page === 'contact' && <ContactPage onReserve={() => openBooking()} />}

        {page === 'reserver' && (
          <ReservationPage
            facilities={facilities.filter((f) => f.active)}
            preselectedFacilityId={preselected}
            onBack={() => goTo('accueil')}
          />
        )}
      </main>

      {/* ===== Footer (sticky) ===== */}
      <footer className="mt-auto border-t bg-muted/40">
        <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <Brand size={56} />
            <span>© {new Date().getFullYear()}</span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                type="button"
                className="hover:text-foreground transition-colors cursor-pointer"
                onClick={() => goTo(link.page, link.anchor)}
              >
                {link.label}
              </button>
            ))}
          </nav>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <a
              href={CONTACT.phoneHref}
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer"
            >
              <Phone className="size-3.5" /> {CONTACT.phone}
            </a>
            <p>Location de terrains de football à l&apos;heure — {CONTACT.address}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
