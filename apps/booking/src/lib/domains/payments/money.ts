/**
 * Money utilities using integer minor units (cents) to avoid floating point drift.
 */

export function toCents(amount: number): number {
  return Math.round(amount * 100)
}

export function fromCents(cents: number): number {
  return cents / 100
}

export function addMoney(a: number, b: number): number {
  return fromCents(toCents(a) + toCents(b))
}

export function subtractMoney(a: number, b: number): number {
  return fromCents(toCents(a) - toCents(b))
}

export function assertNonNegative(amount: number, label: string = 'Amount'): void {
  if (amount < 0) {
    throw new Error(`${label} cannot be negative: ${amount}`)
  }
}

export function formatZAR(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

