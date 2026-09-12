'use client'

import React, { useState } from "react"
import type { OpsView } from "./ops/types"
import { Sidebar, MobileNav } from "./ops/layout"
import { DashboardScreen } from "./ops/Dashboard"
import { CalendarDayScreen, CalendarWeekScreen } from "./ops/Calendar"
import {
  AppointmentListScreen, AppointmentDetailScreen,
  RecordPaymentScreen, CompleteApptScreen, CancelApptScreen,
  NoShowScreen, RescheduleScreen, CreateApptScreen,
} from "./ops/Appointments"
import { CustomerListScreen, CustomerProfileScreen } from "./ops/Customers"
import { StaffListScreen, StaffProfileScreen } from "./ops/Staff"
import { ServiceListScreen } from "./ops/Services"
import {
  SettingsHubScreen, SettingsServicesScreen, AddServiceScreen, EditServiceScreen,
  AddStaffScreen, AvailabilityScreen, BookingSettingsScreen,
  PaymentSettingsScreen, CancellationPolicyScreen,
} from "./ops/Settings"
import {
  FinancialsHubScreen, PaymentListScreen, OutstandingPaymentsScreen,
  RefundListScreen, RefundDetailScreen, RevenueDetailScreen,
  ExpenseListScreen, AddExpenseScreen, EditExpenseScreen,
  FinancialReportsScreen,
} from "./ops/Financials"

