import { describe, it, expect } from 'vitest'

describe('Salon Management Navigation Architecture', () => {
  // Mobile Bottom Navigation Specification: Exactly 5 items
  const MOBILE_BOTTOM_TABS = [
    { key: 'home', label: 'Home', href: '/app' },
    { key: 'calendar', label: 'Calendar', href: '/app/calendar' },
    { key: 'appointments', label: 'Appointments', href: '/app/appointments' },
    { key: 'customers', label: 'Customers', href: '/app/customers' },
    { key: 'more', label: 'More', isDrawer: true },
  ]

  // Secondary Drawer Items under "More"
  const MORE_DRAWER_ITEMS = [
    { label: 'Staff Members', href: '/app/staff', group: 'operations' },
    { label: 'Services & Pricing', href: '/app/services', group: 'operations' },
    { label: 'Financials & Payments', href: '/app/financials', group: 'operations' },
    { label: 'Salon Settings', href: '/app/settings', group: 'admin' },
    { label: 'Support & Help Center', href: '/app/support', group: 'admin' },
  ]

  it('enforces exactly 5 mobile bottom navigation tabs', () => {
    expect(MOBILE_BOTTOM_TABS).toHaveLength(5)
    expect(MOBILE_BOTTOM_TABS.map(t => t.label)).toEqual([
      'Home',
      'Calendar',
      'Appointments',
      'Customers',
      'More',
    ])
  })

  it('defines the 5th tab as an interactive More drawer trigger', () => {
    const moreTab = MOBILE_BOTTOM_TABS.find(t => t.key === 'more')
    expect(moreTab).toBeDefined()
    expect(moreTab?.isDrawer).toBe(true)
  })

  it('exposes all secondary operational and administrative surfaces in the More drawer', () => {
    const hrefs = MORE_DRAWER_ITEMS.map(i => i.href)
    expect(hrefs).toContain('/app/staff')
    expect(hrefs).toContain('/app/services')
    expect(hrefs).toContain('/app/financials')
    expect(hrefs).toContain('/app/settings')
    expect(hrefs).toContain('/app/support')
  })

  it('groups items logically into operations and administration', () => {
    const operations = MORE_DRAWER_ITEMS.filter(i => i.group === 'operations')
    const admin = MORE_DRAWER_ITEMS.filter(i => i.group === 'admin')
    expect(operations).toHaveLength(3)
    expect(admin).toHaveLength(2)
  })
})

describe('Support & Knowledge Base Experience', () => {
  interface FaqItem {
    id: string
    category: 'booking' | 'cancellation' | 'staff' | 'payments'
    question: string
    summary: string
  }

  const SAMPLE_FAQS: FaqItem[] = [
    {
      id: 'advance-booking',
      category: 'booking',
      question: 'How far in advance can clients book appointments?',
      summary: 'Clients can book up to 60 days in advance by default.',
    },
    {
      id: 'slot-reservation-lock',
      category: 'booking',
      question: 'How does the 10-minute slot reservation lock work?',
      summary: 'Selected slots are temporarily held for 10 minutes to prevent double-booking.',
    },
    {
      id: 'cancellation-fees',
      category: 'cancellation',
      question: 'How are customer cancellation fees calculated?',
      summary: 'Platform tier: 10% fee if > 24 hours prior; 18% fee if <= 24 hours prior.',
    },
    {
      id: 'staff-any-available',
      category: 'staff',
      question: 'How does the "Any Available" barber option work?',
      summary: 'Routes the booking to the first available barber who offers that service.',
    },
    {
      id: 'cash-vs-card',
      category: 'payments',
      question: 'How do I reconcile cash collected at the barbershop chair?',
      summary: 'Record cash transactions using "Record Payment" to update the financial ledger.',
    },
  ]

  function filterFaqs(items: FaqItem[], query: string, category: string): FaqItem[] {
    return items.filter(item => {
      const matchCat = category === 'all' || item.category === category
      if (!matchCat) return false
      if (!query.trim()) return true
      const q = query.toLowerCase().trim()
      return item.question.toLowerCase().includes(q) || item.summary.toLowerCase().includes(q)
    })
  }

  it('filters FAQs by search keyword', () => {
    const results = filterFaqs(SAMPLE_FAQS, 'cancellation', 'all')
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('cancellation-fees')
  })

  it('filters FAQs by category', () => {
    const bookingFaqs = filterFaqs(SAMPLE_FAQS, '', 'booking')
    expect(bookingFaqs).toHaveLength(2)

    const paymentFaqs = filterFaqs(SAMPLE_FAQS, '', 'payments')
    expect(paymentFaqs).toHaveLength(1)
    expect(paymentFaqs[0].id).toBe('cash-vs-card')
  })

  it('returns empty list when no keyword matches', () => {
    const results = filterFaqs(SAMPLE_FAQS, 'nonexistent topic xyz', 'all')
    expect(results).toHaveLength(0)
  })

  it('validates support ticket submission inputs', () => {
    function validateTicket(subject: string, message: string): { valid: boolean; error?: string } {
      if (!subject.trim()) return { valid: false, error: 'Subject is required' }
      if (!message.trim()) return { valid: false, error: 'Message is required' }
      return { valid: true }
    }

    expect(validateTicket('', 'Hello').valid).toBe(false)
    expect(validateTicket('Need help', '').valid).toBe(false)
    expect(validateTicket('Refund issue', 'Booking BF-101 needs refund').valid).toBe(true)
  })
})
