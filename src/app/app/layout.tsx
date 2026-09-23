'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/application/auth'
import { TenantProvider } from '@/application/tenant'

interface NavLinkItem {
  href: string
  label: string
  icon: React.ReactNode
}

const DESKTOP_NAV_LINKS: NavLinkItem[] = [
  {
    href: '/app',
    label: 'Home',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    ),
  },
  {
    href: '/app/calendar',
    label: 'Calendar',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    href: '/app/appointments',
    label: 'Appointments',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    href: '/app/customers',
    label: 'Customers',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: '/app/staff',
    label: 'Staff',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    href: '/app/services',
    label: 'Services',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <line x1="20" y1="4" x2="8.12" y2="15.88" />
        <line x1="14.47" y1="14.48" x2="20" y2="20" />
        <line x1="8.12" y1="8.12" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    href: '/app/financials',
    label: 'Financials',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    href: '/app/settings',
    label: 'Settings',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
]

export default function SalonAppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, tenantContext, currentRole, logout } = useAuth()

  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileDropdownRef = useRef<HTMLDivElement>(null)

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isProfileOpen])

  // Close More drawer on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMoreOpen(false)
        setIsProfileOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close More drawer on route change
  useEffect(() => {
    setIsMoreOpen(false)
    setIsProfileOpen(false)
  }, [pathname])

  const isActive = (href: string) => {
    if (href === '/app') return pathname === '/app'
    return pathname.startsWith(href)
  }

  const isMoreActive = () => {
    return (
      pathname.startsWith('/app/staff') ||
      pathname.startsWith('/app/services') ||
      pathname.startsWith('/app/financials') ||
      pathname.startsWith('/app/settings') ||
      pathname.startsWith('/app/support')
    )
  }

  async function handleLogout() {
    setIsProfileOpen(false)
    setIsMoreOpen(false)
    await logout()
    router.push('/auth/login')
  }

  const salonName = tenantContext?.tenant.name || 'Fade & Edge Barbershop'
  const userInitials = user?.profile?.fullName
    ? user.profile.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  return (
    <TenantProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* ─── DESKTOP TOP HEADER (Width >= 768px) ─── */}
        <header className="hidden md:flex items-center justify-between h-16 px-4 lg:px-6 bg-white border-b border-gray-200 sticky top-0 z-30 flex-shrink-0">
          {/* Left: Salon Identity */}
          <div className="flex items-center gap-3 min-w-[200px] flex-shrink-0">
            <div className="w-8 h-8 bg-gray-900 rounded-sm flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[13px] font-bold tracking-wider">B</span>
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-gray-900 leading-tight truncate">
                {salonName}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 text-gray-700 text-[10px] font-semibold rounded-sm uppercase tracking-wider">
                  {currentRole || 'OWNER'}
                </span>
                <span className="text-[11px] text-gray-400">Cape Town</span>
              </div>
            </div>
          </div>

          {/* Center: Primary Navigation Links */}
          <nav className="flex items-center gap-1 overflow-x-auto px-2">
            {DESKTOP_NAV_LINKS.map(item => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[12px] transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-gray-900 text-white font-semibold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-medium'
                  }`}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Right: Quick Action, Support Link & Account Dropdown */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <Link
              href="/app/appointments?action=create"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-sm text-[12px] font-semibold hover:bg-gray-800 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>New Appointment</span>
            </Link>

            <Link
              href="/app/support"
              className={`p-2 rounded-sm transition-colors ${
                isActive('/app/support')
                  ? 'bg-gray-100 text-gray-900 border border-gray-200'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title="Help & Support"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </Link>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setIsProfileOpen(prev => !prev)}
                className="flex items-center gap-1.5 p-1 rounded-sm hover:bg-gray-100 transition-colors"
                aria-expanded={isProfileOpen}
                aria-haspopup="true"
              >
                <div className="w-7 h-7 bg-gray-100 border border-gray-300 rounded-sm flex items-center justify-center text-gray-800 text-[11px] font-bold">
                  {userInitials}
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-1.5 w-56 bg-white border border-gray-200 rounded-sm py-1.5 z-50">
                  <div className="px-3.5 py-2 border-b border-gray-100">
                    <p className="text-[12px] font-bold text-gray-900 truncate">
                      {user?.profile?.fullName || 'Salon Operator'}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate mt-0.5">
                      {user?.email}
                    </p>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/app/settings"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-2 text-[12px] text-gray-700 hover:bg-gray-50"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                      <span>Salon Settings</span>
                    </Link>
                    <Link
                      href="/app/support"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-2 text-[12px] text-gray-700 hover:bg-gray-50"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      <span>Support & Help</span>
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-gray-100">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-[12px] text-red-600 hover:bg-red-50 text-left"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ─── MOBILE TOP UTILITY BAR (Width < 768px) ─── */}
        <header className="md:hidden flex items-center justify-between h-14 px-3 bg-white border-b border-gray-200 sticky top-0 z-30 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 bg-gray-900 rounded-sm flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[11px] font-bold">B</span>
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-gray-900 truncate leading-tight">
                {salonName}
              </p>
              <p className="text-[10px] text-gray-400 font-medium">
                {currentRole || 'OWNER'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Link
              href="/app/support"
              className="p-2 text-gray-500 hover:text-gray-900 rounded-sm transition-colors"
              title="Support"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </Link>

            <Link
              href="/app/appointments?action=create"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-900 text-white rounded-sm text-[11px] font-semibold"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>New</span>
            </Link>
          </div>
        </header>

        {/* ─── MAIN CONTENT CONTAINER ─── */}
        <main className="flex-1 min-w-0 pb-20 md:pb-8 overflow-x-hidden">
          {children}
        </main>

        {/* ─── MOBILE FIXED BOTTOM NAVIGATION BAR (Width < 768px) ─── */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex items-center justify-around px-1 h-16 safe-area-bottom"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        >
          {/* 1. Home */}
          <Link
            href="/app"
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-colors ${
              pathname === '/app' ? 'text-gray-900 font-bold' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
            <span className="text-[10px] mt-1 tracking-tight">Home</span>
          </Link>

          {/* 2. Calendar */}
          <Link
            href="/app/calendar"
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-colors ${
              pathname.startsWith('/app/calendar') ? 'text-gray-900 font-bold' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="text-[10px] mt-1 tracking-tight">Calendar</span>
          </Link>

          {/* 3. Appointments */}
          <Link
            href="/app/appointments"
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-colors ${
              pathname.startsWith('/app/appointments') ? 'text-gray-900 font-bold' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <span className="text-[10px] mt-1 tracking-tight">Appointments</span>
          </Link>

          {/* 4. Customers */}
          <Link
            href="/app/customers"
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-colors ${
              pathname.startsWith('/app/customers') ? 'text-gray-900 font-bold' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span className="text-[10px] mt-1 tracking-tight">Customers</span>
          </Link>

          {/* 5. More */}
          <button
            onClick={() => setIsMoreOpen(true)}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-colors ${
              isMoreOpen || isMoreActive() ? 'text-gray-900 font-bold' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
            <span className="text-[10px] mt-1 tracking-tight">More</span>
          </button>
        </nav>

        {/* ─── MOBILE "MORE" SLIDE-UP DRAWER / SHEET ─── */}
        {isMoreOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
            {/* Dark Backdrop */}
            <div
              onClick={() => setIsMoreOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            />

            {/* Slide-up Container */}
            <div
              className="relative z-10 w-full bg-white border-t border-gray-200 rounded-t-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-none"
              style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
            >
              {/* Grab Bar & Header */}
              <div className="flex flex-col items-center pt-2.5 px-4 pb-3 border-b border-gray-100 flex-shrink-0">
                <div className="w-10 h-1 bg-gray-300 rounded-full mb-3" />
                <div className="w-full flex items-center justify-between">
                  <h3 className="text-[14px] font-bold text-gray-900">More Options</h3>
                  <button
                    onClick={() => setIsMoreOpen(false)}
                    className="p-1 rounded-sm text-gray-400 hover:text-gray-700"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Scrollable Navigation Options */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
                {/* Group 1: Operations & Catalog */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                    Operations & Catalog
                  </p>
                  <div className="space-y-1">
                    <Link
                      href="/app/staff"
                      onClick={() => setIsMoreOpen(false)}
                      className={`flex items-center justify-between p-2.5 rounded-sm text-[13px] transition-colors ${
                        isActive('/app/staff') ? 'bg-gray-100 text-gray-900 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        <span>Staff Members</span>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><polyline points="9 18 15 12 9 6"/></svg>
                    </Link>

                    <Link
                      href="/app/services"
                      onClick={() => setIsMoreOpen(false)}
                      className={`flex items-center justify-between p-2.5 rounded-sm text-[13px] transition-colors ${
                        isActive('/app/services') ? 'bg-gray-100 text-gray-900 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                          <circle cx="6" cy="6" r="3" />
                          <circle cx="6" cy="18" r="3" />
                          <line x1="20" y1="4" x2="8.12" y2="15.88" />
                          <line x1="14.47" y1="14.48" x2="20" y2="20" />
                          <line x1="8.12" y1="8.12" x2="12" y2="12" />
                        </svg>
                        <span>Services & Pricing</span>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><polyline points="9 18 15 12 9 6"/></svg>
                    </Link>

                    <Link
                      href="/app/financials"
                      onClick={() => setIsMoreOpen(false)}
                      className={`flex items-center justify-between p-2.5 rounded-sm text-[13px] transition-colors ${
                        isActive('/app/financials') ? 'bg-gray-100 text-gray-900 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                          <line x1="12" y1="1" x2="12" y2="23" />
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                        <span>Financials & Payments</span>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><polyline points="9 18 15 12 9 6"/></svg>
                    </Link>
                  </div>
                </div>

                {/* Group 2: Salon Administration */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                    Administration
                  </p>
                  <div className="space-y-1">
                    <Link
                      href="/app/settings"
                      onClick={() => setIsMoreOpen(false)}
                      className={`flex items-center justify-between p-2.5 rounded-sm text-[13px] transition-colors ${
                        isActive('/app/settings') ? 'bg-gray-100 text-gray-900 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                          <circle cx="12" cy="12" r="3" />
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                        <span>Salon Settings</span>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><polyline points="9 18 15 12 9 6"/></svg>
                    </Link>

                    <Link
                      href="/app/support"
                      onClick={() => setIsMoreOpen(false)}
                      className={`flex items-center justify-between p-2.5 rounded-sm text-[13px] transition-colors ${
                        isActive('/app/support') ? 'bg-gray-100 text-gray-900 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        <span>Support & Help Center</span>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><polyline points="9 18 15 12 9 6"/></svg>
                    </Link>
                  </div>
                </div>

                {/* Group 3: Account Profile & Sign Out */}
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-sm mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 bg-gray-900 rounded-sm flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                        {userInitials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-bold text-gray-900 truncate">
                          {user?.profile?.fullName || 'User Profile'}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border border-red-200 bg-red-50 text-red-700 rounded-sm text-[12px] font-semibold hover:bg-red-100 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </TenantProvider>
  )
}
