import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { signOut } from '../lib/auth'
import { getUserNotifications, markNotificationsRead, type Notification } from '../lib/supabase-ipr'
import SettingsModal, { type SettingsSection } from './SettingsModal'

const ANCHOR_LINKS = [
  { href: '#services', tkKey: 'nav.services' },
  { href: '#how',      tkKey: 'nav.how' },
]

const PAGE_LINKS = [
  { to: '/register-right', tkKey: 'nav.register' },
  { to: '/verify',         tkKey: 'nav.verify' },
  { to: '/certificates',   tkKey: 'nav.certificates' },
]

export default function Navbar() {
  const [scrolled, setScrolled]             = useState(false)
  const [open, setOpen]                     = useState(false)
  const [profileOpen, setProfileOpen]       = useState(false)
  const [notifOpen, setNotifOpen]           = useState(false)
  const [notifs, setNotifs]                 = useState<Notification[]>([])
  const [settingsSection, setSettingsSection] = useState<SettingsSection | null>(null)

  const profileRef = useRef<HTMLDivElement>(null)
  const notifRef   = useRef<HTMLDivElement>(null)

  const { user }    = useAuth()
  const { t, lang } = useLang()
  const navigate    = useNavigate()

  const unread = notifs.filter(n => !n.is_read).length

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
      if (notifRef.current  && !notifRef.current.contains(e.target as Node))  setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!user) return
    getUserNotifications(user.id).then(setNotifs).catch(() => {})
  }, [user])

  const openNotifs = async () => {
    setNotifOpen(v => !v)
    setProfileOpen(false)
    if (!notifOpen && user && unread > 0) {
      await markNotificationsRead(user.id).catch(() => {})
      setNotifs(ns => ns.map(n => ({ ...n, is_read: true })))
    }
  }

  const openSettings = (section: SettingsSection) => {
    setSettingsSection(section)
    setProfileOpen(false)
  }

  const handleLogout = async () => {
    setProfileOpen(false)
    await signOut()
    navigate('/login', { replace: true })
  }

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const initials  = user?.email?.[0].toUpperCase() ?? '؟'

  return (
    <>
      {/* ── Settings Modal ── */}
      <AnimatePresence>
        {settingsSection && (
          <SettingsModal
            initialSection={settingsSection}
            onClose={() => setSettingsSection(null)}
          />
        )}
      </AnimatePresence>

      <nav className={`navbar${scrolled ? ' navbar-scrolled' : ''}`}>
        <div className="container navbar-inner">
          {/* Logo */}
          <Link to="/" className="navbar-logo" data-no-sound>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="navbar-logo-icon" aria-hidden="true">
              <defs>
                <linearGradient id="nl" x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#a78bfa"/>
                  <stop offset="100%" stopColor="#2563eb"/>
                </linearGradient>
              </defs>
              <path d="M20 2.5L36 9V21C36 30.5 20 38 20 38C20 38 4 30.5 4 21V9L20 2.5Z"
                fill="rgba(99,102,241,0.15)" stroke="url(#nl)" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M20 10L26.5 18.5L20 30L13.5 18.5Z"
                fill="rgba(99,102,241,0.12)" stroke="url(#nl)" strokeWidth="1.4" strokeLinejoin="round"/>
              <line x1="20" y1="18.5" x2="20" y2="30" stroke="url(#nl)" strokeWidth="1" strokeLinecap="round"/>
              <line x1="13.5" y1="18.5" x2="26.5" y2="18.5" stroke="url(#nl)" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span className="navbar-logo-name">
              {lang === 'ar' ? 'إدارة الحقوق الملكية والفكرية' : 'Intellectual Property Management'}
            </span>
          </Link>

          {/* Desktop links */}
          <ul className="navbar-links">
            <li><a href="#home" className="navbar-link">{t('nav.home')}</a></li>
            {ANCHOR_LINKS.map(l => (
              <li key={l.href}><a href={l.href} className="navbar-link">{t(l.tkKey)}</a></li>
            ))}
            <li className="navbar-divider" />
            {PAGE_LINKS.map(l => (
              <li key={l.to}><Link to={l.to} className="navbar-link navbar-link-page">{t(l.tkKey)}</Link></li>
            ))}
          </ul>

          <div className="navbar-actions">
            {/* Notification bell */}
            {user && (
              <div className="notif-wrap" ref={notifRef}>
                <button className="notif-btn" onClick={openNotifs} aria-label="الإشعارات">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
                </button>

                <AnimatePresence>
                  {notifOpen && (
                    <motion.div className="notif-dropdown"
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}>
                      <div className="notif-dd-header">
                        <span>{lang === 'ar' ? 'الإشعارات' : 'Notifications'}</span>
                        {notifs.length > 0 && <span className="notif-dd-count">{notifs.length}</span>}
                      </div>
                      <div className="notif-dd-list">
                        {notifs.length === 0 ? (
                          <p className="notif-empty">{lang === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}</p>
                        ) : notifs.map(n => (
                          <div key={n.id} className={`notif-item${n.is_read ? '' : ' notif-item-unread'} notif-item-${n.type}`}>
                            <span className="notif-item-icon">
                              {n.type === 'success' ? '✅' : n.type === 'error' ? '❌' : 'ℹ️'}
                            </span>
                            <div className="notif-item-body">
                              <p className="notif-item-title">{n.title}</p>
                              <p className="notif-item-msg">{n.message}</p>
                              <p className="notif-item-date">
                                {new Date(n.created_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Profile / Login */}
            {user ? (
              <div className="profile-wrap" ref={profileRef}>
                <button className="profile-btn"
                  onClick={() => { setProfileOpen(v => !v); setNotifOpen(false) }}
                  aria-label="الملف الشخصي">
                  {avatarUrl
                    ? <img src={avatarUrl} alt="" className="profile-avatar" />
                    : <span className="profile-initials">{initials}</span>}
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div className="profile-dropdown"
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}>

                      {/* Header */}
                      <div className="profile-dd-header">
                        <div className="profile-dd-avatar-wrap">
                          {avatarUrl
                            ? <img src={avatarUrl} alt="" className="profile-dd-avatar-img" />
                            : <span className="profile-dd-initials">{initials}</span>}
                        </div>
                        <span className="profile-dd-email">{user.email}</span>
                      </div>

                      <div className="profile-dd-divider" />

                      {/* Settings items */}
                      {([
                        { icon: '👤', key: 'profile',  label: t('set.profile')  },
                        { icon: '🔒', key: 'password', label: t('set.password') },
                        { icon: '🌐', key: 'language', label: t('set.language') },
                        { icon: '↗️', key: 'transfer', label: t('set.transfer') },
                      ] as { icon: string; key: SettingsSection; label: string }[]).map(item => (
                        <button key={item.key} className="profile-dd-item" onClick={() => openSettings(item.key)}>
                          <span style={{ fontSize: 14 }}>{item.icon}</span>
                          {item.label}
                        </button>
                      ))}

                      <div className="profile-dd-divider" />

                      <button className="profile-dd-item profile-dd-logout" onClick={handleLogout}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                          <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        {t('nav.logout')}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button className="btn-login" onClick={() => navigate('/login')}>{t('nav.login')}</button>
            )}

            <button className={`hamburger${open ? ' hamburger-open' : ''}`}
              onClick={() => setOpen(!open)} aria-label="القائمة">
              <span /><span /><span />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div className="mobile-menu"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <a href="#home" className="mobile-link" onClick={() => setOpen(false)}>{t('nav.home')}</a>
            {ANCHOR_LINKS.map(l => (
              <a key={l.href} href={l.href} className="mobile-link" onClick={() => setOpen(false)}>{t(l.tkKey)}</a>
            ))}
            <div className="mobile-divider" />
            {PAGE_LINKS.map(l => (
              <Link key={l.to} to={l.to} className="mobile-link mobile-link-page" onClick={() => setOpen(false)}>{t(l.tkKey)}</Link>
            ))}
            {user ? (
              <div className="mobile-profile-section">
                {avatarUrl && <img src={avatarUrl} alt="" className="mobile-profile-avatar" />}
                <span className="mobile-profile-email">{user.email}</span>
                <button className="btn-login mobile-login-btn" onClick={() => { openSettings('profile'); setOpen(false) }}>
                  {t('set.profile')}
                </button>
                <button className="btn-login mobile-login-btn" style={{ background: '#ef4444' }} onClick={handleLogout}>
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <button className="btn-login mobile-login-btn" onClick={() => navigate('/login')}>{t('nav.login')}</button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
