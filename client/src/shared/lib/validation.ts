/**
 * Shared auth-form validators.
 * Consolidates the identical email rule previously duplicated
 * in SignInForm and RegisterForm.
 */
export function validateEmail(value: string): string | undefined {
  if (!value) return 'Email is required'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address'
  return undefined
}
