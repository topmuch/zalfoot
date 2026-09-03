'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiFetch, getToken, setToken } from '@/components/zalspor/api'
import { Landing } from '@/components/zalspor/landing'
import { AdminLogin } from '@/components/zalspor/admin-login'
import { AdminDashboard } from '@/components/zalspor/admin-dashboard'
import type { Admin, Facility } from '@/components/zalspor/types'

type View = 'public' | 'login' | 'dashboard'

export default function Home() {
  const [view, setView] = useState<View>('public')
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null)
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [booting, setBooting] = useState(true)

  // Chargement initial : installations publiques + restauration de session
  useEffect(() => {
    let cancelled = false

    async function boot() {
      try {
        const facilitiesData = await apiFetch<Facility[]>('/api/facilities')
        if (!cancelled) setFacilities(facilitiesData)
      } catch {
        // La landing reste utilisable même sans installations
      }

      const token = getToken()
      if (token) {
        try {
          const me = await apiFetch<{ admin: Admin }>('/api/auth/me', { auth: true })
          if (!cancelled) {
            setCurrentAdmin(me.admin)
            setView('dashboard')
          }
        } catch {
          setToken(null)
        }
      }
      if (!cancelled) setBooting(false)
    }

    boot()
    return () => {
      cancelled = true
    }
  }, [])

  const handleUnauthorized = useCallback(() => {
    setToken(null)
    setCurrentAdmin(null)
    setView('login')
  }, [])

  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground animate-pulse">
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </span>
          <p className="text-sm text-muted-foreground">Chargement de Zalfoot…</p>
        </div>
      </div>
    )
  }

  // ===== Vue dashboard admin =====
  if (view === 'dashboard' && currentAdmin) {
    return (
      <AdminDashboard
        currentAdmin={currentAdmin}
        onLogout={() => {
          setCurrentAdmin(null)
          setView('public')
        }}
        onUnauthorized={handleUnauthorized}
      />
    )
  }

  // ===== Vue connexion admin =====
  if (view === 'login') {
    return (
      <AdminLogin
        onBack={() => setView('public')}
        onSuccess={(admin) => {
          setCurrentAdmin(admin)
          setView('dashboard')
        }}
      />
    )
  }

  // ===== Vue publique =====
  return (
    <Landing
      facilities={facilities}
      onOpenAdmin={() => setView('login')}
    />
  )
}
