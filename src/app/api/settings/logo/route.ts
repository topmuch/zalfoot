import { NextRequest } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { db } from '@/lib/db'
import { getAuthAdmin, unauthorizedResponse } from '@/lib/auth'
import { SETTING_KEYS } from '@/lib/settings'

/**
 * POST /api/settings/logo (admin) — téléverse le logo du site.
 * Reçoit un FormData { file } (image ≤ 2 Mo), l'écrit dans public/uploads/
 * et enregistre son chemin dans le réglage site_logo.
 */

const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2 Mo
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif'])
const EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/gif': 'gif',
}

export async function POST(request: NextRequest) {
  const auth = await getAuthAdmin(request)
  if (!auth) return unauthorizedResponse()

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return Response.json({ error: 'Requête invalide (formulaire attendu).' }, { status: 400 })
  }

  const file = form.get('file')
  if (!(file instanceof File)) {
    return Response.json({ error: 'Aucun fichier reçu (champ « file »).' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return Response.json({ error: 'Format non supporté (PNG, JPG, WebP, SVG ou GIF).' }, { status: 400 })
  }
  if (file.size > MAX_SIZE_BYTES) {
    return Response.json({ error: 'Image trop lourde (2 Mo maximum).' }, { status: 400 })
  }

  const ext = EXTENSIONS[file.type] ?? 'png'
  const filename = `logo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadDir, { recursive: true })
  await writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()))

  const logoPath = `/uploads/${filename}`
  await db.setting.upsert({
    where: { key: SETTING_KEYS.siteLogo },
    update: { value: logoPath },
    create: { key: SETTING_KEYS.siteLogo, value: logoPath },
  })

  return Response.json({ path: logoPath }, { status: 201 })
}
