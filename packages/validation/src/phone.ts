/**
 * South African Phone Number Validation & Normalization
 */

export const SA_PHONE_REGEX = /^(?:\+27|0)[6-8][0-9]{8}$/

export function isValidSAMobile(phone: unknown): boolean {
  if (typeof phone !== 'string') return false
  const cleaned = phone.replace(/[\s\-()]/g, '')
  return SA_PHONE_REGEX.test(cleaned)
}

export function formatSAMobile(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, '')
  if (cleaned.startsWith('0')) {
    return '+27' + cleaned.substring(1)
  }
  return cleaned
}

export const normalizeSouthAfricanPhone = formatSAMobile
export const validateSouthAfricanPhone = isValidSAMobile
