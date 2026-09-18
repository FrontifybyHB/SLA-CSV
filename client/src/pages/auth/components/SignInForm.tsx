import { useCallback, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Field } from '@/shared/ui/Field'
import { Input } from '@/shared/ui/Input'
import { Button } from '@/shared/ui/Button'
import { ErrorState } from '@/shared/ui/ErrorState'
import { getErrorMessage, isApiError } from '@/shared/api/api-error'
import { validateEmail } from '@/shared/lib/validation'
import { PasswordField } from './PasswordField'
import { useLogin } from '@/features/auth/hooks/useAuth'

interface FormErrors {
  email?: string
  password?: string
}

export function SignInForm({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [serverError, setServerError] = useState<string | null>(null)

  const loginMutation = useLogin()
  const navigate = useNavigate()

  const validatePassword = useCallback((value: string): string | undefined => {
    if (!value) return 'Password is required'
    if (value.length < 8) return 'Password must be at least 8 characters'
    return undefined
  }, [])

  const validateField = useCallback(
    (name: string, value: string) => {
      let error: string | undefined
      if (name === 'email') error = validateEmail(value)
      if (name === 'password') error = validatePassword(value)
      setErrors((prev) => ({ ...prev, [name]: error }))
    },
    [validatePassword]
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

      if (emailError || passwordError) {
        setErrors({ email: emailError, password: passwordError })
        setTouched({ email: true, password: true })
        return
      }

      try {
        await loginMutation.mutateAsync({ email, password })
        navigate('/dashboard', { replace: true })
      } catch (error) {
        // 401 = wrong credentials; anything else (network, server, rate
        // limit) surfaces verbatim so the failure is diagnosable.
        setServerError(
          isApiError(error) && error.status === 401
            ? 'Invalid email or password'
            : getErrorMessage(error, 'Sign in failed. Please try again.'),
        )
      }
    },
    [email, password, loginMutation, navigate, validatePassword]
  )

  const emailError = touched.email ? errors.email : undefined
  const passwordError = touched.password ? errors.password : undefined

  return (
    <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
      {serverError && (
        <ErrorState title="Sign in failed" message={serverError} />
      )}

      <Field htmlFor="login-email" label="Work Email" error={emailError}>
        <Input
          id="login-email"
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

      <Field htmlFor="login-password" label="Password" error={passwordError}>
        <PasswordField
          id="login-password"
          label=""
          value={password}
          onChange={setPassword}
          placeholder="••••••••••••"
          autoComplete="current-password"
          onBlur={(e) => handleBlur('password', e.target.value)}
        />
      </Field>

      <Button
        type="submit"
        variant="primary"
        size="md"
        pending={loginMutation.isPending}
        className="w-full h-10 flex items-center justify-center gap-2 bg-sla-primary-container text-sla-on-primary text-headline-sm font-sla font-semibold text-decoration-none rounded-sm border-none cursor-pointer transition-colors shadow-[0_1px_2px_rgb(16_24_40/0.06)] hover:bg-sla-primary whitespace-nowrap"
      >
        <span>Sign in to SLA Monitor</span>
      </Button>

      <p className="text-body-md leading-body-md text-sla-secondary text-center mt-2">
        Don't have an account?{' '}
        <Button variant="link" onClick={onSwitchToRegister} className="p-0 border-none bg-transparent text-sla-primary font-semibold hover:underline">
          Register
        </Button>
      </p>
    </form>
  )
}