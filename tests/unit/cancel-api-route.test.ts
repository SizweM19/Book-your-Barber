import { describe, it, expect, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/appointments/cancel/route'
import { getRepositories } from '@/infrastructure/repositories/container'

describe('Appointment Cancellation API Route (/api/appointments/cancel)', () => {
  const repos = getRepositories('mock')

  beforeEach(async () => {
    // Reset or ensure mock repository has test fixtures
  })

  it('cancels a customer appointment with correct 10% fee calculation (>24h)', async () => {
    const appt = await repos.appointments.create({
      tenantId: 'tenant-1',
      bookingReference: 'BYB-API-TEST-200',
      customerId: 'c1',
      serviceId: 's5',
      appointmentDate: '2026-11-20',
      startTime: '10:00',
      durationMinutes: 60,
      status: 'confirmed',
      paymentStatus: 'paid',
      totalCharged: 200,
      totalPaid: 200,
      bookingSource: 'online',
    })

    const request = new NextRequest('http://localhost:3000/api/appointments/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointmentId: appt.id,
        cancelledBy: 'customer',
      }),
    })

    const res = await POST(request)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.bookingReference).toBe('BYB-API-TEST-200')
    expect(data.feePercent).toBe(10)
    expect(data.feeAmount).toBe(20)
    expect(data.refundAmount).toBe(180)
    expect(data.cancelledBy).toBe('customer')
    expect(data.refundStatus).toBe('requested')

    // Verify appointment status in repository
    const updated = await repos.appointments.findById(appt.id)
    expect(updated?.status).toBe('cancelled')
  })

  it('rejects cancellation for already cancelled appointment', async () => {
    const appt = await repos.appointments.create({
      tenantId: 'tenant-1',
      bookingReference: 'BYB-API-CANCELLED',
      customerId: 'c1',
      serviceId: 's5',
      appointmentDate: '2026-11-20',
      startTime: '10:00',
      durationMinutes: 60,
      status: 'cancelled',
      paymentStatus: 'refundProcessing',
      totalCharged: 200,
      totalPaid: 200,
      bookingSource: 'online',
    })

    const request = new NextRequest('http://localhost:3000/api/appointments/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointmentId: appt.id,
        cancelledBy: 'customer',
      }),
    })

    const res = await POST(request)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('already cancelled')
  })

  it('returns 404 for nonexistent appointment', async () => {
    const request = new NextRequest('http://localhost:3000/api/appointments/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointmentId: 'nonexistent-uuid',
        cancelledBy: 'customer',
      }),
    })

    const res = await POST(request)
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.error).toContain('not found')
  })
})
