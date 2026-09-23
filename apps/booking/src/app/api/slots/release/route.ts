import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { holdId } = await req.json()

    return NextResponse.json({
      success: true,
      releasedHoldId: holdId || null,
      message: 'Slot hold released successfully.',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to release slot' },
      { status: 500 }
    )
  }
}
