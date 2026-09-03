'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Activity,
  CalendarDays,
  CalendarPlus,
  LayoutDashboard,
  LogOut,
  MapPin,
  Settings,
  ShieldCheck,
  Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { apiFetch, setToken } from './api'
import { Brand } from './brand'
import { formatDateFr, type Admin, type CalendarEvent, type Facility, type Reservation, type Stats } from './types'
import { OverviewSection } from './overview-section'
import { ReservationsSection } from './reservations-section'
import { CalendarSection } from './calendar-section'
import { AdminsSection } from './admins-section'
import { FacilitiesSection } from './facilities-section'
import { PaymentSection } from './payment-section'
import { SettingsSection } from './settings-section'
import { NewReservationsModal } from './new-reservations-modal'
import { ThemeToggle } from './theme-toggle'

export type DashboardSection =
  | 'overview'
  | 'reservations'
  | 'calendar'
  | 'facilities'
  | 'payment'
  | 'settings'
  | 'admins'

const NAV_ITEMS: { id: DashboardSection; label: string; icon: typeof LayoutDashboard; mobileLabel: string }[] = [
  { id: 'overview', label: 'Vue d’ensemble', icon: LayoutDashboard, mobileLabel: 'Vue' },
  { id: 'reservations', label: 'Réservations', icon: CalendarPlus, mobileLabel: 'Résas' },
  { id: 'calendar', label: 'Calendrier', icon: CalendarDays, mobileLabel: 'Agenda' },
  { id: 'facilities', label: 'Terrains', icon: MapPin, mobileLabel: 'Terrains' },
  { id: 'payment', label: 'Paiement', icon: Wallet, mobileLabel: 'Paiement' },
  { id: 'settings', label: 'Paramètres', icon: Settings, mobileLabel: 'Réglages' },
  { id: 'admins', label: 'Administrateurs', icon: ShieldCheck, mobileLabel: 'Admins' },
]

/** Intervalle de synchronisation automatique du dashboard (10 secondes). */
const POLL_INTERVAL_MS = 10_000

