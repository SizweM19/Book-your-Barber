import { NextRequest, NextResponse } from 'next/server'
import {
  getDefaultRepositoryMode,
  getRepositories,
  createSupabaseContainer,
} from '@/infrastructure/repositories/container'
import { createAdminClient } from '@/infrastructure/supabase/admin'
import { NotificationService } from '@/application/services/NotificationService'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { notificationId } = body

    if (!notificationId) {
      return NextResponse.json(
        { error: 'notificationId is required.' },
        { status: 400 }
      )
    }

    const mode = getDefaultRepositoryMode()
    const container =
      mode === 'supabase'
        ? createSupabaseContainer(createAdminClient())
        : getRepositories('mock')

    const service = new NotificationService(container)
    const updated = await service.retryNotification(notificationId)

    return NextResponse.json({
      success: updated.status === 'sent',
      notification: updated,
    })
  } catch (error: any) {
    console.error('Notification retry endpoint error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error during notification retry.' },
      { status: 500 }
    )
  }
}
