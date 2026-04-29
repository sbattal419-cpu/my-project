import { type FormEvent, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { signIn, resetPassword } from '../lib/auth'
import { useAuth } from '../context/AuthContext'

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
  if (msg.includes('Email not confirmed')) return 'يرجى تأكيد بريدك الإلكتروني من صندوق الوارد أولاً'
  if (msg.includes('Too many requests')) return 'محاولات كثيرة جداً، يرجى الانتظار قليلاً ثم المحاولة مجدداً'
  return 'حدث خطأ، يرجى المحاولة مرة أخرى'
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSending, setResetSending] = useState(false)
  const [resetDone, setResetDone] = useState(false)
  const [resetError, setResetError] = useState('')

  useEffect(() => {
    if (!loading && user) navigate('/', { replace: true })
  }, [user, loading, navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim()) { setError('يرجى إدخال البريد الإلكتروني'); return }
    if (!password) { setError('يرجى إدخال كلمة المرور'); return }

    setSubmitting(true)
    try {
      await signIn(email.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(translateError((err as Error).message))
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
          العودة للرئيسية
        </Link>
      </div>

      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' as const }}
      >
        {/* Logo */}
        <div className="auth-card-logo">
          <svg width="34" height="34" viewBox="0 0 44 44" fill="none">
            <path d="M22 5L38 12V26C38 35 22 42 22 42C22 42 6 35 6 26V12L22 5Z"
              fill="rgba(37,99,235,0.12)" stroke="#2563eb" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M14 22L19.5 28.5L30 16"
              stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <div className="auth-card-logo-name">إدارة الحقوق الملكية</div>
            <div className="auth-card-logo-sub">والفكرية</div>
          </div>
        </div>

        <h1 className="auth-title">تسجيل الدخول</h1>
        <p className="auth-subtitle">أهلاً بعودتك، يرجى إدخال بيانات حسابك</p>

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
            <label className="form-label" htmlFor="email">البريد الإلكتروني</label>
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
            <label className="form-label" htmlFor="password">كلمة المرور</label>
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
                aria-label={showPwd ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
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

          <button type="button" className="form-forgot" onClick={() => { setShowReset(true); setResetEmail(email); setResetDone(false); setResetError('') }}>
            نسيت كلمة المرور؟
          </button>

          <button type="submit" className="btn-auth" disabled={submitting}>
            {submitting ? (
              <><span className="btn-spinner" />جارٍ الدخول...</>
            ) : 'دخول'}
          </button>
        </form>

        <p className="auth-switch">
          ليس لديك حساب؟{' '}
          <Link to="/register" className="auth-switch-link">إنشاء حساب جديد</Link>
        </p>
      </motion.div>

      {/* نافذة نسيت كلمة المرور */}
      {showReset && (
        <div className="wsm-overlay" onClick={() => setShowReset(false)}>
          <div className="wsm-modal" onClick={e => e.stopPropagation()}>
            <div className="wsm-header">
              <span className="wsm-title">استعادة كلمة المرور</span>
              <button className="wsm-close" onClick={() => setShowReset(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {resetDone ? (
              <div className="reset-success">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>
                </svg>
                <p>تم إرسال رابط الاستعادة إلى بريدك الإلكتروني</p>
                <p className="reset-sub">تحقق من صندوق الوارد أو Spam</p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 14, color: 'var(--c-gray-500)' }}>
                  أدخلي بريدك الإلكتروني وسنرسل لك رابط لإعادة تعيين كلمة المرور
                </p>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">البريد الإلكتروني</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="example@domain.com"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    dir="ltr"
                  />
                </div>
                {resetError && <p style={{ fontSize: 13, color: '#ef4444' }}>{resetError}</p>}
                <button
                  className="btn-auth"
                  disabled={resetSending || !resetEmail.trim()}
                  onClick={async () => {
                    setResetSending(true)
                    setResetError('')
                    try {
                      await resetPassword(resetEmail.trim())
                      setResetDone(true)
                    } catch {
                      setResetError('حدث خطأ، تأكدي من البريد الإلكتروني وحاولي مجدداً')
                    } finally {
                      setResetSending(false)
                    }
                  }}
                >
                  {resetSending ? <><span className="btn-spinner" />جاري الإرسال...</> : 'إرسال رابط الاستعادة'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
