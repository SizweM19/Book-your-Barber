'use client'

import React, { useState } from 'react'
import React, { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import {
  FinancialsHubScreen,
  PaymentListScreen,
  OutstandingPaymentsScreen,
  RefundListScreen,
  RefundDetailScreen,
  RevenueDetailScreen,
  ExpenseListScreen,
  AddExpenseScreen,
  EditExpenseScreen,
  FinancialReportsScreen,
} from '@/ops/Financials'
import { RecordPaymentScreen } from '@/ops/Appointments'

export default function FinancialsPage() {
function FinancialsContent() {
  const router = useRouter()
  const [activeSubScreen, setActiveSubScreen] = useState<string>('hub')
  const [selectedRefundId, setSelectedRefundId] = useState<string>('')
  const [selectedExpenseId, setSelectedExpenseId] = useState<string>('')
  const [selectedApptRef, setSelectedApptRef] = useState<string | null>(null)
  const [history, setHistory] = useState<string[]>([])

  function navTo(screen: string) {
    setHistory(h => [...h, activeSubScreen])
    setActiveSubScreen(screen)
  }

  function back() {
    const prev = history[history.length - 1]
    if (prev) {
      setActiveSubScreen(prev)
      setHistory(h => h.slice(0, -1))
    } else {
      setActiveSubScreen('hub')
    }
  }

  function handleAppt(ref: string) {
    router.push(`/app/appointments?ref=${ref}`)
  }

  switch (activeSubScreen) {
    case 'paymentList':
      return <PaymentListScreen onBack={back} onNav={navTo as any} />
    case 'outstandingPayments':
      return <OutstandingPaymentsScreen onBack={back} onAppt={handleAppt} onRecord={() => navTo('recordPayment')} />
      return (
        <OutstandingPaymentsScreen
          onBack={back}
          onAppt={handleAppt}
          onRecord={(ref) => {
            setSelectedApptRef(ref)
            navTo('recordPayment')
          }}
        />
      )
    case 'recordPayment':
      return <RecordPaymentScreen onBack={back} onDone={back} />
      return <RecordPaymentScreen apptRef={selectedApptRef || undefined} onBack={back} onDone={back} />
    case 'refundList':
      return <RefundListScreen onBack={back} onRefund={id => { setSelectedRefundId(id); navTo('refundDetail') }} />
    case 'refundDetail':
      return <RefundDetailScreen refundId={selectedRefundId} onBack={back} onAppt={handleAppt} />
    case 'revenueDetail':
      return <RevenueDetailScreen onBack={back} />
    case 'expenseList':
      return <ExpenseListScreen onBack={back} onAdd={() => navTo('addExpense')} onEdit={id => { setSelectedExpenseId(id); navTo('editExpense') }} />
    case 'addExpense':
      return <AddExpenseScreen onBack={back} onDone={back} />
    case 'editExpense':
      return <EditExpenseScreen expenseId={selectedExpenseId} onBack={back} onDone={back} />
    case 'financialReports':
      return <FinancialReportsScreen onBack={back} />
    default:
      return <FinancialsHubScreen onNav={navTo as any} onAppt={handleAppt} />
  }
}

export default function FinancialsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading financials...</div>}>
      <FinancialsContent />
    </Suspense>
  )
}