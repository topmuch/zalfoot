'use client'

import Image from 'next/image'

/**
 * Marque Zalfoot : logo écusson (fond transparent).
 * Le nom est déjà inscrit dans le logo, aucun texte supplémentaire n'est affiché.
 */
export function Brand({
  size = 40,
  subtitle,
}: {
  size?: number
  subtitle?: string
}) {
  return (
    <span className="flex items-center gap-3">
      <Image
        src="/logo.webp"
        alt="Logo Zalfoot"
        width={size}
        height={size}
        priority
        className="rounded-lg shrink-0"
      />
      {subtitle ? (
        <span className="hidden sm:block leading-tight text-[11px] text-muted-foreground">
          {subtitle}
        </span>
      ) : null}
    </span>
  )
}