export default function SalonOps() {
  const [view,             setView]             = useState<OpsView>("dashboard")
  const [apptRef,          setApptRef]          = useState<string>("")
  const [customerId,       setCustomerId]       = useState<string>("")
  const [staffId,          setStaffId]          = useState<string>("")
  const [settingsServiceId,setSettingsServiceId]= useState<string>("")
  const [refundId,         setRefundId]         = useState<string>("")
  const [expenseId,        setExpenseId]        = useState<string>("")
  const [history,          setHistory]          = useState<OpsView[]>([])

  function navTo(v: OpsView) {
    setHistory(h => [...h, view])
    setView(v)
  }

  function back() {
    const prev = history[history.length - 1]
    if (prev) {
      setView(prev)
      setHistory(h => h.slice(0, -1))
    } else {
      setView("dashboard")
    }
  }

  function goAppt(ref: string) {
    setApptRef(ref)
    navTo("appointmentDetail")
  }

  function goCustomer(id: string) {
    setCustomerId(id)
    navTo("customerProfile")
  }

  function goStaff(id: string) {
    setStaffId(id)
    navTo("staffProfile")
  }

  function renderScreen() {
    switch (view) {
      case "dashboard":
        return <DashboardScreen onNav={navTo} onAppt={goAppt} />

      case "calendarDay":
        return <CalendarDayScreen onNav={navTo} onAppt={goAppt} />

      case "calendarWeek":
        return <CalendarWeekScreen onNav={navTo} onAppt={goAppt} />

      case "appointmentList":
        return <AppointmentListScreen onNav={navTo} onAppt={goAppt} />

      case "appointmentDetail":
        return <AppointmentDetailScreen apptRef={apptRef} onBack={back} onNav={navTo} />

      case "recordPayment":
        return <RecordPaymentScreen onBack={back} onDone={() => setView("appointmentDetail")} />
        return <RecordPaymentScreen apptRef={apptRef} onBack={back} onDone={() => setView("appointmentDetail")} />

      case "completeAppt":
        return <CompleteApptScreen onBack={back} onDone={() => setView("appointmentList")} />
        return <CompleteApptScreen apptRef={apptRef} onBack={back} onDone={() => setView("appointmentList")} onRecordPayment={() => setView("recordPayment")} />

      case "cancelAppt":
        return <CancelApptScreen apptRef={apptRef} onBack={back} onDone={() => setView("appointmentList")} />

      case "noShow":
        return <NoShowScreen apptRef={apptRef} onBack={back} onDone={() => setView("appointmentList")} />

      case "reschedule":
        return <RescheduleScreen apptRef={apptRef} onBack={back} onDone={() => setView("appointmentDetail")} />

      case "createAppt":
        return <CreateApptScreen onBack={back} onDone={() => setView("appointmentList")} onNav={navTo} />

      case "customerList":
        return <CustomerListScreen onNav={navTo} onCustomer={goCustomer} />

      case "customerProfile":
        return <CustomerProfileScreen customerId={customerId} onBack={back} onAppt={goAppt} />

      case "staffList":
        return <StaffListScreen onNav={navTo} onStaff={goStaff} />

      case "staffProfile":
        return <StaffProfileScreen staffId={staffId} onBack={back} onNav={navTo} />

      case "serviceList":
        return <ServiceListScreen />

      case "settings":
        return <SettingsHubScreen onNav={navTo} />

      case "settingsServices":
        return <SettingsServicesScreen onBack={back} onNav={navTo} onEdit={id => { setSettingsServiceId(id); navTo("settingsEditService") }} />

      case "settingsAddService":
        return <AddServiceScreen onBack={back} onDone={() => setView("settingsServices")} />

      case "settingsEditService":
        return <EditServiceScreen serviceId={settingsServiceId} onBack={back} onDone={() => setView("settingsServices")} />

      case "settingsAddStaff":
        return <AddStaffScreen onBack={back} onDone={id => { setStaffId(id); setView("staffProfile") }} />

      case "settingsAvailability":
        return <AvailabilityScreen onBack={back} />

      case "settingsBooking":
        return <BookingSettingsScreen onBack={back} />

      case "settingsPayments":
        return <PaymentSettingsScreen onBack={back} />

      case "settingsCancellation":
        return <CancellationPolicyScreen onBack={back} />

      case "financials":
        return <FinancialsHubScreen onNav={navTo} onAppt={goAppt} />

      case "paymentList":
        return <PaymentListScreen onBack={back} onNav={navTo} />

      case "paymentDetail":
        return <div className="p-8 text-gray-400 text-center">Payment detail — select from payment list</div>

      case "outstandingPayments":
        return <OutstandingPaymentsScreen onBack={back} onAppt={goAppt} onRecord={ref => { setApptRef(ref); navTo("recordPayment") }} />

      case "refundList":
        return <RefundListScreen onBack={back} onRefund={id => { setRefundId(id); navTo("refundDetail") }} />

      case "refundDetail":
        return <RefundDetailScreen refundId={refundId} onBack={back} onAppt={goAppt} />

      case "revenueDetail":
        return <RevenueDetailScreen onBack={back} />

      case "expenseList":
        return <ExpenseListScreen onBack={back} onAdd={() => navTo("addExpense")} onEdit={id => { setExpenseId(id); navTo("editExpense") }} />

      case "addExpense":
        return <AddExpenseScreen onBack={back} onDone={() => setView("expenseList")} />

      case "editExpense":
        return <EditExpenseScreen expenseId={expenseId} onBack={back} onDone={() => setView("expenseList")} />

      case "financialReports":
        return <FinancialReportsScreen onBack={back} />

      case "loading":
        return (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
          </div>
        )

      case "error":
        return (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <p className="text-[17px] font-bold text-gray-900 mb-2">Something went wrong</p>
            <p className="text-[13px] text-gray-500 mb-5">Unable to load this section. Please try again.</p>
            <button onClick={() => setView("dashboard")}
              className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-[13px] font-semibold">
              Go to dashboard
            </button>
          </div>
        )

      default:
        return <DashboardScreen onNav={navTo} onAppt={goAppt} />
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar current={view} onNav={(v) => { setHistory([]); setView(v) }} />
      <main className="flex-1 min-w-0 pb-20 md:pb-0 overflow-x-hidden">
        {renderScreen()}
      </main>
      <MobileNav current={view} onNav={(v) => { setHistory([]); setView(v) }} />
    </div>
  )
}
