'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { BellRing, CalendarDays, Clock, MapPin, Phone, Wallet, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDateFr, formatHourLabel, type Reservation } from './types'

/** Libellé + styles d'un statut de réservation. */
const STATUS_META: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: 'En attente',
    className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-900',
  },
  CONFIRMED: {
    label: 'Confirmée',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-900',
  },
}

/** Montant FCFA lisible : 25000 → « 25 000 F ». */
function formatFcfa(amount: number | null): string {
  if (amount == null) return '—'
  return `${Math.round(amount).toLocaleString('fr-FR')} F`
}

/**
 * Grande notification « Nouvelle réservation » affichée dès la connexion au
 * dashboard : une carte imposante par réservation reçue depuis la dernière
 * consultation (nom du client, date, heure, terrain, montants) + bouton Fermer.
 */
export function NewReservationsModal({
  reservations,
  onClose,
  onViewReservations,
}: {
  reservations: Reservation[]
  onClose: () => void
  onViewReservations: () => void
}) {
  // Échap. et clic sur le fond ferment aussi la notification
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const single = reservations.length === 1

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Nouvelles réservations"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', duration: 0.45, bounce: 0.25 }}
        className="w-full max-w-xl max-h-[88vh] overflow-y-auto zalspor-scroll rounded-2xl border-2 border-primary/30 bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===== En-tête ===== */}
        <div className="relative bg-gradient-to-br from-primary to-emerald-800 text-primary-foreground px-6 py-5 sm:px-8">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la notification"
            className="absolute right-3 top-3 rounded-lg p-1.5 text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/15 transition-colors"
          >
            <X className="size-5" />
          </button>
          <div className="flex items-center gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <BellRing className="size-7 animate-pulse" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold leading-tight">
                {single
                  ? 'Nouvelle réservation 🎉'
                  : `${reservations.length} nouvelles réservations 🎉`}
              </h2>
              <p className="text-sm text-primary-foreground/80 mt-0.5">
                {single
                  ? 'Reçue depuis votre dernière visite'
                  : 'Reçues depuis votre dernière visite'}
              </p>
            </div>
          </div>
        </div>

        {/* ===== Cartes des réservations ===== */}
        <div className="p-4 sm:p-6 grid gap-4">
          {reservations.map((r) => {
            const meta = STATUS_META[r.status] ?? STATUS_META.PENDING
            return (
              <article
                key={r.id}
                className="rounded-xl border-2 border-primary/25 bg-gradient-to-br from-primary/5 to-emerald-50/50 dark:to-emerald-950/20 p-4 sm:p-5"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <p className="text-lg sm:text-xl font-bold text-foreground">{r.customerName}</p>
                  <Badge variant="outline" className={meta.className}>{meta.label}</Badge>
                </div>

                <div className="mt-3 grid gap-2 text-sm text-foreground/90">
                  <p className="flex items-center gap-2">
                    <CalendarDays className="size-4 shrink-0 text-primary" />
                    <span className="font-semibold">{formatDateFr(r.date)}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="size-4 shrink-0 text-primary" />
                    <span className="font-semibold tabular-nums">
                      {formatHourLabel(r.startTime)} → {formatHourLabel(r.endTime)}
                    </span>
                  </p>
                  {r.facility && (
                    <p className="flex items-center gap-2">
                      <MapPin className="size-4 shrink-0 text-primary" />
                      {r.facility.name}
                    </p>
                  )}
                  {r.customerPhone && (
                    <p className="flex items-center gap-2 tabular-nums">
                      <Phone className="size-4 shrink-0 text-primary" />
                      {r.customerPhone}
                    </p>
                  )}
                  <p className="flex items-center gap-2">
                    <Wallet className="size-4 shrink-0 text-primary" />
                    <span className="font-semibold">{formatFcfa(r.amount)}</span>
                    <span className="text-muted-foreground">
                      (acompte {formatFcfa(r.depositAmount)} · Wave)
                    </span>
                  </p>
                </div>

                {r.source === 'ADMIN' && (
                  <p className="mt-3 text-xs text-muted-foreground">Créée par un administrateur</p>
                )}
              </article>
            )
          })}

          {/* ===== Actions ===== */}
          <div className="grid gap-2 sm:grid-cols-2 pt-1">
            <Button size="lg" variant="outline" className="h-12 text-base" onClick={onViewReservations}>
              <CalendarDays className="size-5" />
              Voir les réservations
            </Button>
            <Button size="lg" className="h-12 text-base" onClick={onClose}>
              <X className="size-5" />
              Fermer
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
