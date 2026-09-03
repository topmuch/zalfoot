'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from './api'

/**
 * Identité publique du site (nom + logo), lue depuis /api/settings.
 * Cache module : un seul fetch partagé par tous les composants <Brand />.
 */

export type SiteIdentity = {
  siteName: string
  siteLogo: string | null
}

const DEFAULT_IDENTITY: SiteIdentity = { siteName: 'Zalfoot', siteLogo: null }

let cache: SiteIdentity | null = null
let inflight: Promise<SiteIdentity> | null = null
const listeners = new Set<(identity: SiteIdentity) => void>()

function fetchIdentity(): Promise<SiteIdentity> {
  if (cache) return Promise.resolve(cache)
  if (!inflight) {
    inflight = apiFetch<Partial<SiteIdentity>>('/api/settings')
      .then((data) => {
        cache = {
          siteName: data.siteName || DEFAULT_IDENTITY.siteName,
          siteLogo: data.siteLogo || null,
        }
        listeners.forEach((fn) => fn(cache!))
        return cache
      })
      .catch(() => DEFAULT_IDENTITY)
      .finally(() => {
        inflight = null
      })
  }
  return inflight
}

/** Invalide le cache (après modification du nom/logo dans le dashboard). */
export function invalidateSiteIdentity() {
  cache = null
  fetchIdentity()
}

/** Identité du site — valeur par défaut instantanée, mise à jour dès la réponse API. */
export function useSiteIdentity(): SiteIdentity {
  const [identity, setIdentity] = useState<SiteIdentity>(cache ?? DEFAULT_IDENTITY)

  useEffect(() => {
    let active = true
    fetchIdentity().then((value) => {
      if (active) setIdentity(value)
    })
    const listener = (value: SiteIdentity) => {
      if (active) setIdentity(value)
    }
    listeners.add(listener)
    return () => {
      active = false
      listeners.delete(listener)
    }
  }, [])

  return identity
}
