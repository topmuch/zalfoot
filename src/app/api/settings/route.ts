import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthAdmin, unauthorizedResponse } from '@/lib/auth'

/**
 * Réglages publics de la plateforme.
 * - GET /api/settings  (public)  → { wavePaymentLink: string | null }
 * - PUT /api/settings  (admin)   → enregistre le lien de paiement Wave Business
 *
 * Le lien Wave peut contenir les balises optionnelles {amount} (montant FCFA)
 * et {reference} (référence de la réservation), remplacées automatiquement
 * lors de la redirection du client.
 */

export const WAVE_LINK_KEY = 'wave_payment_link'
const LINK_MAX_LENGTH = 500

export async function GET() {
  const setting = await db.setting.findUnique({ where: { key: WAVE_LINK_KEY } })
  return Response.json({ wavePaymentLink: setting?.value ?? null })
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

  const raw = body.wavePaymentLink
  if (raw !== undefined && raw !== null && typeof raw !== 'string') {
    return Response.json({ error: 'Lien Wave invalide.' }, { status: 400 })
  }

  const link = typeof raw === 'string' ? raw.trim() : ''

  if (link) {
    if (link.length > LINK_MAX_LENGTH) {
      return Response.json({ error: 'Le lien est trop long (500 caractères maximum).' }, { status: 400 })
    }
    if (!/^https?:\/\//i.test(link)) {
      return Response.json({ error: 'Le lien doit commencer par https:// (lien Wave Business).' }, { status: 400 })
    }
  }

  const value = link || ''
  await db.setting.upsert({
    where: { key: WAVE_LINK_KEY },
    update: { value },
    create: { key: WAVE_LINK_KEY, value },
  })

  return Response.json({ wavePaymentLink: value || null })
}
