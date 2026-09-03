import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthAdmin, unauthorizedResponse } from '@/lib/auth'

const VALID_STATUSES = new Set(['PENDING', 'CONFIRMED', 'CANCELLED'])

/** PATCH /api/reservations/[id] — changer le statut (auth requis). */
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthAdmin(request)
  if (!auth) return unauthorizedResponse()

  const { id } = await ctx.params
  const body = await request.json().catch(() => ({}))

  if (typeof body?.status !== 'string' || !VALID_STATUSES.has(body.status)) {
    return Response.json({ error: 'Statut invalide (PENDING, CONFIRMED ou CANCELLED).' }, { status: 400 })
  }

  const existing = await db.reservation.findUnique({ where: { id } })
  if (!existing) {
    return Response.json({ error: 'Réservation introuvable.' }, { status: 404 })
  }

  const reservation = await db.reservation.update({
    where: { id },
    data: { status: body.status },
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
