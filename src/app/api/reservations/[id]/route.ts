import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthAdmin, unauthorizedResponse } from '@/lib/auth'

const VALID_STATUSES = new Set(['PENDING', 'CONFIRMED', 'CANCELLED'])
const VALID_PAYMENT_STATUSES = new Set(['UNPAID', 'PAID'])

/**
 * PATCH /api/reservations/[id] (auth requis)
 * Body : { status? } et/ou { paymentStatus? } — ex. « Marquer payé » (Wave).
 */
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthAdmin(request)
  if (!auth) return unauthorizedResponse()

  const { id } = await ctx.params
  const body = await request.json().catch(() => ({}))

  const hasStatus = typeof body?.status === 'string'
  const hasPaymentStatus = typeof body?.paymentStatus === 'string'

  if (!hasStatus && !hasPaymentStatus) {
    return Response.json({ error: 'Fournir status et/ou paymentStatus.' }, { status: 400 })
  }
  if (hasStatus && !VALID_STATUSES.has(body.status)) {
    return Response.json({ error: 'Statut invalide (PENDING, CONFIRMED ou CANCELLED).' }, { status: 400 })
  }
  if (hasPaymentStatus && !VALID_PAYMENT_STATUSES.has(body.paymentStatus)) {
    return Response.json({ error: 'Statut de paiement invalide (UNPAID ou PAID).' }, { status: 400 })
  }

  const existing = await db.reservation.findUnique({ where: { id } })
  if (!existing) {
    return Response.json({ error: 'Réservation introuvable.' }, { status: 404 })
  }

  const reservation = await db.reservation.update({
    where: { id },
    data: {
      ...(hasStatus ? { status: body.status } : {}),
      ...(hasPaymentStatus ? { paymentStatus: body.paymentStatus } : {}),
    },
    include: { facility: true },
  })
  return Response.json({ reservation })
}

/** DELETE /api/reservations/[id] — supprimer (auth requis). */
export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthAdmin(request)
  if (!auth) return unauthorizedResponse()

  const { id } = await ctx.params
  const existing = await db.reservation.findUnique({ where: { id } })
  if (!existing) {
    return Response.json({ error: 'Réservation introuvable.' }, { status: 404 })
  }

  await db.reservation.delete({ where: { id } })
  return Response.json({ success: true })
}
