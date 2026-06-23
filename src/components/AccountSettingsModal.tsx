// ════════════════════════════════════════════════════════════════
// FILE: src/components/AccountSettingsModal.tsx
// مودال إعدادات الحساب الشامل — يفتح من دائرة الملف الشخصي في Navbar
// الأقسام:
//   1. التحقق بكلمة المرور الحالية (مطلوب قبل أي تعديل)
//   2. تغيير الصورة الشخصية (uploadAvatar)
//   3. تعديل الاسم (updateProfile)
//   4. تغيير البريد الإلكتروني (updateEmail)
//   5. تغيير كلمة المرور (updatePassword)
//   6. التحقق من الهوية KYC (submitKYC / getKYCStatus)
// للتعديل: ابحث عن اسم القسم مثل: Avatar / Name / Email / Password / KYC
// ════════════════════════════════════════════════════════════════
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { uploadAvatar, updateProfile, updateEmail, updatePassword, verifyCurrentPassword, submitKYC, getKYCStatus } from '../lib/auth'

interface Props {
  open: boolean
  onClose: () => void
}

type SectionStatus = { loading: boolean; error: string; success: string }
const idle = (): SectionStatus => ({ loading: false, error: '', success: '' })

const EyeIcon = ({ visible }: { visible: boolean }) => visible ? (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
) : (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
)

