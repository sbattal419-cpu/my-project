import { type FormEvent, useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { signIn, resetPassword, verifyRecoveryOTP, updatePassword } from '../lib/auth'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'

function translateError(msg: string, t: (k: string) => string): string {
  if (msg.includes('Invalid login credentials')) return t('login.title') === 'Sign In'
    ? 'Invalid email or password'
    : 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
  if (msg.includes('Email not confirmed')) return t('login.title') === 'Sign In'
    ? 'Please confirm your email first'
    : 'يرجى تأكيد بريدك الإلكتروني من صندوق الوارد أولاً'
  if (msg.includes('Too many requests')) return t('login.title') === 'Sign In'
    ? 'Too many attempts, please wait a moment'
    : 'محاولات كثيرة جداً، يرجى الانتظار قليلاً ثم المحاولة مجدداً'
  return t('error')
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const { t } = useLang()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const resetOtpHiddenRef = useRef<HTMLInputElement>(null)
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSending, setResetSending] = useState(false)
  const [resetStep, setResetStep] = useState<'email' | 'otp' | 'password' | 'done'>('email')
  const [resetOtp, setResetOtp] = useState('')
  const [resetNewPwd, setResetNewPwd] = useState('')
  const [resetConfirmPwd, setResetConfirmPwd] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetResend, setResetResend] = useState(0)

  useEffect(() => {
    if (!loading && user) navigate('/', { replace: true })
  }, [user, loading, navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim()) { setError(t('login.email')); return }
    if (!password) { setError(t('login.password')); return }

    setSubmitting(true)
    try {
      const data = await signIn(email.trim(), password)
      const fullName = (data.user?.user_metadata?.full_name as string)?.trim()
      const displayName = fullName || email.trim().split('@')[0]
      sessionStorage.setItem('welcome_name', displayName)
      navigate('/', { replace: true })
    } catch (err) {
      setError(translateError((err as Error).message, t))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="auth-loading-page">
        <div className="auth-spinner" />
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-bg-pattern" />
      <div className="auth-bg-radial" />

      <div className="auth-header-bar">
        <Link to="/" className="auth-back-home">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 3 12 9 6" /><line x1="3" y1="12" x2="21" y2="12" />
          </svg>
          {t('auth.back')}
        </Link>
      </div>

      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' as const }}
      >
        <div className="auth-card-logo">
          <svg width="34" height="34" viewBox="0 0 44 44" fill="none">
            <path d="M22 5L38 12V26C38 35 22 42 22 42C22 42 6 35 6 26V12L22 5Z"
              fill="rgba(37,99,235,0.12)" stroke="#2563eb" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M14 22L19.5 28.5L30 16"
              stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <div className="auth-card-logo-name">{t('auth.brand.name')}</div>
            <div className="auth-card-logo-sub">{t('auth.brand.sub')}</div>
          </div>
        </div>

        <h1 className="auth-title">{t('login.title')}</h1>
        <p className="auth-subtitle">{t('login.subtitle')}</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="auth-alert auth-alert-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">{t('login.email')}</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="example@domain.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              dir="ltr"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">{t('login.password')}</label>
            <div className="input-password-wrap">
              <input
                id="password"
                type={showPwd ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                dir="ltr"
              />
              <button
                type="button"
                className="input-pwd-toggle"
                onClick={() => setShowPwd(v => !v)}
              >
                {showPwd ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="button" className="form-forgot" onClick={() => { setShowReset(true); setResetEmail(email); setResetStep('email'); setResetOtp(''); setResetNewPwd(''); setResetConfirmPwd(''); setResetError(''); setResetResend(0) }}>
            {t('login.forgot')}
          </button>

          <button type="submit" className="btn-auth" disabled={submitting}>
            {submitting ? (
              <><span className="btn-spinner" />{t('login.btn.loading')}</>
            ) : t('login.btn')}
          </button>
        </form>

        <p className="auth-switch">
          {t('login.no.account')}{' '}
          <Link to="/register" className="auth-switch-link">{t('login.signup.link')}</Link>
        </p>
      </motion.div>

      {showReset && (
        <div className="wsm-overlay" onClick={() => setShowReset(false)}>
          <div className="wsm-modal" onClick={e => e.stopPropagation()}>
            <div className="wsm-header">
              <span className="wsm-title">{t('reset.title')}</span>
              <button className="wsm-close" onClick={() => setShowReset(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {resetStep === 'done' ? (
              <div className="reset-success">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>
                </svg>
                <p>تم تغيير كلمة المرور بنجاح</p>
                <p className="reset-sub">يمكنك الآن تسجيل الدخول بكلمة مرورك الجديدة</p>
              </div>

            ) : resetStep === 'otp' ? (
              <>
                <p style={{ fontSize: 13.5, color: 'var(--c-gray-500)', lineHeight: 1.6 }}>
                  تم إرسال رمز الاستعادة إلى<br />
                  <strong style={{ color: 'var(--c-gray-700)', wordBreak: 'break-all' }}>{resetEmail}</strong>
                </p>
                <div className="otp-boxes-wrap" onClick={() => resetOtpHiddenRef.current?.focus()}>
                  <div className="otp-boxes">
                    {Array.from({ length: 8 }, (_, i) => (
                      <div key={i} className={`otp-box${resetOtp[i] ? ' otp-box-filled' : ''}${resetOtp.length === i ? ' otp-box-active' : ''}`}>
                        {resetOtp[i] || ''}
                      </div>
                    ))}
                  </div>
                  <input
                    ref={resetOtpHiddenRef}
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    value={resetOtp}
                    autoFocus
                    autoComplete="one-time-code"
                    onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 8); setResetOtp(v); setResetError('') }}
                    style={{ position: 'absolute', opacity: 0, width: 1, height: 1, pointerEvents: 'none' }}
                  />
                </div>
                {resetError && <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>{resetError}</p>}
                <button
                  className="btn-auth"
                  disabled={resetOtp.length !== 8 || resetSending}
                  onClick={async () => {
                    setResetSending(true)
                    setResetError('')
                    try {
                      await verifyRecoveryOTP(resetEmail.trim(), resetOtp)
                      setResetStep('password')
                    } catch {
                      setResetError('الرمز غير صحيح أو انتهت صلاحيته')
                      setResetOtp('')
                    } finally {
                      setResetSending(false)
                    }
                  }}
                >
                  {resetSending ? <><span className="btn-spinner" />جاري التحقق...</> : 'تحقق من الرمز'}
                </button>
                <div className="otp-resend">
                  {resetResend > 0
                    ? <span className="otp-resend-wait">إعادة الإرسال بعد {resetResend}ث</span>
                    : <button className="otp-resend-btn" onClick={async () => {
                        try {
                          await resetPassword(resetEmail.trim())
                          setResetResend(60)
                          const timer = setInterval(() => setResetResend(c => { if (c <= 1) { clearInterval(timer); return 0 } return c - 1 }), 1000)
                        } catch { /* ignore */ }
                      }}>لم يصلك الرمز؟ إعادة الإرسال</button>
                  }
                </div>
              </>

            ) : resetStep === 'password' ? (
              <>
                <p style={{ fontSize: 13.5, color: 'var(--c-gray-500)' }}>أدخل كلمة مرورك الجديدة</p>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">كلمة المرور الجديدة</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••  (8 أحرف على الأقل)"
                    value={resetNewPwd}
                    onChange={e => { setResetNewPwd(e.target.value); setResetError('') }}
                    dir="ltr"
                    autoFocus
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">تأكيد كلمة المرور</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={resetConfirmPwd}
                    onChange={e => { setResetConfirmPwd(e.target.value); setResetError('') }}
                    dir="ltr"
                  />
                </div>
                {resetError && <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>{resetError}</p>}
                <button
                  className="btn-auth"
                  disabled={resetSending || !resetNewPwd}
                  onClick={async () => {
                    if (resetNewPwd.length < 8) { setResetError('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return }
                    if (resetNewPwd !== resetConfirmPwd) { setResetError('كلمتا المرور غير متطابقتين'); return }
                    setResetSending(true)
                    setResetError('')
                    try {
                      await updatePassword(resetNewPwd)
                      setResetStep('done')
                    } catch {
                      setResetError('حدث خطأ، يرجى المحاولة مرة أخرى')
                    } finally {
                      setResetSending(false)
                    }
                  }}
                >
                  {resetSending ? <><span className="btn-spinner" />جاري الحفظ...</> : 'حفظ كلمة المرور'}
                </button>
              </>

            ) : (
              <>
                <p style={{ fontSize: 14, color: 'var(--c-gray-500)' }}>أدخل بريدك الإلكتروني وسنرسل لك رمز الاستعادة فوراً</p>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">البريد الإلكتروني</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="example@domain.com"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    dir="ltr"
                    autoFocus
                  />
                </div>
                {resetError && <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>{resetError}</p>}
                <button
                  className="btn-auth"
                  disabled={resetSending || !resetEmail.trim()}
                  onClick={async () => {
                    setResetSending(true)
                    setResetError('')
                    try {
                      await resetPassword(resetEmail.trim())
                      setResetStep('otp')
                      setResetResend(60)
                      const timer = setInterval(() => setResetResend(c => { if (c <= 1) { clearInterval(timer); return 0 } return c - 1 }), 1000)
                    } catch (err) {
                      const msg = (err as Error).message ?? ''
                      if (msg.includes('60 seconds') || msg.includes('rate limit') || msg.includes('security purposes'))
                        setResetError('يرجى الانتظار دقيقة واحدة قبل إعادة المحاولة')
                      else if (msg.includes('invalid') || msg.includes('not found'))
                        setResetError('هذا البريد الإلكتروني غير مسجّل')
                      else
                        setResetError(`خطأ: ${msg}`)
                    } finally {
                      setResetSending(false)
                    }
                  }}
                >
                  {resetSending ? <><span className="btn-spinner" />جاري الإرسال...</> : 'إرسال رمز الاستعادة'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
