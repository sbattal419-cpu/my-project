import { type FormEvent, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { signUp } from '../lib/auth'
import { useAuth } from '../context/AuthContext'

function translateError(msg: string): string {
  if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('already exists')) {
    return 'هذا البريد الإلكتروني مسجل مسبقاً، يرجى تسجيل الدخول'
  }
  if (msg.includes('Password should be at least')) return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
  if (msg.includes('Unable to validate email') || msg.includes('invalid email')) return 'صيغة البريد الإلكتروني غير صحيحة'
  if (msg.includes('Too many requests')) return 'محاولات كثيرة جداً، يرجى الانتظار قليلاً'
  return 'حدث خطأ، يرجى المحاولة مرة أخرى'
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) navigate('/', { replace: true })
  }, [user, loading, navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('يرجى إدخال الاسم الكامل'); return }
    if (!email.trim()) { setError('يرجى إدخال البريد الإلكتروني'); return }
    if (password.length < 8) { setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return }
    if (password !== confirm) { setError('كلمتا المرور غير متطابقتين، يرجى التحقق'); return }

    setSubmitting(true)
    try {
      await signUp(email.trim(), password, name.trim())
      setSuccess(true)
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

        {success ? (
          <motion.div
            className="welcome-card"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' as const }}
          >
            <div className="welcome-confetti">
              {['🎉', '✨', '🌟', '🎊', '💫'].map((e, i) => (
                <motion.span
                  key={i}
                  className="welcome-confetti-item"
                  initial={{ opacity: 0, y: 0, x: 0 }}
                  animate={{ opacity: [0, 1, 0], y: -40, x: (i - 2) * 18 }}
                  transition={{ delay: i * 0.1, duration: 1.2, ease: 'easeOut' as const }}
                >{e}</motion.span>
              ))}
            </div>

            <div className="welcome-avatar">
              {name.trim()[0]?.toUpperCase() ?? '؟'}
            </div>

            <h2 className="welcome-title">أهلاً وسهلاً{name.trim() ? `، ${name.trim().split(' ')[0]}!` : '!'}</h2>
            <p className="welcome-subtitle">انضممت إلى منصة إدارة الحقوق الملكية والفكرية</p>

            <ul className="welcome-features">
              <li>
                <span className="welcome-feat-icon">🔐</span>
                سجّل حقوقك الفكرية على البلوكتشين
              </li>
              <li>
                <span className="welcome-feat-icon">📜</span>
                احصل على شهادات رقمية موثّقة
              </li>
              <li>
                <span className="welcome-feat-icon">🔍</span>
                تحقق من أي حق مسجّل بسهولة
              </li>
            </ul>

            <p className="welcome-email-note">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              تحقق من بريدك <strong>{email}</strong> لتأكيد الحساب
            </p>

            <button className="btn-auth" onClick={() => navigate('/login')}>
              ابدأ الآن
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
          </motion.div>
        ) : (
          <>
            <h1 className="auth-title">إنشاء حساب جديد</h1>
            <p className="auth-subtitle">انضم إلينا وابدأ بحماية حقوقك الفكرية</p>

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
                <label className="form-label" htmlFor="name">الاسم الكامل</label>
                <input
                  id="name"
                  type="text"
                  className="form-input"
                  placeholder="أحمد محمد العلي"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">البريد الإلكتروني</label>
                <input
                  id="reg-email"
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
                <label className="form-label" htmlFor="reg-password">كلمة المرور</label>
                <div className="input-password-wrap">
                  <input
                    id="reg-password"
                    type={showPwd ? 'text' : 'password'}
                    className="form-input"
                    placeholder="8 أحرف على الأقل"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
                    dir="ltr"
                  />
                  <button type="button" className="input-pwd-toggle" onClick={() => setShowPwd(v => !v)} aria-label="إظهار/إخفاء">
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

              <div className="form-group">
                <label className="form-label" htmlFor="confirm-password">تأكيد كلمة المرور</label>
                <div className="input-password-wrap">
                  <input
                    id="confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    className="form-input"
                    placeholder="أعد كتابة كلمة المرور"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    dir="ltr"
                  />
                  <button type="button" className="input-pwd-toggle" onClick={() => setShowConfirm(v => !v)} aria-label="إظهار/إخفاء">
                    {showConfirm ? (
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

              <button type="submit" className="btn-auth" disabled={submitting} style={{ marginTop: 4 }}>
                {submitting ? (
                  <><span className="btn-spinner" />جارٍ إنشاء الحساب...</>
                ) : 'إنشاء الحساب'}
              </button>
            </form>
          </>
        )}

        <p className="auth-switch">
          لديك حساب بالفعل؟{' '}
          <Link to="/login" className="auth-switch-link">تسجيل الدخول</Link>
        </p>
      </motion.div>
    </div>
  )
}
