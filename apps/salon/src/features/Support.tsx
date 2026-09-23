'use client'

import React, { useState, useMemo } from 'react'
import { Card, SectionTitle, SearchBar, PrimaryBtn, SecondaryBtn, InlineFeedback } from './shared'

interface FaqArticle {
  id: string
  category: 'booking' | 'cancellation' | 'staff' | 'payments'
  categoryLabel: string
  question: string
  summary: string
  answer: React.ReactNode
}

const FAQ_ARTICLES: FaqArticle[] = [
  {
    id: 'advance-booking',
    category: 'booking',
    categoryLabel: 'Booking Rules',
    question: 'How far in advance can clients book appointments?',
    summary: 'Clients can book up to 60 days in advance by default.',
    answer: (
      <div className="space-y-2 text-[13px] text-gray-600 leading-relaxed">
        <p>
          By default, the customer booking system allows clients to book appointments up to <strong>60 days in advance</strong>.
          Dates beyond this 60-day window are automatically greyed out in the customer calendar.
        </p>
        <p>
          You can inspect or adjust your advance booking policies, operating days, and closed dates under <strong>Settings &gt; Booking Rules</strong>.
        </p>
      </div>
    ),
  },
  {
    id: 'slot-reservation-lock',
    category: 'booking',
    categoryLabel: 'Booking Rules',
    question: 'How does the 10-minute slot reservation lock work?',
    summary: 'Selected slots are temporarily held for 10 minutes to prevent double-booking.',
    answer: (
      <div className="space-y-2 text-[13px] text-gray-600 leading-relaxed">
        <p>
          When a customer selects an open time slot and reaches the checkout/payment step, BookYourBarber creates a <strong>10-minute temporary reservation lock</strong> on that chair.
        </p>
        <p>
          If the customer completes payment within 10 minutes, the appointment is confirmed. If they abandon checkout or the timer expires, the slot is automatically released back to the general availability pool.
        </p>
      </div>
    ),
  },
  {
    id: 'walkin-booking',
    category: 'booking',
    categoryLabel: 'Booking Rules',
    question: 'How do I record a walk-in appointment?',
    summary: 'Use the "+ New Appointment" button and set booking source to Walk-in.',
    answer: (
      <div className="space-y-2 text-[13px] text-gray-600 leading-relaxed">
        <p>
          To record a client who walks into the barbershop without a prior booking, click the <strong>+ New Appointment</strong> button on your header or dashboard.
        </p>
        <p>
          Select or add the customer, choose the requested service and barber chair, set the booking source as <em>Walk-in</em>, and record payment immediately (cash or card) upon completion.
        </p>
      </div>
    ),
  },
  {
    id: 'cancellation-fees',
    category: 'cancellation',
    categoryLabel: 'Cancellations & Refunds',
    question: 'How are customer cancellation fees calculated?',
    summary: 'Platform tier: 10% fee if > 24 hours prior; 18% fee if <= 24 hours prior.',
    answer: (
      <div className="space-y-2 text-[13px] text-gray-600 leading-relaxed">
        <p>
          Cancellation fees are strictly governed by the BookYourBarber platform rules to protect both salons and customers:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li><strong>More than 24 hours notice:</strong> 10% cancellation fee, 90% eligible refund.</li>
          <li><strong>24 hours or less notice:</strong> 18% cancellation fee, 82% eligible refund.</li>
          <li><strong>Cancelled by the Salon:</strong> 0% cancellation fee, 100% full refund to customer.</li>
        </ul>
        <p className="text-[12px] text-gray-500 mt-1">
          Platform cancellation fees are retained by BookYourBarber platform infrastructure and are not counted towards salon service earnings.
        </p>
      </div>
    ),
  },
  {
    id: 'refund-timeline',
    category: 'cancellation',
    categoryLabel: 'Cancellations & Refunds',
    question: 'How long does an electronic refund take to reach a customer?',
    summary: 'Refunds typically settle within 3 to 5 business days depending on the customer bank.',
    answer: (
      <div className="space-y-2 text-[13px] text-gray-600 leading-relaxed">
        <p>
          When an eligible refund is processed through the system, an instruction is submitted to the card acquiring gateway.
        </p>
        <p>
          The refund settlement typically reflects on the customer bank statement within <strong>3 to 5 business days</strong>. This timeline is an industry banking expectation and depends on the customer issuing bank.
        </p>
      </div>
    ),
  },
  {
    id: 'staff-any-available',
    category: 'staff',
    categoryLabel: 'Staff & Roster',
    question: 'How does the "Any Available" barber option work?',
    summary: 'Routes the booking to the first available barber who offers that service.',
    answer: (
      <div className="space-y-2 text-[13px] text-gray-600 leading-relaxed">
        <p>
          Clients can choose a specific barber or select <strong>Any Available</strong>. When "Any Available" is selected, the availability engine aggregates open slots across all active barbers qualified to perform that service.
        </p>
        <p>
          This maximizes chair utilization and allows customers to secure earlier time slots when their preferred barber is fully booked.
        </p>
      </div>
    ),
  },
  {
    id: 'staff-schedule-toggle',
    category: 'staff',
    categoryLabel: 'Staff & Roster',
    question: 'How do I take a barber off the roster or mark them on leave?',
    summary: 'Manage staff active status and working schedules under Staff management.',
    answer: (
      <div className="space-y-2 text-[13px] text-gray-600 leading-relaxed">
        <p>
          Navigate to <strong>Staff</strong> in your top header (or via <strong>More</strong> on mobile). Select the staff member's card and toggle their active status to off, or modify their daily working hours.
        </p>
        <p>
          Once deactivated, the barber will no longer appear in the customer booking flow, and no new appointments can be scheduled for their chair.
        </p>
      </div>
    ),
  },
  {
    id: 'cash-vs-card',
    category: 'payments',
    categoryLabel: 'Payments & Cash',
    question: 'How do I reconcile cash collected at the barbershop chair?',
    summary: 'Record cash transactions using "Record Payment" to update the financial ledger.',
    answer: (
      <div className="space-y-2 text-[13px] text-gray-600 leading-relaxed">
        <p>
          When a client pays cash at the shop, open their appointment card and click <strong>Record Payment</strong>. Select <em>Cash</em>, verify the exact ZAR amount received, and tap confirm.
        </p>
        <p>
          The appointment's payment status immediately updates to <em>Paid</em>, and the cash entry is logged in <strong>Financials &gt; Cash Reconciliation</strong> for end-of-day register balancing.
        </p>
      </div>
    ),
  },
  {
    id: 'outstanding-balances',
    category: 'payments',
    categoryLabel: 'Payments & Cash',
    question: 'Why can’t I mark an appointment as Completed if an outstanding balance exists?',
    summary: 'Appointments with unpaid balances are blocked from completion to prevent revenue leakage.',
    answer: (
      <div className="space-y-2 text-[13px] text-gray-600 leading-relaxed">
        <p>
          BookYourBarber enforces a strict financial integrity rule: an appointment cannot be marked as <strong>Completed</strong> while it has an outstanding balance greater than R0.
        </p>
        <p>
          To complete the appointment, first record the remaining balance payment (cash or card). Once the balance is fully settled, the completion button will become active.
        </p>
      </div>
    ),
  },
]

