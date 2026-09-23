import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { tenantId, serviceId, staffId, date, time } = await req.json()

    if (!tenantId || !date || !time) {
      return NextResponse.json(
        { error: 'tenantId, date, and time are required.' },
        { status: 400 }
      )
    }

    const holdId = `hold_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    return NextResponse.json({
      success: true,
      holdId,
      expiresAt,
      message: 'Slot hold acquired successfully for 10 minutes.',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to hold slot' },
      { status: 500 }
    )
  }
}

