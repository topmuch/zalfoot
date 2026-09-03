import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthAdmin, unauthorizedResponse } from '@/lib/auth'

/** PATCH /api/calendar/[id] — modifier un événement (auth requis). */
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthAdmin(request)
  if (!auth) return unauthorizedResponse()

  const { id } = await ctx.params
  const existing = await db.calendarEvent.findUnique({ where: { id } })
  if (!existing) {
    return Response.json({ error: 'Événement introuvable.' }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const data: Record<string, string | null> = {}

  if (typeof body.title === 'string' && body.title.trim().length >= 3) data.title = body.title.trim()
  if (typeof body.description === 'string') data.description = body.description.trim() || null
  if (typeof body.type === 'string' && body.type) data.type = body.type.toUpperCase()
  if (typeof body.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.date)) data.date = body.date
  if (typeof body.startTime === 'string') data.startTime = body.startTime
  if (typeof body.endTime === 'string') data.endTime = body.endTime
  if (typeof body.facilityId === 'string') data.facilityId = body.facilityId || null

  if (Object.keys(data).length === 0) {
    return Response.json({ error: 'Aucun champ valide fourni.' }, { status: 400 })
  }

  const event = await db.calendarEvent.update({
    where: { id },
    data,
    include: { facility: true },
  })
  return Response.json({ event })
}

/** DELETE /api/calendar/[id] — supprimer un événement (auth requis). */
export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthAdmin(request)
  if (!auth) return unauthorizedResponse()

  const { id } = await ctx.params
  const existing = await db.calendarEvent.findUnique({ where: { id } })
  if (!existing) {
    return Response.json({ error: 'Événement introuvable.' }, { status: 404 })
  }

  await db.calendarEvent.delete({ where: { id } })
  return Response.json({ success: true })
}
