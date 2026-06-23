// ════════════════════════════════════════════════════════════════
// FILE: src/components/SettingsModal.tsx
// مودال الإعدادات — يحتوي 4 أقسام:
//   profile  → تعديل الاسم، الإيميل، الهاتف، الصورة
//   password → تغيير كلمة المرور
//   language → تبديل اللغة (عربي/إنجليزي)
//   transfer → نقل ملكية شهادة على البلوكشين
// يُفتح من: Navbar → قائمة المستخدم
// للتعديل: ابحث عن اسم القسم مثل: ProfileSection / PasswordSection
// ════════════════════════════════════════════════════════════════
import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { updateProfile, updatePassword, uploadAvatar, updateEmail, updatePhone } from '../lib/auth'
import { getUserCerts, type RightsRow } from '../lib/supabase-ipr'
import { transferCertOnChain } from '../lib/blockchain'
import { supabase } from '../lib/supabase'

export type SettingsSection = 'profile' | 'password' | 'language' | 'transfer'

interface Props {
  initialSection: SettingsSection
  onClose: () => void
}

const EASE = 'easeOut' as const

/* ─── ProfileSection ─────────────────────────────────────────────────────── */
function ProfileSection() {
  const { user } = useAuth()
  const { t } = useLang()
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined

  const [name, setName] = useState((user?.user_metadata?.full_name as string) ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState('')
  const [uploading, setUploading] = useState(false)

  // Email change
  const [showEmailEdit, setShowEmailEdit] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailSending, setEmailSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailErr, setEmailErr] = useState('')

  // Phone
  const [phone, setPhone] = useState((user?.user_metadata?.phone_number as string) ?? '')
  const [phoneSaving, setPhoneSaving] = useState(false)
  const [phoneSaved, setPhoneSaved] = useState(false)
  const [phoneErr, setPhoneErr] = useState('')

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true); setErr(''); setSaved(false)
    try {
      await updateProfile(name.trim())
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch { setErr(t('error')) }
    finally { setSaving(false) }
  }

  const handlePhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    try { await uploadAvatar(file, user.id) }
    catch { setErr(t('error')) }
    finally { setUploading(false); e.target.value = '' }
  }

  const handleEmailChange = async () => {
    if (!newEmail.trim()) return
    setEmailSending(true); setEmailErr('')
    try {
      await updateEmail(newEmail.trim())
      setEmailSent(true)
    } catch (e) { setEmailErr((e as Error).message || t('error')) }
    finally { setEmailSending(false) }
  }

  const handleSavePhone = async () => {
    setPhoneSaving(true); setPhoneErr('')
    try {
      await updatePhone(phone.trim())
      setPhoneSaved(true)
      setTimeout(() => setPhoneSaved(false), 2500)
    } catch (e) { setPhoneErr((e as Error).message || t('error')) }
    finally { setPhoneSaving(false) }
  }

  return (
    <div className="set-section">
      {/* Avatar */}
      <div className="set-avatar-row">
        <div className="set-avatar-circle">
          {avatarUrl
            ? <img src={avatarUrl} alt="" className="set-avatar-img" />
            : <span className="set-avatar-init">{user?.email?.[0].toUpperCase()}</span>}
          {uploading && <div className="set-avatar-overlay"><span className="btn-spinner" /></div>}
        </div>
        <label className="set-photo-label">
          <input type="file" accept="image/*" hidden onChange={handlePhoto} disabled={uploading} />
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          {t('set.photo')}
        </label>
      </div>

      {/* Name */}
      <div className="set-field">
        <label className="set-label">{t('pro.name')}</label>
        <input className="set-input" value={name} onChange={e => setName(e.target.value)} />
      </div>

      {/* Email */}
      <div className="set-field">
        <div className="set-label-row">
          <label className="set-label">{t('pro.email')}</label>
          {!showEmailEdit && !emailSent && (
            <button className="set-link-btn" onClick={() => { setShowEmailEdit(true); setEmailErr('') }}>
              {t('pro.email.change')}
            </button>
          )}
        </div>
        <input className="set-input set-input-readonly" value={user?.email ?? ''} readOnly />
        {showEmailEdit && !emailSent && (
          <div className="set-email-edit">
            <input
              className="set-input"
              type="email"
              placeholder={t('pro.email.new')}
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              dir="ltr"
            />
            {emailErr && <p className="set-error">{emailErr}</p>}
            <div className="set-email-actions">
              <button className="set-btn-sm set-btn-ghost" onClick={() => { setShowEmailEdit(false); setNewEmail(''); setEmailErr('') }}>
                {t('pro.email.cancel')}
              </button>
              <button className="set-btn-sm set-btn-primary" onClick={handleEmailChange} disabled={emailSending || !newEmail.trim()}>
                {emailSending ? <><span className="btn-spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /></> : t('pro.email.send')}
              </button>
            </div>
          </div>
        )}
        {emailSent && (
          <p className="set-success" style={{ fontSize: 12, marginTop: 6 }}>
            ✅ {t('pro.email.sent')}
          </p>
        )}
      </div>

      {/* Phone */}
      <div className="set-field">
        <label className="set-label">{t('pro.phone')}</label>
        <div className="set-phone-row">
          <input
            className="set-input"
            type="tel"
            placeholder={t('pro.phone.placeholder')}
            value={phone}
            onChange={e => setPhone(e.target.value)}
            dir="ltr"
          />
          <button
            className="set-btn-sm set-btn-primary"
            onClick={handleSavePhone}
            disabled={phoneSaving || !phone.trim()}
          >
            {phoneSaving
              ? <span className="btn-spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
              : phoneSaved ? '✓' : t('pro.save')}
          </button>
        </div>
        {phoneErr && <p className="set-error">{phoneErr}</p>}
      </div>

      {err && <p className="set-error">{err}</p>}

      <button className="set-btn-primary" onClick={handleSave} disabled={saving || !name.trim()}>
        {saving ? <><span className="btn-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />...</>
          : saved ? t('pro.saved') : t('pro.save')}
      </button>
    </div>
  )
}

