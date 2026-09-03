import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthAdmin, unauthorizedResponse } from '@/lib/auth'

/** PATCH /api/facilities/[id] — activer/désactiver (super admin requis). */
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthAdmin(request)
  if (!auth) return unauthorizedResponse()
  if (auth.role !== 'SUPER_ADMIN') {
    return Response.json({ error: 'Action réservée aux super administrateurs.' }, { status: 403 })
  }

  const { id } = await ctx.params
  const existing = await db.facility.findUnique({ where: { id } })
  if (!existing) {
    return Response.json({ error: 'Installation introuvable.' }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const data: Record<string, boolean | number | string | null> = {}
  if (typeof body.active === 'boolean') data.active = body.active
  if (Number.isFinite(Number(body.pricePerHour)) && Number(body.pricePerHour) >= 0) {
    data.pricePerHour = Number(body.pricePerHour)
  }

  if (Object.keys(data).length === 0) {
    return Response.json({ error: 'Aucun champ valide fourni.' }, { status: 400 })
  }

  const facility = await db.facility.update({ where: { id }, data })
  return Response.json({ facility })
}
