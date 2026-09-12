'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { authService } from '@/application/auth'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const { error: resetError } = await authService.requestPasswordReset(email)
      if (resetError) {
        setError(resetError.message)
      } else {
        setSuccess(true)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Reset your password</h2>
        <p className="text-sm text-gray-500 mt-1">
          Enter your email and we'll send you instructions to reset your password.
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
          <span className="text-red-500 text-sm">⚠️</span>
          <p className="text-xs font-medium text-red-700 leading-snug">{error}</p>
        </div>
      )}

      {success ? (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-center space-y-3">
          <div className="text-2xl">📬</div>
          <p className="text-sm font-semibold text-emerald-900">Check your email</p>
          <p className="text-xs text-emerald-700">
            We sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the instructions.
          </p>
          <div className="pt-2">
            <Link
              href="/auth/login"
              className="text-xs font-bold text-gray-900 hover:underline"
            >
              Return to login
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Account email
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3.5 bg-gray-900 hover:bg-black text-white rounded-2xl text-sm font-semibold shadow-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Sending reset link...</span>
              </>
            ) : (
              'Send password reset link'
            )}
          </button>
        </form>
      )}

      <div className="mt-6 pt-5 border-t border-gray-100 text-center">
        <Link href="/auth/login" className="text-xs font-semibold text-gray-600 hover:text-gray-900">
          ← Back to sign in
        </Link>
      </div>
    </div>
  )
}

