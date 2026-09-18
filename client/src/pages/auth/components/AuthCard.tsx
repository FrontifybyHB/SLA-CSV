import { memo, useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Icon } from '@/shared/ui/Icon'
import { SignInForm } from './SignInForm'
import { RegisterForm } from './RegisterForm'

type AuthTab = 'login' | 'register'

export const AuthCard = memo(function AuthCard() {
  const { pathname } = useLocation()
  const [tab, setTab] = useState<AuthTab>(() =>
    pathname === '/register' ? 'register' : 'login',
  )

  useEffect(() => {
    setTab(pathname === '/register' ? 'register' : 'login')
  }, [pathname])

  const handleTabChange = useCallback((next: AuthTab) => setTab(next), [])
  const isLogin = tab === 'login'

  return (
    <section className="min-w-0 lg:col-span-7">
      <div className="bg-sla-surface-container-lowest border border-sla-outline-variant/50 rounded-[16px] shadow-[0_1px_2px_rgb(16_24_40/0.06)] p-5 sm:p-6 lg:p-8">
        <div role="tablist" aria-label="Authentication mode" className="flex items-center gap-1 p-1 bg-sla-surface-container-low border border-sla-outline-variant/30 rounded-[2px] mb-6">
          <button
            type="button"
            role="tab"
            id="tab-login"
            aria-selected={isLogin}
            aria-controls="panel-login"
            onClick={() => handleTabChange('login')}
            className={`flex-1 py-2 px-2 rounded-[4px] text-center text-headline-sm font-sla font-normal text-sla-secondary cursor-pointer whitespace-nowrap transition-all ${
              isLogin
                ? 'bg-sla-surface-container-lowest text-sla-on-surface font-semibold shadow-[0_1px_2px_rgb(16_24_40/0.06)]'
                : 'hover:text-sla-on-surface'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            id="tab-register"
            aria-selected={!isLogin}
            aria-controls="panel-register"
            onClick={() => handleTabChange('register')}
            className={`flex-1 py-2 px-2 rounded-[4px] text-center text-headline-sm font-sla font-normal text-sla-secondary cursor-pointer whitespace-nowrap transition-all ${
              !isLogin
                ? 'bg-sla-surface-container-lowest text-sla-on-surface font-semibold shadow-[0_1px_2px_rgb(16_24_40/0.06)]'
                : 'hover:text-sla-on-surface'
            }`}
          >
            Create Account
          </button>
        </div>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-sla-outline-variant/40" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-sla-surface-container-lowest px-3 text-body-sm text-sla-secondary whitespace-nowrap">
              sign in with your work email
            </span>
          </div>
        </div>

        <div
          role="tabpanel"
          id="panel-login"
          aria-labelledby="tab-login"
          hidden={!isLogin}
          className="auth-panel"
        >
          <SignInForm onSwitchToRegister={() => handleTabChange('register')} />
        </div>
        <div
          role="tabpanel"
          id="panel-register"
          aria-labelledby="tab-register"
          hidden={isLogin}
          className="auth-panel"
        >
          <RegisterForm onSwitchToLogin={() => handleTabChange('login')} />
        </div>

        <div className="mt-6 pt-5 border-t border-sla-outline-variant/30">
          <div className="flex items-start gap-3 bg-sla-surface-container-low/60 p-3.5 rounded-sm">
            <Icon name="lock" size={20} className="text-sla-primary flex-shrink-0 mt-0.5" />
            <div className="min-w-0 text-left">
              <div className="text-headline-sm font-semibold text-sla-on-surface">
                Email + password sign-in only
              </div>
              <p className="text-body-sm text-sla-secondary mt-0.5">
                No third-party OAuth is configured. Passwords are salted and hashed;
                sessions live in httpOnly cookies with rotating refresh tokens.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
})