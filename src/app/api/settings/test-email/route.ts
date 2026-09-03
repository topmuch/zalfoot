import { NextRequest } from 'next/server'
import { getAuthAdmin, unauthorizedResponse } from '@/lib/auth'
import { sendTestEmail } from '@/lib/email'

/** POST /api/settings/test-email (admin) — envoie un e-mail de test à l'adresse de notification. */
export async function POST(request: NextRequest) {
  const auth = await getAuthAdmin(request)
  if (!auth) return unauthorizedResponse()

  try {
    const result = await sendTestEmail('Zalfoot')
    return Response.json({ ok: true, to: result.to })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Envoi impossible.' },
      { status: 400 },
    )
  }
}
