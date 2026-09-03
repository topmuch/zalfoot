'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Activity,
  CalendarDays,
  CalendarPlus,
  LayoutDashboard,
  LogOut,
  MapPin,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { apiFetch, setToken } from './api'
import { Brand } from './brand'
import type { Admin, CalendarEvent, Facility, Reservation, Stats } from './types'
import { OverviewSection } from './overview-section'
import { ReservationsSection } from './reservations-section'
import { CalendarSection } from './calendar-section'
import { AdminsSection } from './admins-section'
import { FacilitiesSection } from './facilities-section'

export type DashboardSection = 'overview' | 'reservations' | 'calendar' | 'facilities' | 'admins'

const NAV_ITEMS: { id: DashboardSection; label: string; icon: typeof LayoutDashboard; mobileLabel: string }[] = [
  { id: 'overview', label: 'Vue d’ensemble', icon: LayoutDashboard, mobileLabel: 'Vue' },
  { id: 'reservations', label: 'Réservations', icon: CalendarPlus, mobileLabel: 'Résas' },
  { id: 'calendar', label: 'Calendrier', icon: CalendarDays, mobileLabel: 'Agenda' },
  { id: 'facilities', label: 'Terrains', icon: MapPin, mobileLabel: 'Terrains' },
  { id: 'admins', label: 'Administrateurs', icon: ShieldCheck, mobileLabel: 'Admins' },
]

export function AdminDashboard({
  currentAdmin,
  onLogout,
  onUnauthorized,
}: {
  currentAdmin: Admin
  onLogout: () => void
  onUnauthorized: () => void
}) {
  const [section, setSection] = useState<DashboardSection>('overview')

  // Données
  const [stats, setStats] = useState<Stats | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadAll = useCallback(async () => {
    setRefreshing(true)
    try {
      const [statsData, reservationsData, eventsData, facilitiesData, adminsData] = await Promise.all([
        apiFetch<Stats>('/api/stats', { auth: true }),
        apiFetch<Reservation[]>('/api/reservations', { auth: true }),
        apiFetch<CalendarEvent[]>('/api/calendar', { auth: true }),
        apiFetch<Facility[]>('/api/facilities'),
        apiFetch<Admin[]>('/api/admins', { auth: true }),
      ])
      setStats(statsData)
      setReservations(reservationsData)
      setEvents(eventsData)
      setFacilities(facilitiesData)
      setAdmins(adminsData)
    } catch (error) {
      if (error instanceof Error && 'status' in error && (error as { status: number }).status === 401) {
        onUnauthorized()
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [onUnauthorized])

  // Charger les données au montage
  useEffect(() => {
    loadAll()
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
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Brand size={40} subtitle="Dashboard administrateur" />
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Badge variant="outline" className="hidden md:inline-flex gap-1.5">
                <Activity className="size-3 text-primary" />
                {refreshing ? 'Synchronisation…' : 'En ligne'}
              </Badge>
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

      <div className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex gap-8">
        {/* ===== Sidebar (desktop) ===== */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-24 flex flex-col gap-1">
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

            <div className="mt-6 rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <MapPin className="size-4 text-primary" />
                Rappel démo
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Connecté avec <strong className="text-foreground">{currentAdmin.email}</strong>.
                Utilisez « Créer un administrateur » dans la section Administrateurs pour ajouter un compte.
              </p>
            </div>
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

      <footer className="mt-auto border-t bg-background py-4">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-xs text-muted-foreground">
          Zalfoot Dashboard © {new Date().getFullYear()} — Terrains, réservations et comptes administrateurs
        </div>
      </footer>
    </div>
  )
}
