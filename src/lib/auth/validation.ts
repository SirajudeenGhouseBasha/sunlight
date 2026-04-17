export type ValidationResult = { ok: true } | { ok: false; message: string }

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(email: string): ValidationResult {
  if (!EMAIL_REGEX.test(email)) {
    return { ok: false, message: 'Please enter a valid email address.' }
  }
  return { ok: true }
}

export function validatePasswordLength(password: string): ValidationResult {
  if (password.length < 8) {
    return { ok: false, message: 'Password must be at least 8 characters.' }
  }
  return { ok: true }
}

export function validatePasswordsMatch(
  password: string,
  confirmPassword: string
): ValidationResult {
  if (password !== confirmPassword) {
    return { ok: false, message: 'Passwords do not match.' }
  }
  return { ok: true }
}

export function validateNonEmpty(value: string, fieldName: string): ValidationResult {
  if (value.trim().length === 0) {
    return { ok: false, message: `${fieldName} is required.` }
  }
  return { ok: true }
}
