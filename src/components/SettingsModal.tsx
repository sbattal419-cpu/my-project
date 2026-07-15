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
import { getUserCerts, transferCertificateAndSync, type RightsRow } from '../lib/supabase-ipr'

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
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined          // رابط الصورة من Supabase Storage

  // ── حالة الاسم والصورة ──
  const [name, setName] = useState((user?.user_metadata?.full_name as string) ?? '') // الاسم الحالي كقيمة ابتدائية
  const [saving, setSaving] = useState(false)                                       // جارٍ حفظ الاسم
  const [saved, setSaved] = useState(false)                                         // true = ظهر بعد الحفظ لـ 2.5 ثانية
  const [err, setErr] = useState('')                                                // رسالة خطأ عامة للقسم
  const [uploading, setUploading] = useState(false)                                 // جارٍ رفع الصورة

  // ── حالة تغيير البريد الإلكتروني ──
  const [showEmailEdit, setShowEmailEdit] = useState(false)                         // إظهار/إخفاء حقل البريد الجديد
  const [newEmail, setNewEmail] = useState('')                                      // البريد الجديد الذي يكتبه المستخدم
  const [emailSending, setEmailSending] = useState(false)                           // جارٍ إرسال رابط التأكيد
  const [emailSent, setEmailSent] = useState(false)                                 // true = أُرسل الرابط بنجاح
  const [emailErr, setEmailErr] = useState('')                                      // رسالة خطأ البريد

  // ── حالة رقم الهاتف ──
  const [phone, setPhone] = useState((user?.user_metadata?.phone_number as string) ?? '') // رقم الهاتف الحالي
  const [phoneSaving, setPhoneSaving] = useState(false)                             // جارٍ حفظ الهاتف
  const [phoneSaved, setPhoneSaved] = useState(false)                               // true = ظهرت علامة ✓ لـ 2.5 ثانية
  const [phoneErr, setPhoneErr] = useState('')                                      // رسالة خطأ الهاتف

  // ── handleSave — حفظ الاسم الكامل ───────────────────────────────────────────
  const handleSave = async () => {
    if (!name.trim()) return                                                        // تجاهل الحفظ إذا كان الاسم فارغاً
    setSaving(true); setErr(''); setSaved(false)
    try {
      await updateProfile(name.trim())                                              // يحدّث user_metadata.full_name في Supabase Auth
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)                                       // أخفِ رسالة النجاح بعد 2.5 ثانية
    } catch { setErr(t('error')) }
    finally { setSaving(false) }
  }

  // ── handlePhoto — رفع صورة شخصية جديدة ──────────────────────────────────────
  const handlePhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    try { await uploadAvatar(file, user.id) }                                       // يرفع لـ avatars/{userId}.{ext} في Storage
    catch { setErr(t('error')) }
    finally { setUploading(false); e.target.value = '' }                            // صفّر input للسماح باختيار نفس الملف
  }

  // ── handleEmailChange — إرسال رابط تأكيد للبريد الجديد ──────────────────────
  // Supabase يُرسل بريد تأكيد — لا يتغير البريد حتى ينقر المستخدم الرابط
  const handleEmailChange = async () => {
    if (!newEmail.trim()) return
    setEmailSending(true); setEmailErr('')
    try {
      await updateEmail(newEmail.trim())                                            // يطلب تغيير البريد في Supabase Auth
      setEmailSent(true)                                                            // أظهر رسالة "تم الإرسال"
    } catch (e) { setEmailErr((e as Error).message || t('error')) }
    finally { setEmailSending(false) }
  }

  // ── handleSavePhone — حفظ رقم الهاتف ────────────────────────────────────────
  const handleSavePhone = async () => {
    setPhoneSaving(true); setPhoneErr('')
    try {
      await updatePhone(phone.trim())                                               // يحدّث user_metadata.phone_number
      setPhoneSaved(true)
      setTimeout(() => setPhoneSaved(false), 2500)                                  // أخفِ علامة ✓ بعد 2.5 ثانية
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
  const [rights, setRights] = useState<RightsRow[]>([])                            // قائمة شهادات المستخدم من Supabase
  const [loading, setLoading] = useState(true)                                      // جارٍ تحميل الشهادات
  const [selectedId, setSelectedId] = useState('')                                  // cert_id الشهادة المختارة للنقل
  const [newWallet, setNewWallet] = useState('')                                    // عنوان محفظة المالك الجديد (0x...)
  const [transferring, setTransferring] = useState(false)                           // جارٍ تنفيذ عملية النقل
  const [done, setDone] = useState(false)                                           // true = ظهرت رسالة النجاح
  const [err, setErr] = useState('')                                                // رسالة خطأ النقل

  // اجلب شهادات المستخدم فور تحميل القسم
  useEffect(() => {
    if (!user) return
    getUserCerts(user.id)
      .then(data => {
        setRights(data)
        if (data[0]) setSelectedId(data[0].cert_id)                                // اختر الشهادة الأولى تلقائياً
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  // ── handleTransfer — نقل ملكية الشهادة ──────────────────────────────────────
  // transferCertificateAndSync (src/lib/supabase-ipr.ts): بلوكشين + مزامنة Supabase معاً
  // نفس نقطة الدخول المستخدمة من CertificatesPage — منطق موحّد بمكان واحد
  const handleTransfer = async () => {
    if (!newWallet.trim() || !selectedId) return                                    // تحقق أن الحقول غير فارغة
    setErr(''); setTransferring(true)
    try {
      await transferCertificateAndSync(selectedId, newWallet.trim())
      setDone(true); setNewWallet('')
      setTimeout(() => setDone(false), 3000)                                        // أخفِ رسالة النجاح بعد 3 ثوانٍ
    } catch (e) {
      // "rejected" = المستخدم رفض التوقيع في MetaMask
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
// MENU — عناصر القائمة الجانبية: key=اسم القسم، icon=الرمز، tkKey=مفتاح الترجمة
const MENU: { key: SettingsSection; icon: string; tkKey: string }[] = [
  { key: 'profile',  icon: '👤', tkKey: 'set.profile'  },  // الملف الشخصي
  { key: 'password', icon: '🔒', tkKey: 'set.password' },  // كلمة المرور
  { key: 'language', icon: '🌐', tkKey: 'set.language' },  // اللغة
  { key: 'transfer', icon: '↗️', tkKey: 'set.transfer' },  // نقل الملكية
]

export default function SettingsModal({ initialSection, onClose }: Props) {
  const [active, setActive] = useState<SettingsSection>(initialSection)            // القسم النشط حالياً في القائمة
  const overlayRef = useRef<HTMLDivElement>(null)                                  // مرجع للخلفية الداكنة
  const { t, dir } = useLang()                                                     // dir = 'rtl' أو 'ltr' يُطبّق على المودال

  // إغلاق المودال بمفتاح Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)                    // إلغاء الاستماع عند إغلاق المودال
  }, [onClose])

  return (
    // النقر على الخلفية الداكنة (خارج المودال) يغلقه
    <div className="set-overlay" ref={overlayRef} onClick={e => { if (e.target === overlayRef.current) onClose() }}>
      <motion.div
        className="set-modal"
        style={{ direction: dir }}                                                  // تطبيق اتجاه النص (RTL/LTR) على المودال
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.22, ease: EASE }}
      >
        {/* ── Header ── */}
        <div className="set-modal-header">
          <h2 className="set-modal-title">{t('set.title')}</h2>
          <button className="set-close" onClick={onClose} aria-label="إغلاق">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="set-modal-body">
          {/* ── Sidebar — القائمة الجانبية ── */}
          <nav className="set-sidebar">
            {MENU.map(m => (
              <button
                key={m.key}
                className={`set-menu-item${active === m.key ? ' set-menu-active' : ''}`} // تمييز القسم النشط
                onClick={() => setActive(m.key)}                                    // تبديل القسم عند النقر
              >
                <span className="set-menu-icon">{m.icon}</span>
                <span>{t(m.tkKey)}</span>
              </button>
            ))}
          </nav>

          {/* ── Content — محتوى القسم النشط ── */}
          <div className="set-content">
            {/* AnimatePresence mode="wait" ينتظر خروج القسم القديم قبل دخول الجديد */}
            <AnimatePresence mode="wait">
              <motion.div
                key={active}                                                        // تغيير key يُطلق الأنيميشن من جديد
                initial={{ opacity: 0, x: dir === 'rtl' ? -12 : 12 }}             // دخول من اليسار في RTL، من اليمين في LTR
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir === 'rtl' ? 12 : -12 }}                // خروج معاكس لاتجاه الدخول
                transition={{ duration: 0.18, ease: EASE }}
              >
                <h3 className="set-section-title">
                  {t(MENU.find(m => m.key === active)?.tkKey ?? '')}               // عنوان القسم النشط
                </h3>
                {/* عرض المكوّن المقابل للقسم النشط */}
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
