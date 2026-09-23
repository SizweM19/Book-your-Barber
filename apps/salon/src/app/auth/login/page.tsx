'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/application/auth'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const { error: loginError } = await login({ email, password })
      if (loginError) {
        setError(loginError.message)
      } else {
        const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
        const returnUrl = searchParams?.get('returnUrl') || '/app'
        router.push(returnUrl)
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Welcome back</h2>
        <p className="text-sm text-gray-500 mt-1">Sign in to manage your salon operations</p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
          <span className="text-red-500 text-sm">⚠️</span>
          <p className="text-xs font-medium text-red-700 leading-snug">{error}</p>
        </div>
      )}

      {process.env.NODE_ENV !== 'production' && (
        <div className="mb-5 p-3.5 bg-blue-50 border border-blue-100 rounded-2xl">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-900 mb-2">Development Accounts (Mock)</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => { setEmail('owner@fadeandedge.co.za'); setPassword('password123') }}
              className="px-2.5 py-1 text-xs bg-white text-blue-800 rounded-lg border border-blue-200 font-medium hover:bg-blue-100"
            >
              Salon Owner
            </button>
            <button
              type="button"
              onClick={() => { setEmail('manager@fadeandedge.co.za'); setPassword('password123') }}
              className="px-2.5 py-1 text-xs bg-white text-blue-800 rounded-lg border border-blue-200 font-medium hover:bg-blue-100"
            >
              Manager
            </button>
            <button
              type="button"
              onClick={() => { setEmail('admin@bookyourbarber.co.za'); setPassword('password123') }}
              className="px-2.5 py-1 text-xs bg-white text-blue-800 rounded-lg border border-blue-200 font-medium hover:bg-blue-100"
            >
              Admin
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Email address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="barber@fadeandedge.co.za"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Password
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
            >
              Forgot?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 py-3.5 bg-gray-900 hover:bg-black text-white rounded-2xl text-sm font-semibold shadow-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            'Sign in to SalonOps'
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-500">
          New salon owner?{' '}
          <Link href="/auth/register" className="font-semibold text-gray-900 hover:underline">
            Register your salon
          </Link>
        </p>
      </div>
    </div>
  )
}

