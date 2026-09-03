import { NextRequest } from 'next/server'
import { getAuthAdmin, unauthorizedResponse } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const admin = await getAuthAdmin(request)
  if (!admin) return unauthorizedResponse()

  return Response.json({
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      phone: admin.phone,
      active: admin.active,
      createdAt: admin.createdAt,
    },
  })
}
