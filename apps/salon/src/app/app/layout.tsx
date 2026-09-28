'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@byb/auth'
import { TenantProvider } from '@/application/tenant'

interface NavItem {
  href: string
  label: string
  group: 'main' | 'ops' | 'admin'
  icon: React.ReactNode
}

function NavIcon({ type, className = "w-4 h-4" }: { type: string; className?: string }) {
  switch (type) {
    case 'dashboard':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      )
    case 'calendar':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      )
    case 'appointments':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          <path d="M9 12h6M9 16h6" />
        </svg>
      )
    case 'customers':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    case 'services':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <line x1="20" y1="4" x2="8.12" y2="15.88" />
          <line x1="14.47" y1="14.48" x2="20" y2="20" />
          <line x1="8.12" y1="8.12" x2="12" y2="12" />
        </svg>
      )
    case 'staff':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    case 'financials':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      )
    case 'settings':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      )
    case 'support':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      )
    case 'logout':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      )
    case 'more':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" />
        </svg>
      )
    default:
      return null
  }
}

const APP_NAV_ITEMS: NavItem[] = [
  { href: '/app', label: 'Dashboard', group: 'main', icon: <NavIcon type="dashboard" /> },
  { href: '/app/calendar', label: 'Calendar', group: 'main', icon: <NavIcon type="calendar" /> },
  { href: '/app/appointments', label: 'Appointments', group: 'main', icon: <NavIcon type="appointments" /> },
  { href: '/app/customers', label: 'Customers', group: 'main', icon: <NavIcon type="customers" /> },
  { href: '/app/services', label: 'Services', group: 'ops', icon: <NavIcon type="services" /> },
  { href: '/app/staff', label: 'Staff', group: 'ops', icon: <NavIcon type="staff" /> },
  { href: '/app/financials', label: 'Financials', group: 'admin', icon: <NavIcon type="financials" /> },
  { href: '/app/settings', label: 'Settings', group: 'admin', icon: <NavIcon type="settings" /> },
  { href: '/app/support', label: 'Support', group: 'admin', icon: <NavIcon type="support" /> },
]

export default function SalonAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, tenantContext, currentRole, logout } = useAuth()
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  const isActive = (href: string) => {
    if (href === '/app') return pathname === '/app'
    return pathname.startsWith(href)
  }

  async function handleLogout() {
    await logout()
    router.push('/auth/login')
  }

  const moreItems = [
    { href: '/app/services', label: 'Services', icon: <NavIcon type="services" /> },
    { href: '/app/staff', label: 'Staff', icon: <NavIcon type="staff" /> },
    { href: '/app/financials', label: 'Financials', icon: <NavIcon type="financials" /> },
    { href: '/app/settings', label: 'Settings', icon: <NavIcon type="settings" /> },
    { href: '/app/support', label: 'Support', icon: <NavIcon type="support" /> },
  ]

  const isMoreActive = moreItems.some(i => isActive(i.href))

  return (
    <TenantProvider>
      <div className="flex min-h-screen bg-gray-50">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-[230px] min-h-screen bg-white border-r border-gray-100 flex-shrink-0">
          {/* Salon Branding & Tenant Header */}
          <div className="px-5 py-5 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white text-[13px] font-black">B</span>
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-gray-900 leading-tight truncate">
                  {tenantContext?.tenant.name || 'Fade & Edge'}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="px-1.5 py-0.2 bg-gray-100 text-gray-600 text-[9px] font-bold rounded">
                    {currentRole || 'OWNER'}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">Cape Town</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
            {/* Main Operational Group */}
            {/* Main Operations */}
            <div>
              <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Operations
              </p>
              <nav className="space-y-1">
                {APP_NAV_ITEMS.filter(item => item.group === 'main').map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-gray-900 text-white font-bold'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-gray-400 group-hover:text-gray-600">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Catalog & Team Management */}
            {/* Catalog & Team */}
            <div>
              <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Catalog & Team
              </p>
              <nav className="space-y-1">
                {APP_NAV_ITEMS.filter(item => item.group === 'ops').map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-gray-900 text-white font-bold'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-gray-400 group-hover:text-gray-600">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Financials & Salon Governance */}
            {/* Administration & Governance */}
            <div>
              <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Salon Admin
              </p>
              <nav className="space-y-1">
                {APP_NAV_ITEMS.filter(item => item.group === 'admin').map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-gray-900 text-white font-bold'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-gray-400 group-hover:text-gray-600">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* User Profile & Sign Out Bar */}
          <div className="p-3 border-t border-gray-100">
            <div className="flex items-center justify-between px-2 py-2 rounded-xl hover:bg-gray-50">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-[11px] font-bold">
                  {user?.profile?.fullName?.charAt(0) || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-gray-900 truncate">
                    {user?.profile?.fullName || 'User'}
                  </p>
                  <p className="text-[9px] text-gray-400 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-600 text-xs p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                title="Sign out"
              >
                <NavIcon type="logout" className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Pane */}
        <main className="flex-1 min-w-0 pb-28 md:pb-0 overflow-x-hidden">
          {children}
        </main>
        {/* Mobile Slide-Up "More" Sheet Overlay */}
        {showMoreMenu && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex flex-col justify-end" onClick={() => setShowMoreMenu(false)}>
            <div className="bg-white rounded-t-2xl p-5 border-t border-gray-100 shadow-xl space-y-3" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Salon Operations & Settings</p>
                <button
                  onClick={() => setShowMoreMenu(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {moreItems.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMoreMenu(false)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-[13px] font-semibold transition-colors ${
                      isActive(item.href)
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 text-gray-700 hover:border-gray-400 bg-white'
                    }`}
                  >
                    <span className={isActive(item.href) ? 'text-white' : 'text-gray-500'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>

              <div className="pt-2 border-t border-gray-100">
                <button
                  onClick={async () => {
                    setShowMoreMenu(false)
                    await handleLogout()
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  <NavIcon type="logout" className="w-4 h-4 text-red-600" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Bottom Navigation (5 Canonical Tabs) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex items-center justify-around px-2 py-2 safe-area-bottom shadow-lg">
          <Link
            href="/app"
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors ${
              pathname === '/app' ? 'text-gray-900 font-bold' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <NavIcon type="dashboard" className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-medium">Home</span>
          </Link>

          <Link
            href="/app/calendar"
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors ${
              isActive('/app/calendar') ? 'text-gray-900 font-bold' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <NavIcon type="calendar" className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-medium">Calendar</span>
          </Link>

          <Link
            href="/app/appointments"
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors ${
              isActive('/app/appointments') ? 'text-gray-900 font-bold' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <NavIcon type="appointments" className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-medium">Bookings</span>
          </Link>

          <Link
            href="/app/customers"
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors ${
              isActive('/app/customers') ? 'text-gray-900 font-bold' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <NavIcon type="customers" className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-medium">Clients</span>
          </Link>

          <button
            onClick={() => setShowMoreMenu(prev => !prev)}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors ${
              isMoreActive || showMoreMenu ? 'text-gray-900 font-bold' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <NavIcon type="more" className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-medium">More</span>
          </button>
        </nav>
      </div>
    </TenantProvider>
  )
}