/* ─── PasswordSection ────────────────────────────────────────────────────── */
function PasswordSection() {
  const { t } = useLang()
  const [pwd, setPwd] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')
  const [showPwd, setShowPwd] = useState(false)

  const handleSave = async () => {
    setErr('')
    if (pwd.length < 8) { setErr(t('pwd.min')); return }
    if (pwd !== confirm) { setErr(t('pwd.mismatch')); return }
    setSaving(true)
    try {
      await updatePassword(pwd)
      setDone(true); setPwd(''); setConfirm('')
      setTimeout(() => setDone(false), 3000)
    } catch { setErr(t('error')) }
    finally { setSaving(false) }
  }

  const Eye = ({ on }: { on: boolean }) => on ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  )

  return (
    <div className="set-section">
      <div className="set-field">
        <label className="set-label">{t('pwd.new')}</label>
        <div className="set-pwd-wrap">
          <input className="set-input" type={showPwd ? 'text' : 'password'} value={pwd}
            onChange={e => setPwd(e.target.value)} dir="ltr" />
          <button type="button" className="set-eye" onClick={() => setShowPwd(v => !v)}>
            <Eye on={showPwd} />
          </button>
        </div>
      </div>

      <div className="set-field">
        <label className="set-label">{t('pwd.confirm')}</label>
        <div className="set-pwd-wrap">
          <input className="set-input" type={showPwd ? 'text' : 'password'} value={confirm}
            onChange={e => setConfirm(e.target.value)} dir="ltr" />
        </div>
      </div>

      {err  && <p className="set-error">{err}</p>}
      {done && <p className="set-success">{t('pwd.done')}</p>}

      <button className="set-btn-primary" onClick={handleSave} disabled={saving || !pwd || !confirm}>
        {saving ? <><span className="btn-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />...</>
          : t('pwd.save')}
      </button>
    </div>
  )
}

/* ─── LanguageSection ────────────────────────────────────────────────────── */
function LanguageSection() {
  const { lang, toggle, t } = useLang()
  return (
    <div className="set-section">
      <p className="set-lang-label">{t('lang.current')}</p>
      <div className="set-lang-row">
        <button
          className={`set-lang-btn${lang === 'ar' ? ' set-lang-active' : ''}`}
          onClick={() => lang !== 'ar' && toggle()}
        >
          <span style={{ fontSize: 20 }}>🇸🇦</span>
          {t('lang.arabic')}
          {lang === 'ar' && <span className="set-lang-check">✓</span>}
        </button>
        <button
          className={`set-lang-btn${lang === 'en' ? ' set-lang-active' : ''}`}
          onClick={() => lang !== 'en' && toggle()}
        >
          <span style={{ fontSize: 20 }}>🇬🇧</span>
          {t('lang.english')}
          {lang === 'en' && <span className="set-lang-check">✓</span>}
        </button>
      </div>
    </div>
  )
}

