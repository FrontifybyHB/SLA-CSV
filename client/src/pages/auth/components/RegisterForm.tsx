import { useCallback, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Field } from '@/shared/ui/Field'
import { Input } from '@/shared/ui/Input'
import { Button } from '@/shared/ui/Button'
import { ErrorState } from '@/shared/ui/ErrorState'
import { getErrorMessage } from '@/shared/api/api-error'
import { validateEmail } from '@/shared/lib/validation'
import { PasswordField } from './PasswordField'
import { useRegister } from '@/features/auth/hooks/useAuth'

interface FormErrors {
  email?: string
  password?: string
  confirmPassword?: string
}

export function RegisterForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [serverError, setServerError] = useState<string | null>(null)

  const registerMutation = useRegister()
  const navigate = useNavigate()

  const validatePassword = useCallback((value: string): string | undefined => {
    if (!value) return 'Password is required'
    if (value.length < 8) return 'Password must be at least 8 characters'
    return undefined
  }, [])

  const validateConfirmPassword = useCallback(
    (value: string): string | undefined => {
      if (!value) return 'Please confirm your password'
      if (value !== password) return 'Passwords do not match'
      return undefined
    },
    [password]
  )

  const validateField = useCallback(
    (name: string, value: string) => {
      let error: string | undefined
      if (name === 'email') error = validateEmail(value)
      if (name === 'password') error = validatePassword(value)
      if (name === 'confirmPassword') error = validateConfirmPassword(value)
      setErrors((prev) => ({ ...prev, [name]: error }))
    },
    [validatePassword, validateConfirmPassword]
  )

  const handleBlur = useCallback(
    (name: string, value: string) => {
      setTouched((prev) => ({ ...prev, [name]: true }))
      validateField(name, value)
    },
    [validateField]
  )

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setServerError(null)

      const emailError = validateEmail(email)
      const passwordError = validatePassword(password)
      const confirmPasswordError = validateConfirmPassword(confirmPassword)

      if (emailError || passwordError || confirmPasswordError) {
        setErrors({
          email: emailError,
          password: passwordError,
          confirmPassword: confirmPasswordError,
        })
        setTouched({ email: true, password: true, confirmPassword: true })
        return
      }

      try {
        await registerMutation.mutateAsync({ email, password })
        navigate('/dashboard', { replace: true })
      } catch (error) {
        setServerError(getErrorMessage(error, 'Registration failed. Please try again.'))
      }
    },
    [email, password, confirmPassword, registerMutation, navigate, validatePassword, validateConfirmPassword]
  )

  const emailError = touched.email ? errors.email : undefined
  const passwordError = touched.password ? errors.password : undefined
  const confirmPasswordError = touched.confirmPassword ? errors.confirmPassword : undefined

  return (
    <form className="flex flex-col gap-3.5" noValidate onSubmit={handleSubmit}>
      {serverError && (
        <ErrorState title="Registration failed" message={serverError} />
      )}

      <Field htmlFor="reg-email" label="Work Email" error={emailError}>
        <Input
          id="reg-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={(e) => handleBlur('email', e.target.value)}
          placeholder="alex.chen@infra.acme.corp"
          invalid={!!emailError}
        />
      </Field>

      <Field htmlFor="reg-password" label="Password" hint="Minimum 8 characters" error={passwordError}>
        <PasswordField
          id="reg-password"
          label=""
          value={password}
          onChange={setPassword}
          placeholder="Create password (min. 8 chars)"
          autoComplete="new-password"
          onBlur={(e) => handleBlur('password', e.target.value)}
        />
      </Field>

      <Field htmlFor="reg-confirm-password" label="Confirm Password" error={confirmPasswordError}>
        <PasswordField
          id="reg-confirm-password"
          label=""
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Confirm password"
          autoComplete="new-password"
          onBlur={(e) => handleBlur('confirmPassword', e.target.value)}
        />
      </Field>

      <Button
        type="submit"
        variant="primary"
        size="md"
        pending={registerMutation.isPending}
        className="w-full h-10 flex items-center justify-center gap-2 bg-sla-primary-container text-sla-on-primary text-headline-sm font-sla font-semibold text-decoration-none rounded-sm border-none cursor-pointer transition-colors shadow-[0_1px_2px_rgb(16_24_40/0.06)] hover:bg-sla-primary whitespace-nowrap mt-2"
      >
        <span>Create Account</span>
      </Button>

      <p className="text-body-md leading-body-md text-sla-secondary text-center mt-4">
        Already have an account?{' '}
        <Button variant="link" onClick={onSwitchToLogin} className="p-0 border-none bg-transparent text-sla-primary font-semibold hover:underline">
          Sign in
        </Button>
      </p>
    </form>
  )
}