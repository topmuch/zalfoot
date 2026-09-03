'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { apiFetch, getToken, setToken } from '@/components/zalspor/api'
import { useSiteIdentity } from '@/components/zalspor/site-settings'
import { Landing } from '@/components/zalspor/landing'
import { AdminLogin } from '@/components/zalspor/admin-login'
import { AdminDashboard } from '@/components/zalspor/admin-dashboard'
import type { Admin, Facility } from '@/components/zalspor/types'

type View = 'public' | 'login' | 'dashboard'

export default function Home() {
  const { siteName, siteLogo } = useSiteIdentity()
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
        <div className="flex flex-col items-center gap-5">
          <Image
            src={siteLogo || '/logo.webp'}
            alt={`Logo ${siteName}`}
            width={96}
            height={96}
            priority
            className="rounded-2xl object-contain animate-pulse"
          />
          <p className="text-sm text-muted-foreground">Chargement de {siteName}…</p>
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