export default function AccountSettingsModal({ open, onClose }: Props) {
  const { user } = useAuth()                                                         // بيانات المستخدم الحالي من Supabase Auth

  // ── قسم التحقق بكلمة المرور — بوابة أمان قبل أي تعديل ─────────────────────
  const [currentPwd, setCurrentPwd] = useState('')                                  // كلمة المرور الحالية يكتبها المستخدم
  const [showCurrentPwd, setShowCurrentPwd] = useState(false)                       // إظهار/إخفاء كلمة المرور
  const [isVerified, setIsVerified] = useState(false)                               // true = بوابة مفتوحة، false = مقفّلة
  const [verifyStatus, setVerifyStatus] = useState<SectionStatus>(idle())           // حالة تحميل/خطأ/نجاح لخطوة التحقق

  // ── قسم الصورة الشخصية ─────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null)                               // مرجع لـ <input type="file"> المخفي — نضغطه برمجياً
  const [avatarStatus, setAvatarStatus] = useState<SectionStatus>(idle())           // حالة رفع الصورة لـ Supabase Storage

  // ── قسم الاسم ──────────────────────────────────────────────────────────────
  const [name, setName] = useState('')                                              // الاسم الكامل الذي يكتبه المستخدم
  const [nameStatus, setNameStatus] = useState<SectionStatus>(idle())               // حالة حفظ الاسم

  // ── قسم البريد الإلكتروني ──────────────────────────────────────────────────
  const [email, setEmail] = useState('')                                            // البريد الجديد المطلوب تغييره
  const [emailStatus, setEmailStatus] = useState<SectionStatus>(idle())             // حالة تحديث البريد

  // ── قسم KYC — التحقق من الهوية الوطنية ────────────────────────────────────
  const [kycNationalId, setKycNationalId] = useState('')                            // رقم الهوية الوطنية
  const [kycFile, setKycFile] = useState<File | null>(null)                        // ملف صورة الهوية المختار
  const [kycFileName, setKycFileName] = useState('')                               // اسم الملف للعرض في الواجهة فقط
  const [kycStatus, setKycStatus] = useState<{ national_id: string | null; kyc_status: string | null; kyc_note: string | null; id_document_url: string | null } | null>(null) // بيانات KYC الحالية من جدول profiles
  const [kycSectionStatus, setKycSectionStatus] = useState<SectionStatus>(idle())   // حالة إرسال طلب KYC
  const kycFileRef = useRef<HTMLInputElement>(null)                                 // مرجع لـ input ملف الهوية

  // ── قسم كلمة المرور الجديدة ─────────────────────────────────────────────────
  const [newPwd, setNewPwd] = useState('')                                          // كلمة المرور الجديدة
  const [confirmPwd, setConfirmPwd] = useState('')                                  // تأكيد كلمة المرور (يجب أن تطابق newPwd)
  const [showNewPwd, setShowNewPwd] = useState(false)                               // إظهار/إخفاء كلمة المرور الجديدة
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)                       // إظهار/إخفاء حقل التأكيد
  const [pwdStatus, setPwdStatus] = useState<SectionStatus>(idle())                 // حالة تغيير كلمة المرور

  // ── useEffect: إعادة ضبط كل الحالة عند فتح المودال ─────────────────────────
  // يُشغَّل عند كل تغيير في قيمة open (فتح أو إغلاق)
  // يضمن أن المودال يبدأ نظيفاً بلا بيانات من الفتحة السابقة
  useEffect(() => {
    if (open && user) {
      setName((user.user_metadata?.full_name as string) ?? '')                      // ابدأ بالاسم الحالي من Supabase metadata
      setEmail(user.email ?? '')                                                    // ابدأ بالبريد الحالي
      setCurrentPwd('')                                                             // امسح حقل كلمة المرور دائماً لأسباب أمنية
      setIsVerified(false)                                                          // أعد قفل البوابة الأمنية
      setVerifyStatus(idle())                                                        // صفّر حالة التحقق
      setNameStatus(idle())                                                          // صفّر حالات كل الأقسام
      setEmailStatus(idle())
      setPwdStatus(idle())
      setAvatarStatus(idle())
      setNewPwd('')
      setConfirmPwd('')
      setKycNationalId('')
      setKycFile(null)
      setKycFileName('')
      setKycSectionStatus(idle())
      getKYCStatus().then(s => setKycStatus(s))                                     // اجلب أحدث حالة KYC من قاعدة البيانات
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── useEffect: مزامنة الاسم بعد updateProfile ────────────────────────────────
  // بعد الحفظ الناجح تتغير user.user_metadata وتُطلق هذا الـ effect
  // الشرط prev === '' يمنع الكتابة فوق ما يكتبه المستخدم حالياً
  useEffect(() => {
    if (user && open) {
      setName(prev => {
        const fresh = (user.user_metadata?.full_name as string) ?? ''
        return prev === '' ? fresh : prev                                            // لا تستبدل ما يكتبه المستخدم
      })
    }
  }, [user, open])

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined          // رابط الصورة من Supabase Storage
  const initials = (user?.user_metadata?.full_name as string)?.[0]?.toUpperCase()  // أول حرف من الاسم للصورة البديلة
    ?? user?.email?.[0]?.toUpperCase() ?? '؟'

  // ── handleVerify — التحقق من كلمة المرور الحالية ──────────────────────────
  // يستدعي verifyCurrentPassword (re-login مؤقت) → يفتح البوابة الأمنية
  const handleVerify = async () => {
    if (!currentPwd) { setVerifyStatus({ loading: false, error: 'يرجى إدخال كلمة المرور الحالية', success: '' }); return }
    setVerifyStatus({ loading: true, error: '', success: '' })
    try {
      await verifyCurrentPassword(user!.email!, currentPwd)                        // يُجري signInWithPassword للتحقق
      setIsVerified(true)                                                           // افتح البوابة الأمنية
      setVerifyStatus({ loading: false, error: '', success: 'تم التحقق من هويتك' })
    } catch (err) {
      setIsVerified(false)                                                          // ابقِ البوابة مقفّلة عند الفشل
      setVerifyStatus({ loading: false, error: (err as Error).message, success: '' })
    }
  }

  // ── withVerify — حارس: يمنع تشغيل أي معالج قبل التحقق ─────────────────────
  // كل معالجات الحفظ تمر عبر هذه الوظيفة أولاً
  const withVerify = async (action: () => Promise<void>, setStatus: (s: SectionStatus) => void) => {
    if (!isVerified) {
      setStatus({ loading: false, error: 'يجب التحقق من كلمة المرور الحالية أولاً', success: '' })
      return                                                                        // أوقف التنفيذ إذا لم يتحقق المستخدم
    }
    await action()                                                                  // نفّذ الإجراء الفعلي
  }

  // ── handleAvatarChange — رفع صورة شخصية جديدة ──────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (!isVerified) { setAvatarStatus({ loading: false, error: 'يجب التحقق من كلمة المرور الحالية أولاً', success: '' }); e.target.value = ''; return }
    setAvatarStatus({ loading: true, error: '', success: '' })
    try {
      await uploadAvatar(file, user.id)                                             // ارفع إلى avatars/{userId}.{ext} في Supabase Storage
      setAvatarStatus({ loading: false, error: '', success: 'تم تحديث الصورة بنجاح' })
    } catch {
      setAvatarStatus({ loading: false, error: 'فشل رفع الصورة، حاول مجدداً', success: '' })
    } finally {
      e.target.value = ''                                                           // صفّر الـ input حتى يمكن اختيار نفس الملف مجدداً
    }
  }

  // ── handleSaveName — حفظ الاسم الجديد ──────────────────────────────────────
  // يمر عبر withVerify → يستدعي updateProfile (يحدّث user_metadata.full_name)
  const handleSaveName = () => withVerify(async () => {
    if (!name.trim()) { setNameStatus({ loading: false, error: 'يرجى إدخال الاسم', success: '' }); return }
    setNameStatus({ loading: true, error: '', success: '' })
    try {
      await updateProfile(name.trim())                                              // يحدّث user_metadata في Supabase Auth
      setNameStatus({ loading: false, error: '', success: 'تم تحديث الاسم بنجاح' })
    } catch {
      setNameStatus({ loading: false, error: 'فشل تحديث الاسم، حاول مجدداً', success: '' })
    }
  }, setNameStatus)

  // ── handleSaveEmail — تحديث البريد الإلكتروني ──────────────────────────────
  // Supabase يرسل رابط تأكيد للبريد الجديد — لا يتغير حتى ينقر المستخدم الرابط
  const handleSaveEmail = () => withVerify(async () => {
    if (!email.trim()) { setEmailStatus({ loading: false, error: 'يرجى إدخال البريد الإلكتروني', success: '' }); return }
    if (email === user?.email) { setEmailStatus({ loading: false, error: 'هذا هو بريدك الحالي', success: '' }); return } // تحقق أن البريد مختلف
    setEmailStatus({ loading: true, error: '', success: '' })
    try {
      await updateEmail(email.trim())                                               // يُرسل رابط تأكيد للبريد الجديد
      setEmailStatus({ loading: false, error: '', success: 'تم إرسال رابط التأكيد إلى بريدك الجديد' })
    } catch {
      setEmailStatus({ loading: false, error: 'فشل تحديث البريد الإلكتروني، حاول مجدداً', success: '' })
    }
  }, setEmailStatus)

  // ── handleKYCFileChange — اختيار ملف الهوية ────────────────────────────────
  const handleKYCFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setKycFile(file)                                                                // احفظ كائن File للرفع لاحقاً
    setKycFileName(file.name)                                                       // احفظ الاسم للعرض في الواجهة
    e.target.value = ''                                                             // صفّر الـ input للسماح باختيار نفس الملف
  }

  // ── handleSubmitKYC — إرسال طلب التحقق من الهوية ───────────────────────────
  // الخطوات:
  // 1. التحقق من الحقول (رقم الهوية + الملف)
  // 2. submitKYC → يرفع الملف لـ Storage ويحدّث جدول profiles
  // 3. تحديث kycStatus محلياً لعرض حالة "قيد المراجعة" فوراً
  const handleSubmitKYC = async () => {
    if (!kycNationalId.trim()) { setKycSectionStatus({ loading: false, error: 'يرجى إدخال رقم الهوية الوطنية', success: '' }); return }
    if (!kycFile) { setKycSectionStatus({ loading: false, error: 'يرجى رفع صورة بطاقة الهوية', success: '' }); return }
    setKycSectionStatus({ loading: true, error: '', success: '' })
    try {
      await submitKYC(kycNationalId, kycFile)                                       // رفع الملف + تحديث profiles في Supabase
      setKycStatus({ national_id: kycNationalId, kyc_status: 'pending', kyc_note: null, id_document_url: null }) // تحديث محلي بلا انتظار
      setKycSectionStatus({ loading: false, error: '', success: 'تم إرسال بيانات الهوية، في انتظار مراجعة الإدارة' })
      setKycNationalId('')                                                           // نظّف الحقول بعد الإرسال الناجح
      setKycFile(null)
      setKycFileName('')
    } catch {
      setKycSectionStatus({ loading: false, error: 'حدث خطأ أثناء الإرسال، يرجى المحاولة مرة أخرى', success: '' })
    }
  }

  // ── handleSavePassword — تغيير كلمة المرور ─────────────────────────────────
  // يمر عبر withVerify → يتحقق من الحد الأدنى والتطابق → يستدعي updatePassword
  const handleSavePassword = () => withVerify(async () => {
    if (newPwd.length < 8) { setPwdStatus({ loading: false, error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل', success: '' }); return }
    if (newPwd !== confirmPwd) { setPwdStatus({ loading: false, error: 'كلمتا المرور غير متطابقتين', success: '' }); return }
    setPwdStatus({ loading: true, error: '', success: '' })
    try {
      await updatePassword(newPwd)                                                  // يُحدّث كلمة المرور في Supabase Auth
      setPwdStatus({ loading: false, error: '', success: 'تم تغيير كلمة المرور بنجاح' })
      setNewPwd('')                                                                 // نظّف الحقول بعد النجاح
      setConfirmPwd('')
    } catch {
      setPwdStatus({ loading: false, error: 'فشل تغيير كلمة المرور، حاول مجدداً', success: '' })
    }
  }, setPwdStatus)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <div className="account-modal-container">
            <motion.div
              className="account-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className="account-modal-header">
                <h2 className="account-modal-title">إعدادات الحساب</h2>
                <button className="account-modal-close" onClick={onClose} aria-label="إغلاق">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Scrollable body */}
              <div className="account-modal-body">

                {/* ── Verify Identity ── */}
                <div className={`account-verify-banner${isVerified ? ' account-verify-banner-ok' : ''}`}>
                  {isVerified ? (
                    <div className="account-verify-ok">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      تم التحقق من هويتك — يمكنك تعديل بياناتك
                    </div>
                  ) : (
                    <>
                      <p className="account-verify-label">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        أدخل كلمة مرورك الحالية للتحقق من هويتك
                      </p>
                      <div className="account-verify-row">
                        <div className="account-pwd-wrap" style={{ flex: 1 }}>
                          <input
                            type={showCurrentPwd ? 'text' : 'password'}
                            className="account-input"
                            placeholder="كلمة المرور الحالية"
                            value={currentPwd}
                            onChange={e => { setCurrentPwd(e.target.value); setVerifyStatus(idle()) }}
                            onKeyDown={e => e.key === 'Enter' && handleVerify()}
                            dir="ltr"
                          />
                          <button type="button" className="account-eye-btn" onClick={() => setShowCurrentPwd(v => !v)}>
                            <EyeIcon visible={showCurrentPwd} />
                          </button>
                        </div>
                        <button
                          className="account-save-btn"
                          onClick={handleVerify}
                          disabled={verifyStatus.loading}
                        >
                          {verifyStatus.loading
                            ? <span className="btn-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                            : 'تحقق'}
                        </button>
                      </div>
                      {verifyStatus.error && <p className="account-msg account-msg-error" style={{ marginTop: 8 }}>{verifyStatus.error}</p>}
                    </>
                  )}
                </div>

                {/* ── Avatar ── */}
                <div className="account-section">
                  <div className="account-section-title">الصورة الشخصية</div>
                  <div className="account-avatar-section">
                    <div
                      className={`account-avatar-wrap${!isVerified ? ' account-avatar-locked' : ''}`}
                      onClick={() => !avatarStatus.loading && fileInputRef.current?.click()}
                      title={isVerified ? 'اضغط لتغيير الصورة' : 'تحقق من هويتك أولاً'}
                    >
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="صورتك الشخصية" className="account-avatar-img" />
                      ) : (
                        <span className="account-avatar-initials">{initials}</span>
                      )}
                      <div className="account-avatar-overlay">
                        {avatarStatus.loading ? (
                          <span className="btn-spinner" style={{ width: 22, height: 22, borderWidth: 2, borderColor: '#fff', borderTopColor: 'transparent' }} />
                        ) : isVerified ? (
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} disabled={avatarStatus.loading || !isVerified} />
                    <p className="account-avatar-hint">
                      {avatarStatus.loading ? 'جارٍ رفع الصورة...' : isVerified ? 'اضغط على الصورة لتغييرها' : 'تحقق من هويتك لتغيير الصورة'}
                    </p>
                    {avatarStatus.error && <p className="account-msg account-msg-error">{avatarStatus.error}</p>}
                    {avatarStatus.success && <p className="account-msg account-msg-success">{avatarStatus.success}</p>}
                  </div>
                </div>

                <div className="account-divider" />

                {/* ── Name ── */}
                <div className="account-section">
                  <div className="account-section-title">الاسم الكامل</div>
                  <div className="account-field-row">
                    <input
                      type="text"
                      className="account-input"
                      placeholder="أدخل اسمك الكامل"
                      value={name}
                      onChange={e => { setName(e.target.value); setNameStatus(idle()) }}
                      disabled={!isVerified}
                    />
                    <button
                      className="account-save-btn"
                      onClick={handleSaveName}
                      disabled={nameStatus.loading || !isVerified}
                    >
                      {nameStatus.loading ? <span className="btn-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : 'حفظ'}
                    </button>
                  </div>
                  {nameStatus.error && <p className="account-msg account-msg-error">{nameStatus.error}</p>}
                  {nameStatus.success && <p className="account-msg account-msg-success">{nameStatus.success}</p>}
                </div>

                <div className="account-divider" />

                {/* ── Email ── */}
                <div className="account-section">
                  <div className="account-section-title">البريد الإلكتروني</div>
                  <div className="account-field-row">
                    <input
                      type="email"
                      className="account-input"
                      placeholder="example@domain.com"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setEmailStatus(idle()) }}
                      dir="ltr"
                      disabled={!isVerified}
                    />
                    <button
                      className="account-save-btn"
                      onClick={handleSaveEmail}
                      disabled={emailStatus.loading || !isVerified}
                    >
                      {emailStatus.loading ? <span className="btn-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : 'حفظ'}
                    </button>
                  </div>
                  {emailStatus.error && <p className="account-msg account-msg-error">{emailStatus.error}</p>}
                  {emailStatus.success && <p className="account-msg account-msg-success">{emailStatus.success}</p>}
                </div>

                <div className="account-divider" />

                {/* ── Password ── */}
                <div className="account-section">
                  <div className="account-section-title">تغيير كلمة المرور</div>
                  <div className="account-field-col">
                    <div className="account-pwd-wrap">
                      <input
                        type={showNewPwd ? 'text' : 'password'}
                        className="account-input"
                        placeholder="كلمة المرور الجديدة (8 أحرف على الأقل)"
                        value={newPwd}
                        onChange={e => { setNewPwd(e.target.value); setPwdStatus(idle()) }}
                        dir="ltr"
                        disabled={!isVerified}
                      />
                      <button type="button" className="account-eye-btn" onClick={() => setShowNewPwd(v => !v)}>
                        <EyeIcon visible={showNewPwd} />
                      </button>
                    </div>
                    <div className="account-pwd-wrap">
                      <input
                        type={showConfirmPwd ? 'text' : 'password'}
                        className="account-input"
                        placeholder="تأكيد كلمة المرور الجديدة"
                        value={confirmPwd}
                        onChange={e => { setConfirmPwd(e.target.value); setPwdStatus(idle()) }}
                        dir="ltr"
                        disabled={!isVerified}
                      />
                      <button type="button" className="account-eye-btn" onClick={() => setShowConfirmPwd(v => !v)}>
                        <EyeIcon visible={showConfirmPwd} />
                      </button>
                    </div>
                    <button
                      className="account-save-btn account-save-btn-full"
                      onClick={handleSavePassword}
                      disabled={pwdStatus.loading || !isVerified}
                    >
                      {pwdStatus.loading
                        ? <><span className="btn-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />جارٍ الحفظ...</>
                        : 'تغيير كلمة المرور'}
                    </button>
                  </div>
                  {pwdStatus.error && <p className="account-msg account-msg-error">{pwdStatus.error}</p>}
                  {pwdStatus.success && <p className="account-msg account-msg-success">{pwdStatus.success}</p>}
                </div>

                <div className="account-divider" />

                {/* ── KYC: التحقق من الهوية ── */}
                <div className="account-section">
                  <div className="account-section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 10h.01M8 10h.01M12 14h.01M8 14h.01M16 14h.01"/>
                    </svg>
                    التحقق من الهوية الوطنية
                    {kycStatus?.kyc_status === 'verified' && (
                      <span style={{ marginRight: 'auto', fontSize: 11, color: '#059669', background: '#ecfdf5', border: '1px solid #bbf7d0', padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>
                        ✓ تم التحقق
                      </span>
                    )}
                    {kycStatus?.kyc_status === 'pending' && (
                      <span style={{ marginRight: 'auto', fontSize: 11, color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>
                        ⏳ قيد المراجعة
                      </span>
                    )}
                  </div>

                  {kycStatus?.kyc_status === 'verified' ? (
                    <div className="kyc-verified-block">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>
                      </svg>
                      <div>
                        <p className="kyc-verified-title">هويتك موثّقة</p>
                        <p className="kyc-verified-sub">رقم الهوية: <span dir="ltr">{kycStatus.national_id}</span></p>
                      </div>
                    </div>
                  ) : kycStatus?.kyc_status === 'pending' ? (
                    <div className="kyc-pending-block">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                      <div>
                        <p className="kyc-pending-title">طلبك قيد المراجعة</p>
                        <p className="kyc-pending-sub">سيتم إشعارك بعد مراجعة الإدارة لبياناتك</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {kycStatus?.kyc_status === 'rejected' && (
                        <div className="kyc-rejected-block">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                          </svg>
                          <div>
                            <p className="kyc-rejected-title">تم رفض الطلب</p>
                            {kycStatus.kyc_note && <p className="kyc-rejected-note">السبب: {kycStatus.kyc_note}</p>}
                            <p className="kyc-rejected-sub">يمكنك إعادة الإرسال مع تصحيح البيانات</p>
                          </div>
                        </div>
                      )}

                      <p className="kyc-intro-text">
                        لحماية حقوقك ومنع التزوير، يرجى رفع صورة بطاقة هويتك الوطنية. تُحفظ بيانات الهوية بشكل آمن ولا تُشارك مع أطراف خارجية.
                      </p>

                      <div className="account-field-col" style={{ gap: 10 }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: 13 }}>رقم الهوية الوطنية</label>
                          <input
                            type="text"
                            className="account-input"
                            placeholder="أدخل رقم الهوية"
                            value={kycNationalId}
                            onChange={e => { setKycNationalId(e.target.value); setKycSectionStatus(idle()) }}
                            dir="ltr"
                            maxLength={20}
                          />
                        </div>

                        <div className="kyc-upload-area" onClick={() => kycFileRef.current?.click()}>
                          <input ref={kycFileRef} type="file" accept="image/*,application/pdf" hidden onChange={handleKYCFileChange} />
                          {kycFileName ? (
                            <>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="9 15 12 18 15 15"/><line x1="12" y1="11" x2="12" y2="18"/>
                              </svg>
                              <span className="kyc-upload-name">{kycFileName}</span>
                              <span className="kyc-upload-change">تغيير</span>
                            </>
                          ) : (
                            <>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
                              </svg>
                              <span className="kyc-upload-label">اضغط لرفع صورة بطاقة الهوية</span>
                              <span className="kyc-upload-hint">JPG أو PNG أو PDF</span>
                            </>
                          )}
                        </div>

                        <button
                          className="account-save-btn account-save-btn-full"
                          onClick={handleSubmitKYC}
                          disabled={kycSectionStatus.loading}
                        >
                          {kycSectionStatus.loading
                            ? <><span className="btn-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />جارٍ الإرسال...</>
                            : 'إرسال للتحقق'}
                        </button>
                      </div>

                      {kycSectionStatus.error && <p className="account-msg account-msg-error" style={{ marginTop: 8 }}>{kycSectionStatus.error}</p>}
                      {kycSectionStatus.success && <p className="account-msg account-msg-success" style={{ marginTop: 8 }}>{kycSectionStatus.success}</p>}
                    </>
                  )}
                </div>

              </div>

              {/* Footer */}
              <div className="account-modal-footer">
                <button className="account-btn-close" onClick={onClose}>إغلاق</button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
