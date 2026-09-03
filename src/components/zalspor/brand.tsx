'use client'

import Image from 'next/image'
import { useSiteIdentity } from './site-settings'

/**
 * Marque du site : logo écusson (personnalisable dans les Paramètres).
 * Le nom est déjà inscrit dans le logo, aucun texte supplémentaire n'est affiché.
 */
export function Brand({
  size = 40,
  subtitle,
}: {
  size?: number
  subtitle?: string
}) {
  const { siteName, siteLogo } = useSiteIdentity()

  return (
    <span className="flex items-center gap-3">
      <Image
        src={siteLogo || '/logo.webp'}
        alt={`Logo ${siteName}`}
        width={size}
        height={size}
        priority
        className="rounded-lg shrink-0 object-contain"
      />
      {subtitle ? (
        <span className="hidden sm:block leading-tight text-[11px] text-muted-foreground">
          {subtitle}
        </span>
      ) : null}
    </span>
  )
}
