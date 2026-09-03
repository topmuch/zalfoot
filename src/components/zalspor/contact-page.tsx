'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { CalendarCheck, Clock, MapPin, Phone, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

export function ContactPage({ onReserve }: { onReserve: () => void }) {
  return (
    <motion.div
      key="contact"
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
              <Phone className="size-3.5" />
              Contact
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mt-5 leading-[1.1]">
              Contactez <span className="text-primary">Zalfoot</span>
            </h1>
            <p className="text-lg text-muted-foreground mt-5 max-w-2xl">
              Une question, un créneau à trouver, un projet de tournoi ? Appelez-nous ou passez à
              l&apos;accueil du complexe — nous sommes là 7 jours sur 7.
            </p>
          </div>
        </div>
      </section>

      {/* ===== Coordonnées ===== */}
      <section className="py-14 sm:py-16">
        <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:gap-12 lg:grid-cols-2 items-center">
            {/* Panneau visuel */}
            <div className="relative rounded-2xl overflow-hidden shadow-xl ring-1 ring-black/5 aspect-[4/3] order-2 lg:order-1">
              <Image
                src="/hero-football.png"
                alt="Terrain de football en gazon synthétique du complexe Zalfoot"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                <div className="flex items-start gap-3 text-white">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                    <MapPin className="size-5" />
                  </span>
                  <div>
                    <p className="font-bold text-lg leading-tight">Complexe sportif Zalfoot</p>
                    <p className="text-sm text-white/85 mt-0.5">
                      Croisement Kaolack - Mbour, Sénégal
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cartes coordonnées */}
            <div className="order-1 lg:order-2 grid gap-5">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <MapPin className="size-6" />
                    </span>
                    <h2 className="font-bold text-lg">Adresse</h2>
                  </div>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  <p className="text-foreground font-medium">Zalfoot</p>
                  <p>Croisement Kaolack - Mbour, Sénégal</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Phone className="size-6" />
                    </span>
                    <h2 className="font-bold text-lg">Téléphone</h2>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-xl font-extrabold tabular-nums">+221 78 278 49 49</p>
                  <Button asChild size="lg" className="h-12">
                    <a href="tel:+221782784949" className="cursor-pointer">
                      <Phone className="size-4" />
                      Appeler
                    </a>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Clock className="size-6" />
                    </span>
                    <h2 className="font-bold text-lg">Horaires</h2>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-4">
                  <p className="text-muted-foreground">
                    Ouvert <strong className="text-foreground">7 j/7</strong>
                  </p>
                  <p className="text-xl font-extrabold tabular-nums">
                    08:00 <span className="text-muted-foreground font-medium">→</span> 00:00
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="pb-14 sm:pb-20">
        <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-r from-primary to-emerald-600 text-primary-foreground border-0 overflow-hidden">
            <CardContent className="py-10 px-6 sm:px-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold">Envie de jouer ce soir ?</h2>
                <p className="mt-2 text-primary-foreground/85 max-w-lg">
                  Réservez votre heure de foot en ligne — acompte de 5 000 FCFA via Wave, solde sur
                  place.
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
                  <Users className="size-5" />
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
