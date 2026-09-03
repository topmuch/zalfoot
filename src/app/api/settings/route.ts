import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthAdmin, unauthorizedResponse } from '@/lib/auth'
import { getFullSettings, getPublicSettings, SETTING_KEYS, validateSetting } from '@/lib/settings'

/**
 * Réglages de la plateforme (onglet « Paramètres » du dashboard).
 * - GET  /api/settings        (public)  → identité du site { siteName, siteLogo, wavePaymentLink }
 * - GET  /api/settings?full=1 (admin)   → réglages complets (SEO, e-mail, SMTP…)
 * - PUT  /api/settings        (admin)   → mise à jour partielle { clé: valeur }
 *
 * Le lien Wave peut contenir les balises {amount} (acompte FCFA) et {reference},
 * remplacées lors de la redirection du client.
 */

export { SETTING_KEYS }

const ALLOWED_KEYS = new Set<string>(Object.values(SETTING_KEYS))

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const wantsFull = url.searchParams.get('full') === '1'

  if (wantsFull) {
    const auth = await getAuthAdmin(request)
    if (!auth) return unauthorizedResponse()
    return Response.json(await getFullSettings())
  }

  // Sous-ensemble public : identité du site + lien Wave (rien de sensible)
  const public_ = await getPublicSettings()
  return Response.json({
    siteName: public_.siteName,
    siteLogo: public_.siteLogo,
    wavePaymentLink: public_.wavePaymentLink,
  })
}

export async function PUT(request: NextRequest) {
  const auth = await getAuthAdmin(request)
  if (!auth) return unauthorizedResponse()

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Requête invalide (JSON attendu).' }, { status: 400 })
  }

  // Ne garder que les clés connues et de type string
  const entries: [string, string][] = []
  for (const [key, value] of Object.entries(body)) {
    if (!ALLOWED_KEYS.has(key)) continue
    if (typeof value !== 'string') continue
    entries.push([key, value.trim()])
  }
  if (entries.length === 0) {
    return Response.json({ error: 'Aucun réglage valide à enregistrer.' }, { status: 400 })
  }

  // Validation de chaque valeur
  for (const [key, value] of entries) {
    const error = validateSetting(key, value)
    if (error) return Response.json({ error: `${error} (${key})` }, { status: 400 })
  }

  for (const [key, value] of entries) {
    await db.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
  }

  return Response.json(await getFullSettings())
}
