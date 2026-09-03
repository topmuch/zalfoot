import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthAdmin, unauthorizedResponse } from '@/lib/auth'

/** PATCH /api/admins/[id] — activer/désactiver un compte (super admin). */
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthAdmin(request)
  if (!auth) return unauthorizedResponse()
  if (auth.role !== 'SUPER_ADMIN') {
    return Response.json({ error: 'Action réservée aux super administrateurs.' }, { status: 403 })
  }

  const { id } = await ctx.params

  if (id === auth.id) {
    return Response.json({ error: 'Vous ne pouvez pas modifier votre propre compte ici.' }, { status: 400 })
  }

  const body = await request.json().catch(() => ({}))
  if (typeof body?.active !== 'boolean') {
    return Response.json({ error: 'Champ « active » (booléen) requis.' }, { status: 400 })
  }

  const target = await db.admin.findUnique({ where: { id } })
  if (!target) {
    return Response.json({ error: 'Administrateur introuvable.' }, { status: 404 })
  }

  // Sécurité : ne pas désactiver le dernier super admin actif
  if (!body.active && target.role === 'SUPER_ADMIN') {
    const activeSuperAdmins = await db.admin.count({ where: { role: 'SUPER_ADMIN', active: true } })
    if (activeSuperAdmins <= 1) {
      return Response.json(
        { error: 'Impossible de désactiver le dernier super administrateur actif.' },
        { status: 400 },
      )
    }
  }

  const updated = await db.admin.update({
    where: { id },
    data: { active: body.active },
    select: { id: true, name: true, email: true, role: true, phone: true, active: true, createdAt: true },
  })
  return Response.json({ admin: updated })
}

/** DELETE /api/admins/[id] — supprimer un compte (super admin). */
export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthAdmin(request)
  if (!auth) return unauthorizedResponse()
  if (auth.role !== 'SUPER_ADMIN') {
    return Response.json({ error: 'Action réservée aux super administrateurs.' }, { status: 403 })
  }

  const { id } = await ctx.params

  if (id === auth.id) {
    return Response.json({ error: 'Vous ne pouvez pas supprimer votre propre compte.' }, { status: 400 })
  }

  const target = await db.admin.findUnique({ where: { id } })
  if (!target) {
    return Response.json({ error: 'Administrateur introuvable.' }, { status: 404 })
  }

  if (target.role === 'SUPER_ADMIN') {
    const otherSuperAdmins = await db.admin.count({
      where: { role: 'SUPER_ADMIN', id: { not: id } },
    })
    if (otherSuperAdmins === 0) {
      return Response.json(
        { error: 'Impossible de supprimer le dernier super administrateur.' },
        { status: 400 },
      )
    }
  }

  await db.admin.delete({ where: { id } })
  return Response.json({ success: true })
}