type CategoryFilter = 'all' | 'booking' | 'cancellation' | 'staff' | 'payments'

export function SupportScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all')
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null)

  // Contact form state
  const [contactSubject, setContactSubject] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitFeedback, setSubmitFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Filtered FAQ list
  const filteredArticles = useMemo(() => {
    return FAQ_ARTICLES.filter(article => {
      const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory
      if (!matchesCategory) return false

      if (!searchQuery.trim()) return true

      const query = searchQuery.toLowerCase().trim()
      return (
        article.question.toLowerCase().includes(query) ||
        article.summary.toLowerCase().includes(query) ||
        article.categoryLabel.toLowerCase().includes(query)
      )
    })
  }, [searchQuery, selectedCategory])

  const toggleArticle = (id: string) => {
    setExpandedArticleId(prev => (prev === id ? null : id))
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactSubject.trim() || !contactMessage.trim()) {
      setSubmitFeedback({ type: 'error', message: 'Please provide both a subject and a message.' })
      return
    }

    setIsSubmitting(true)
    setSubmitFeedback(null)

    // Simulate reliable dispatch
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitFeedback({
        type: 'success',
        message: 'Your support inquiry has been submitted. Our team will contact you via phone or email shortly.',
      })
      setContactSubject('')
      setContactMessage('')
      setContactPhone('')
    }, 600)
  }

  const categories: { key: CategoryFilter; label: string }[] = [
    { key: 'all', label: 'All Topics' },
    { key: 'booking', label: 'Booking Rules' },
    { key: 'cancellation', label: 'Cancellations & Refunds' },
    { key: 'staff', label: 'Staff & Roster' },
    { key: 'payments', label: 'Payments & Cash' },
  ]

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* 1. Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-gray-900" />
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Help Desk</p>
        </div>
        <h1 className="text-[20px] sm:text-[22px] font-bold text-gray-900 tracking-tight">
          Support & Documentation
        </h1>
        <p className="text-[13px] text-gray-500 mt-1 max-w-2xl">
          Search real operational guides for your salon or contact human support for immediate assistance with bookings, payments, or staff setup.
        </p>
      </div>

      {/* 2. Search & Category Filters */}
      <div className="space-y-3">
        <SearchBar
          placeholder="Search topics (e.g. cancellation fees, cash payment, slot hold, walk-in)..."
          value={searchQuery}
          onChange={setSearchQuery}
        />

        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 rounded-sm text-[12px] font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.key
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Knowledge Base Accordion Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionTitle>Frequently Asked Questions</SectionTitle>
          <span className="text-[12px] text-gray-400 font-medium">
            {filteredArticles.length} article{filteredArticles.length === 1 ? '' : 's'}
          </span>
        </div>

        {filteredArticles.length === 0 ? (
          <Card>
            <div className="p-8 text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <p className="text-[14px] font-semibold text-gray-800">No articles matched your search</p>
              <p className="text-[12px] text-gray-500 max-w-sm mx-auto">
                Try searching with different keywords, or use the direct contact form below to get in touch with our team.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                }}
                className="mt-2 text-[12px] font-bold text-gray-900 underline underline-offset-2"
              >
                Reset filters
              </button>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredArticles.map(article => {
              const isExpanded = expandedArticleId === article.id
              return (
                <div
                  key={article.id}
                  className="bg-white border border-gray-200 rounded-sm overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => toggleArticle(article.id)}
                    className="w-full flex items-start justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                    aria-expanded={isExpanded}
                  >
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          {article.categoryLabel}
                        </span>
                      </div>
                      <h3 className="text-[14px] font-semibold text-gray-900">
                        {article.question}
                      </h3>
                      {!isExpanded && (
                        <p className="text-[12px] text-gray-500 mt-0.5 line-clamp-1">
                          {article.summary}
                        </p>
                      )}
                    </div>
                    <div className="pt-1 text-gray-400">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`transition-transform duration-150 ${isExpanded ? 'rotate-180 text-gray-900' : ''}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-gray-100 bg-gray-50/50">
                      {article.answer}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 4. Human Contact & Escalation Channel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        {/* Left Column: Direct Call & Emergency */}
        <div className="space-y-3">
          <SectionTitle>Need Urgent Assistance?</SectionTitle>
          <div className="p-4 bg-white border border-gray-200 rounded-sm space-y-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Direct Telephone Desk</p>
              <a
                href="tel:0115550192"
                className="text-[15px] font-bold text-gray-900 hover:underline block mt-0.5"
              >
                011 555 0192
              </a>
              <p className="text-[11px] text-gray-500 mt-0.5">Mon–Sat: 08:00 – 18:00</p>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Support Email</p>
              <a
                href="mailto:support@bookyourbarber.co.za"
                className="text-[13px] font-semibold text-gray-900 hover:underline block mt-0.5"
              >
                support@bookyourbarber.co.za
              </a>
              <p className="text-[11px] text-gray-500 mt-0.5">Response within 2 hours</p>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Salon Address</p>
              <p className="text-[12px] text-gray-700 mt-0.5">
                15 Loader Street, De Waterkant, Cape Town, 8001
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: In-App Support Ticket Form */}
        <div className="md:col-span-2 space-y-3">
          <SectionTitle>Send a Message to Support</SectionTitle>
          <div className="p-4 sm:p-5 bg-white border border-gray-200 rounded-sm">
            {submitFeedback && (
              <div className="mb-4">
                <InlineFeedback type={submitFeedback.type} message={submitFeedback.message} />
              </div>
            )}

            <form onSubmit={handleContactSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Subject / Topic *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Question about appointment refund reference BF-8921"
                  value={contactSubject}
                  onChange={e => setContactSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm text-[13px] text-gray-900 focus:border-gray-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Callback Phone (optional)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 082 123 4567"
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm text-[13px] text-gray-900 focus:border-gray-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Message Description *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe what you are encountering, including any relevant booking reference or client details..."
                  value={contactMessage}
                  onChange={e => setContactMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm text-[13px] text-gray-900 focus:border-gray-900 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <PrimaryBtn
                  label={isSubmitting ? 'Sending...' : 'Submit Support Request'}
                  onClick={() => {}}
                  disabled={isSubmitting}
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SupportScreen
