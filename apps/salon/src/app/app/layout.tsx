'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/application/auth'
import { TenantProvider } from '@/application/tenant'

const APP_NAV_ITEMS = [
  { href: '/app', label: 'Dashboard', emoji: '📊', group: 'main' },
  { href: '/app/calendar', label: 'Calendar', emoji: '📅', group: 'main' },
  { href: '/app/appointments', label: 'Appointments', emoji: '📋', group: 'main' },
  { href: '/app/customers', label: 'Customers', emoji: '👤', group: 'main' },
  { href: '/app/services', label: 'Services', emoji: '✂️', group: 'ops' },
  { href: '/app/staff', label: 'Staff', emoji: '👥', group: 'ops' },
  { href: '/app/settings', label: 'Settings', emoji: '⚙️', group: 'settings' },
  { href: '/app/financials', label: 'Financials', emoji: '💰', group: 'finance' },
]

export default function SalonAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, tenantContext, currentRole, logout } = useAuth()

  const isActive = (href: string) => {
    if (href === '/app') return pathname === '/app'
    return pathname.startsWith(href)
  }

  async function handleLogout() {
    await logout()
    router.push('/auth/login')
  }

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
                    <span className="text-sm">{item.emoji}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Catalog & Team Management */}
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
                    <span className="text-sm">{item.emoji}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Financials & Salon Governance */}
            <div>
              <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Salon Admin
              </p>
              <nav className="space-y-1">
                {APP_NAV_ITEMS.filter(item => item.group === 'finance' || item.group === 'settings').map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-gray-900 text-white font-bold'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-sm">{item.emoji}</span>
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
                🚪
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Pane */}
        <main className="flex-1 min-w-0 pb-20 md:pb-0 overflow-x-hidden">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex items-center justify-around px-2 py-1.5 safe-area-bottom">
          {[
            { href: '/app', label: 'Today', emoji: '📊' },
            { href: '/app/calendar', label: 'Calendar', emoji: '📅' },
            { href: '/app/appointments', label: 'Bookings', emoji: '📋' },
            { href: '/app/customers', label: 'Clients', emoji: '👤' },
            { href: '/app/financials', label: 'Finance', emoji: '💰' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1 px-2 rounded-xl transition-colors ${
                isActive(item.href) ? 'text-gray-900 font-bold' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="text-lg leading-none">{item.emoji}</span>
              <span className="text-[10px] mt-1">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </TenantProvider>
  )
}
