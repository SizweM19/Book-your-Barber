/**
 * Safe Monetary Arithmetic for BookYourBarber (South African Rand - ZAR)
 * 
 * Rules:
 * - All internal arithmetic uses integer cents (minor units) to prevent IEEE-754 floating-point drift.
 * - Negative amounts are rejected unless explicitly designated as negative adjustments.
 * - Deterministic half-up rounding.
 */

/**
 * Converts a decimal Rand amount (e.g. 150.50) to integer cents (15050).
 */
export function randsToCents(rands: number): number {
  if (!Number.isFinite(rands)) {
    throw new TypeError(`Invalid monetary value: ${rands}`)
  }
  return Math.round(rands * 100)
}

/**
 * Converts integer cents (e.g. 15050) to decimal Rands (150.50).
 */
export function centsToRands(cents: number): number {
  if (!Number.isFinite(cents)) {
    throw new TypeError(`Invalid cents value: ${cents}`)
  }
  return Math.round(cents) / 100
}

/**
 * Ensures an amount is non-negative and finite.
 */
export function assertNonNegative(amount: number, label = 'Amount'): void {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(`${label} must be a non-negative number. Received: ${amount}`)
  }
}

/**
 * Safely adds two monetary amounts (in Rands), returning Rands.
 */
export function addMoney(a: number, b: number): number {
  assertNonNegative(a, 'Amount A')
  assertNonNegative(b, 'Amount B')
  return centsToRands(randsToCents(a) + randsToCents(b))
}

/**
 * Safely subtracts money (in Rands), clamped to a minimum of 0.
 */
export function subtractMoney(total: number, deduction: number): number {
  assertNonNegative(total, 'Total')
  assertNonNegative(deduction, 'Deduction')
  const resultCents = Math.max(0, randsToCents(total) - randsToCents(deduction))
  return centsToRands(resultCents)
}

/**
 * Calculates a percentage of an amount in Rands, rounded half-up to nearest cent.
 */
export function calculatePercentageFee(amount: number, percentage: number): number {
  assertNonNegative(amount, 'Amount')
  assertNonNegative(percentage, 'Percentage')
  const amountCents = randsToCents(amount)
  // Round to nearest integer cent
  const feeCents = Math.round((amountCents * percentage) / 100)
  return centsToRands(feeCents)
}

/**
 * Formats a decimal Rand amount for UI display (e.g. 150 -> "R150.00").
 */
export function formatZAR(amount: number): string {
  if (!Number.isFinite(amount)) return 'R0.00'
  const isNegative = amount < 0
  const abs = Math.abs(amount)
  const parts = abs.toFixed(2).split('.')
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  const formatted = `R${integerPart}.${parts[1]}`
  return isNegative ? `-${formatted}` : formatted
}
