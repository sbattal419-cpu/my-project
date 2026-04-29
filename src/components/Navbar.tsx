import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { signOut, uploadAvatar } from '../lib/auth'

const ANCHOR_LINKS = [
  { href: '#services', label: 'الخدمات' },
  { href: '#how', label: 'كيف يعمل' },
]

const PAGE_LINKS = [
  { to: '/register-right', label: 'تسجيل حق' },
  { to: '/verify', label: 'التحقق' },
  { to: '/certificates', label: 'شهاداتي' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const handleLogout = async () => {
    setProfileOpen(false)
    await signOut()
    navigate('/login', { replace: true })
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    try {
      await uploadAvatar(file, user.id)
    } catch (err) {
      console.error('فشل رفع الصورة:', err)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const initials = user?.email?.[0].toUpperCase() ?? '؟'

  return (
    <>
      <nav className={`navbar${scrolled ? ' navbar-scrolled' : ''}`}>
        <div className="container navbar-inner">
          <Link to="/" className="navbar-logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="navbar-logo-icon" aria-hidden="true">
              <defs>
                <linearGradient id="nl" x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#a78bfa"/>
                  <stop offset="100%" stopColor="#2563eb"/>
                </linearGradient>
              </defs>
              {/* Shield */}
              <path d="M20 2.5L36 9V21C36 30.5 20 38 20 38C20 38 4 30.5 4 21V9L20 2.5Z"
                fill="rgba(99,102,241,0.15)" stroke="url(#nl)" strokeWidth="1.5" strokeLinejoin="round"/>
              {/* Pen nib — intellectual/creative work */}
              <path d="M20 10L26.5 18.5L20 30L13.5 18.5Z"
                fill="rgba(99,102,241,0.12)" stroke="url(#nl)" strokeWidth="1.4" strokeLinejoin="round"/>
              {/* Nib slit */}
              <line x1="20" y1="18.5" x2="20" y2="30" stroke="url(#nl)" strokeWidth="1" strokeLinecap="round"/>
              {/* Pen shoulder line */}
              <line x1="13.5" y1="18.5" x2="26.5" y2="18.5" stroke="url(#nl)" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span className="navbar-logo-name">إدارة الحقوق الملكية والفكرية</span>
          </Link>

          <ul className="navbar-links">
            <li><a href="#home" className="navbar-link">الرئيسية</a></li>
            {ANCHOR_LINKS.map(l => (
              <li key={l.href}>
                <a href={l.href} className="navbar-link">{l.label}</a>
              </li>
            ))}
            <li className="navbar-divider" />
            {PAGE_LINKS.map(l => (
              <li key={l.to}>
                <Link to={l.to} className="navbar-link navbar-link-page">{l.label}</Link>
              </li>
            ))}
          </ul>

          <div className="navbar-actions">
            {user ? (
              <div className="profile-wrap" ref={profileRef}>
                <button
                  className="profile-btn"
                  onClick={() => setProfileOpen(v => !v)}
                  aria-label="الملف الشخصي"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="صورتك الشخصية" className="profile-avatar" />
                  ) : (
                    <span className="profile-initials">{initials}</span>
                  )}
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      className="profile-dropdown"
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className="profile-dd-header">
                        <div className="profile-dd-avatar-wrap">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="" className="profile-dd-avatar-img" />
                          ) : (
                            <span className="profile-dd-initials">{initials}</span>
                          )}
                        </div>
                        <span className="profile-dd-email">{user.email}</span>
                      </div>

                      <div className="profile-dd-divider" />

                      <label className="profile-dd-item profile-dd-upload">
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={handleAvatarChange}
                          disabled={uploading}
                        />
                        {uploading ? (
                          <>
                            <span className="btn-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                            جارٍ الرفع...
                          </>
                        ) : (
                          <>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            تغيير الصورة الشخصية
                          </>
                        )}
                      </label>

                      <div className="profile-dd-divider" />

                      <button className="profile-dd-item profile-dd-logout" onClick={handleLogout}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        تسجيل الخروج
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button className="btn-login" onClick={() => navigate('/login')}>تسجيل الدخول</button>
            )}

            <button
              className={`hamburger${open ? ' hamburger-open' : ''}`}
              onClick={() => setOpen(!open)}
              aria-label="القائمة"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <a href="#home" className="mobile-link" onClick={() => setOpen(false)}>الرئيسية</a>
            {ANCHOR_LINKS.map(l => (
              <a key={l.href} href={l.href} className="mobile-link" onClick={() => setOpen(false)}>
                {l.label}
              </a>
            ))}
            <div className="mobile-divider" />
            {PAGE_LINKS.map(l => (
              <Link key={l.to} to={l.to} className="mobile-link mobile-link-page" onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            {user ? (
              <div className="mobile-profile-section">
                {avatarUrl && (
                  <img src={avatarUrl} alt="" className="mobile-profile-avatar" />
                )}
                <span className="mobile-profile-email">{user.email}</span>
                <label className="mobile-profile-upload">
                  <input type="file" accept="image/*" hidden onChange={handleAvatarChange} disabled={uploading} />
                  {uploading ? 'جارٍ الرفع...' : 'تغيير الصورة'}
                </label>
                <button className="btn-login mobile-login-btn" style={{ background: '#ef4444' }} onClick={handleLogout}>
                  تسجيل الخروج
                </button>
              </div>
            ) : (
              <button className="btn-login mobile-login-btn" onClick={() => navigate('/login')}>
                تسجيل الدخول
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
