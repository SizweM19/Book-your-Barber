'use client'

import React, { forwardRef } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-neutral-300">
            {label}
          </label>
        )}

        <div className="relative rounded-lg shadow-sm">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={twMerge(
              clsx(
                'w-full rounded-lg bg-neutral-800/80 border text-neutral-100 placeholder-neutral-500 text-sm px-3.5 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50',
                error
                  ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/30'
                  : 'border-neutral-700/80 hover:border-neutral-600 focus:border-amber-500',
                leftIcon && 'pl-10',
                rightIcon && 'pr-10',
                className
              )
            )}
            {...props}
          />

          {rightIcon && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400">
              {rightIcon}
            </div>
          )}
        </div>

        {error ? (
          <p className="text-xs text-red-400 mt-1">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-neutral-400 mt-1">{helperText}</p>
        ) : null}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