/* ─── TransferSection ────────────────────────────────────────────────────── */
function TransferSection() {
  const { user } = useAuth()
  const { t } = useLang()
  const [rights, setRights] = useState<RightsRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState('')
  const [newWallet, setNewWallet] = useState('')
  const [transferring, setTransferring] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!user) return
    getUserCerts(user.id)
      .then(data => { setRights(data); if (data[0]) setSelectedId(data[0].cert_id) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const handleTransfer = async () => {
    if (!newWallet.trim() || !selectedId) return
    setErr(''); setTransferring(true)
    try {
      await transferCertOnChain(selectedId, newWallet.trim())
      await supabase.from('Rights').update({ wallet_address: newWallet.trim() }).eq('cert_id', selectedId)
      setDone(true); setNewWallet('')
      setTimeout(() => setDone(false), 3000)
    } catch (e) {
      setErr((e as Error).message?.includes('rejected') ? 'تم رفض المعاملة من المحفظة' : t('error'))
    } finally { setTransferring(false) }
  }

  if (loading) return <div className="set-section"><div className="bc-spinner" /></div>
  if (rights.length === 0) return <div className="set-section"><p className="set-empty">{t('tr.none')}</p></div>

  return (
    <div className="set-section">
      <div className="set-field">
        <label className="set-label">{t('tr.select')}</label>
        <select className="set-input set-select" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
          {rights.map(r => (
            <option key={r.cert_id} value={r.cert_id}>#{r.cert_id} — {r.title}</option>
          ))}
        </select>
      </div>

      <div className="set-field">
        <label className="set-label">{t('tr.wallet')}</label>
        <input className="set-input" dir="ltr" placeholder="0x..." value={newWallet}
          onChange={e => setNewWallet(e.target.value)} />
      </div>

      {err  && <p className="set-error">{err}</p>}
      {done && <p className="set-success">{t('tr.done')}</p>}

      <button className="set-btn-primary set-btn-danger" onClick={handleTransfer}
        disabled={transferring || !newWallet.trim() || !selectedId}>
        {transferring
          ? <><span className="btn-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />...</>
          : t('tr.btn')}
      </button>
    </div>
  )
}

/* ─── Main Modal ─────────────────────────────────────────────────────────── */
const MENU: { key: SettingsSection; icon: string; tkKey: string }[] = [
  { key: 'profile',  icon: '👤', tkKey: 'set.profile'  },
  { key: 'password', icon: '🔒', tkKey: 'set.password' },
  { key: 'language', icon: '🌐', tkKey: 'set.language' },
  { key: 'transfer', icon: '↗️', tkKey: 'set.transfer' },
]

export default function SettingsModal({ initialSection, onClose }: Props) {
  const [active, setActive] = useState<SettingsSection>(initialSection)
  const overlayRef = useRef<HTMLDivElement>(null)
  const { t, dir } = useLang()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="set-overlay" ref={overlayRef} onClick={e => { if (e.target === overlayRef.current) onClose() }}>
      <motion.div
        className="set-modal"
        style={{ direction: dir }}
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.22, ease: EASE }}
      >
        {/* Header */}
        <div className="set-modal-header">
          <h2 className="set-modal-title">{t('set.title')}</h2>
          <button className="set-close" onClick={onClose} aria-label="إغلاق">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="set-modal-body">
          {/* Sidebar */}
          <nav className="set-sidebar">
            {MENU.map(m => (
              <button
                key={m.key}
                className={`set-menu-item${active === m.key ? ' set-menu-active' : ''}`}
                onClick={() => setActive(m.key)}
              >
                <span className="set-menu-icon">{m.icon}</span>
                <span>{t(m.tkKey)}</span>
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="set-content">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, x: dir === 'rtl' ? -12 : 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir === 'rtl' ? 12 : -12 }}
                transition={{ duration: 0.18, ease: EASE }}
              >
                <h3 className="set-section-title">
                  {t(MENU.find(m => m.key === active)?.tkKey ?? '')}
                </h3>
                {active === 'profile'  && <ProfileSection />}
                {active === 'password' && <PasswordSection />}
                {active === 'language' && <LanguageSection />}
                {active === 'transfer' && <TransferSection />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