/** Heure locale au format HH:mm:ss (ex. 17:42:10). */
function formatSyncTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function AdminDashboard({
  currentAdmin,
  onLogout,
  onUnauthorized,
}: {
  currentAdmin: Admin
  onLogout: () => void
  onUnauthorized: () => void
}) {
  const { toast } = useToast()
  const [section, setSection] = useState<DashboardSection>('overview')

  // Données
  const [stats, setStats] = useState<Stats | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)

  // Réservations reçues depuis la dernière consultation : grande notification
  // affichée dès la connexion, fermée manuellement (POST /api/reservations/seen).
  const [newReservations, setNewReservations] = useState<Reservation[] | null>(null)

  // Référentiel des ids de réservations déjà connus (détection des nouveautés)
  const knownReservationIdsRef = useRef<Set<string> | null>(null)

  /**
   * Charge toutes les données du dashboard.
   * `announceNew` : affiche un toast pour les réservations apparues depuis le
   * chargement précédent (utilisé par le polling et le retour d'onglet).
   */
  const loadAll = useCallback(
    async (options: { announceNew?: boolean } = {}) => {
      setRefreshing(true)
      try {
        const [statsData, reservationsData, eventsData, facilitiesData, adminsData] = await Promise.all([
          apiFetch<Stats>('/api/stats', { auth: true }),
          apiFetch<Reservation[]>('/api/reservations', { auth: true }),
          apiFetch<CalendarEvent[]>('/api/calendar', { auth: true }),
          // ?all=1 : le dashboard gère aussi les terrains désactivés
          apiFetch<Facility[]>('/api/facilities?all=1', { auth: true }),
          apiFetch<Admin[]>('/api/admins', { auth: true }),
        ])

        // Détection des nouvelles réservations : ids absents du lot précédent.
        // Pas de toast au premier chargement ni quand le total diminue (suppression).
        const previousIds = knownReservationIdsRef.current
        if (previousIds !== null && options.announceNew && reservationsData.length >= previousIds.size) {
          const newOnes = reservationsData.filter((r) => !previousIds.has(r.id))
          if (newOnes.length === 1) {
            const r = newOnes[0]
            toast({
              title: 'Nouvelle réservation reçue 🎉',
              description: `${r.customerName} — ${formatDateFr(r.date)} ${r.startTime}`,
            })
          } else if (newOnes.length > 1) {
            const extra = newOnes.length - 2
            toast({
              title: `${newOnes.length} nouvelles réservations reçues 🎉`,
              description:
                newOnes
                  .slice(0, 2)
                  .map((r) => `${r.customerName} — ${formatDateFr(r.date)} ${r.startTime}`)
                  .join(' · ') + (extra > 0 ? ` · et ${extra} autre${extra > 1 ? 's' : ''}` : ''),
            })
          }
        }
        knownReservationIdsRef.current = new Set(reservationsData.map((r) => r.id))

        setStats(statsData)
        setReservations(reservationsData)
        setEvents(eventsData)
        setFacilities(facilitiesData)
        setAdmins(adminsData)
        setLastSyncTime(formatSyncTime(new Date()))
      } catch (error) {
        if (error instanceof Error && 'status' in error && (error as { status: number }).status === 401) {
          onUnauthorized()
        }
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [onUnauthorized, toast]
  )

  // Chargement initial
  useEffect(() => {
    loadAll()

    // Nouvelles réservations depuis la dernière visite → notification visuelle
    let cancelled = false
    apiFetch<Reservation[]>('/api/reservations/new', { auth: true })
      .then((list) => {
        if (!cancelled && list.length > 0) setNewReservations(list)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [loadAll])

  /** Ferme la notification et marque les réservations comme consultées. */
  const handleCloseNewReservations = useCallback(() => {
    setNewReservations(null)
    apiFetch('/api/reservations/seen', { method: 'POST', auth: true }).catch(() => {})
  }, [])

  /** Ferme la notification puis ouvre l'onglet Réservations. */
  const handleViewNewReservations = useCallback(() => {
    handleCloseNewReservations()
    setSection('reservations')
  }, [handleCloseNewReservations])

  // Synchronisation automatique toutes les 10 secondes (nettoyée au démontage)
  useEffect(() => {
    const interval = setInterval(() => {
      loadAll({ announceNew: true })
    }, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [loadAll])

  // Rafraîchissement immédiat quand l'onglet redevient visible ou reprend le focus
  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') {
        loadAll({ announceNew: true })
      }
    }
    document.addEventListener('visibilitychange', refreshIfVisible)
    window.addEventListener('focus', refreshIfVisible)
    return () => {
      document.removeEventListener('visibilitychange', refreshIfVisible)
      window.removeEventListener('focus', refreshIfVisible)
    }
  }, [loadAll])

  function handleLogout() {
    apiFetch('/api/auth/logout', { method: 'POST', auth: true }).catch(() => {})
    setToken(null)
    onLogout()
  }

  const initials = currentAdmin.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      {/* ===== Barre supérieure ===== */}
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8">
          <div className="flex h-24 items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Brand size={80} subtitle="Dashboard administrateur" />
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Badge variant="outline" className="hidden md:inline-flex gap-1.5 tabular-nums">
                <Activity className={cn('size-3 text-primary', refreshing && 'animate-pulse')} />
                Temps réel
                {lastSyncTime ? (
                  <span key={lastSyncTime} className="font-normal text-muted-foreground">
                    · Auto-sync {lastSyncTime}
                  </span>
                ) : null}
              </Badge>
              <ThemeToggle />
              <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l">
                <Avatar className="size-8 border">
                  <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block leading-tight max-w-36">
                  <p className="text-sm font-medium truncate">{currentAdmin.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {currentAdmin.role === 'SUPER_ADMIN' ? 'Super admin' : 'Admin'}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Se déconnecter" title="Se déconnecter">
                  <LogOut className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ===== Navigation sections (mobile) ===== */}
      <nav className="lg:hidden border-b bg-background overflow-x-auto zalspor-scroll">
        <div className="flex gap-1 px-4 py-2 min-w-max">
          {NAV_ITEMS.map((item) => (
            <Button
              key={item.id}
              size="sm"
              variant={section === item.id ? 'default' : 'ghost'}
              className={cn('h-9 shrink-0', section !== item.id && 'text-muted-foreground')}
              onClick={() => setSection(item.id)}
            >
              <item.icon className="size-4" />
              <span className="hidden sm:inline">{item.label}</span>
              <span className="sm:hidden">{item.mobileLabel}</span>
            </Button>
          ))}
        </div>
      </nav>

      <div className="flex-1 mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex gap-8">
        {/* ===== Sidebar (desktop) ===== */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-28 flex flex-col gap-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 pb-2">
              Gestion
            </p>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left',
                  section === item.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-background hover:text-foreground'
                )}
                aria-current={section === item.id ? 'page' : undefined}
              >
                <item.icon className="size-4.5" />
                {item.label}
              </button>
            ))}
          </div>
        </aside>

        {/* ===== Contenu ===== */}
        <main className="flex-1 min-w-0">
          {section === 'overview' && (
            <OverviewSection
              stats={stats}
              facilities={facilities}
              currentAdmin={currentAdmin}
              onGoToReservations={() => setSection('reservations')}
              onGoToCalendar={() => setSection('calendar')}
              onGoToAdmins={() => setSection('admins')}
            />
          )}
          {section === 'reservations' && (
            <ReservationsSection
              reservations={reservations}
              facilities={facilities}
              loading={loading}
              onRefresh={loadAll}
              onUnauthorized={onUnauthorized}
            />
          )}
          {section === 'calendar' && (
            <CalendarSection
              events={events}
              reservations={reservations}
              facilities={facilities}
              loading={loading}
              onRefresh={loadAll}
              onUnauthorized={onUnauthorized}
            />
          )}
          {section === 'facilities' && (
            <FacilitiesSection
              facilities={facilities}
              loading={loading}
              onRefresh={loadAll}
              onUnauthorized={onUnauthorized}
            />
          )}
          {section === 'payment' && <PaymentSection onUnauthorized={onUnauthorized} />}
          {section === 'settings' && <SettingsSection onUnauthorized={onUnauthorized} />}
          {section === 'admins' && (
            <AdminsSection
              admins={admins}
              currentAdmin={currentAdmin}
              loading={loading}
              onRefresh={loadAll}
              onUnauthorized={onUnauthorized}
            />
          )}
        </main>
      </div>

      {/* ===== Notification « Nouvelle réservation » (à la connexion) ===== */}
      {newReservations && newReservations.length > 0 && (
        <NewReservationsModal
          reservations={newReservations}
          onClose={handleCloseNewReservations}
          onViewReservations={handleViewNewReservations}
        />
      )}

      <footer className="mt-auto border-t bg-background py-4">
        <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8 text-center text-xs text-muted-foreground">
          Zalfoot Dashboard © {new Date().getFullYear()} — Terrains, réservations et comptes administrateurs
        </div>
      </footer>
    </div>
  )
}
