import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { deleteSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') ?? ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
    if (token) {
      await deleteSession(token)
    }
    return Response.json({ success: true })
  } catch {
    return Response.json({ success: true })
  }
}
