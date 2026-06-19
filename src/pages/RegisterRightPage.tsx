import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useWallet } from '../hooks/useWallet'
import { registerIPOnChain, hashFile, computePerceptualHash, isContractDeployed } from '../lib/blockchain'
import { saveCertToSupabase, uploadIPFile, checkPerceptualDuplicate, type ExtraFields } from '../lib/supabase-ipr'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { IP_TYPES, BLOCKCHAIN } from '../config/blockchain.config'
import WalletConnect from '../components/WalletConnect'
import InfoTip from '../components/InfoTip'
import { playSuccess, playError } from '../lib/sounds'
import { uploadIDDocument } from '../lib/auth'

const EASE = 'easeOut' as const

type Step = 'form' | 'confirm' | 'success'

interface FormData {
  title: string
  ipType: number
  description: string
  holderName: string
  holderEmail: string
  // copyright (0)
  workType: string
  publicationDate: string
  // trademark (1)
  niceClass: string
  logoDescription: string
  // patent (2)
  technicalField: string
  inventors: string
  claims: string
}

interface Result {
  certId: string
  txHash: string
  documentHash: string
  blockNumber: number
}

function StepDot({ num, label, active, done }: { num: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className={`bc-step-dot${active ? ' bc-step-active' : ''}${done ? ' bc-step-done' : ''}`}>
      <div className="bc-step-circle">
        {done
          ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          : num}
      </div>
      <span className="bc-step-label">{label}</span>
    </div>
  )
}

export default function RegisterRightPage() {
  const wallet = useWallet()
  const { user } = useAuth()
  const { t, lang } = useLang()

  // ── KYC gate ──────────────────────────────────────────────────────────────
  const [kycDone,    setKycDone]    = useState<boolean>(!!(user?.user_metadata?.id_verified))
  const [kycFile,    setKycFile]    = useState<File | null>(null)
  const [kycPreview, setKycPreview] = useState<string | null>(null)
  const [kycLoading, setKycLoading] = useState(false)
  const [kycError,   setKycError]   = useState<string | null>(null)
  const kycInputRef = useRef<HTMLInputElement>(null)

  const handleKycFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 10 * 1024 * 1024) { setKycError(lang === 'ar' ? 'حجم الملف يجب أن يكون أقل من 10 ميغابايت' : 'File must be under 10 MB'); return }
    setKycFile(f)
    setKycError(null)
    if (f.type.startsWith('image/')) setKycPreview(URL.createObjectURL(f))
    else setKycPreview(null)
  }

  const handleKycSubmit = async () => {
    if (!kycFile || !user) return
    setKycLoading(true)
    setKycError(null)
    try {
      await uploadIDDocument(kycFile, user.id)
      setKycDone(true)
    } catch (err) {
      setKycError(lang === 'ar' ? 'فشل الرفع، يرجى المحاولة مرة أخرى' : 'Upload failed, please try again')
    } finally {
      setKycLoading(false)
    }
  }

  if (!kycDone) {
    return (
      <div className="kyc-page">
        <div className="kyc-bg-pattern" />
        <motion.div
          className="kyc-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
        >
          {/* header */}
          <div className="kyc-header">
            <div className="kyc-shield">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6L12 2z"/>
                <polyline points="9 12 11 14 15 10"/>
              </svg>
            </div>
            <h2 className="kyc-title">{lang === 'ar' ? 'التحقق من الهوية مطلوب' : 'Identity Verification Required'}</h2>
            <p className="kyc-subtitle">
              {lang === 'ar'
                ? 'لحماية حقوق الملكية الفكرية وضمان صحة البيانات، يجب إرفاق صورة هويتك الرسمية قبل التسجيل.'
                : 'To protect intellectual property rights and ensure data authenticity, a government-issued ID is required before registration.'}
            </p>
          </div>

          {/* what's accepted */}
          <div className="kyc-accepted">
            {[
              { icon: '🪪', label: lang === 'ar' ? 'بطاقة هوية وطنية' : 'National ID Card' },
              { icon: '📘', label: lang === 'ar' ? 'جواز سفر' : 'Passport' },
              { icon: '🚗', label: lang === 'ar' ? 'رخصة قيادة' : 'Driver\'s License' },
            ].map(item => (
              <div key={item.label} className="kyc-accepted-item">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          {/* upload zone */}
          <input ref={kycInputRef} type="file" hidden accept="image/*,.pdf" onChange={handleKycFile} />
          <button
            type="button"
            className={`kyc-upload-zone${kycFile ? ' kyc-upload-zone--has' : ''}`}
            onClick={() => kycInputRef.current?.click()}
          >
            {kycPreview ? (
              <img src={kycPreview} alt="preview" className="kyc-preview-img" />
            ) : kycFile ? (
              <>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                <span className="kyc-filename">{kycFile.name}</span>
              </>
            ) : (
              <>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <p className="kyc-upload-hint">{lang === 'ar' ? 'اضغط لاختيار صورة الهوية' : 'Click to upload your ID photo'}</p>
                <p className="kyc-upload-sub">{lang === 'ar' ? 'صورة أو PDF — الحد الأقصى 10 ميغابايت' : 'Image or PDF — max 10 MB'}</p>
              </>
            )}
          </button>

          {kycError && (
            <p className="kyc-error">{kycError}</p>
          )}

          {/* privacy note */}
          <div className="kyc-privacy">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span>
              {lang === 'ar'
                ? 'صورتك تُخزَّن بشكل مشفّر في قاعدة بيانات خاصة ولن تظهر للعموم أبداً'
                : 'Your ID is stored encrypted in a private bucket and will never be publicly visible'}
            </span>
          </div>

          <button
            className="kyc-submit-btn"
            disabled={!kycFile || kycLoading}
            onClick={handleKycSubmit}
          >
            {kycLoading
              ? <><span className="btn-spinner" />{lang === 'ar' ? 'جاري الرفع...' : 'Uploading...'}</>
              : lang === 'ar' ? 'تأكيد وإرسال الهوية' : 'Confirm & Submit ID'
            }
          </button>

          <Link to="/" className="kyc-back">{lang === 'ar' ? '← العودة للرئيسية' : '← Back to Home'}</Link>
        </motion.div>
      </div>
    )
  }

  const [step, setStep] = useState<Step>('form')
  const [form, setForm] = useState<FormData>({
    title: '', ipType: 0, description: '', holderName: '', holderEmail: '',
    workType: '', publicationDate: '',
    niceClass: '', logoDescription: '',
    technicalField: '', inventors: '', claims: '',
  })

  useEffect(() => {
    const savedName = user?.user_metadata?.full_name as string | undefined
    const savedEmail = user?.email as string | undefined
    setForm(f => ({
      ...f,
      holderName: f.holderName || savedName || '',
      holderEmail: f.holderEmail || savedEmail || '',
    }))
  }, [user])

  const buildExtraFields = (): ExtraFields | undefined => {
    if (form.ipType === 0) {
      const ef = { work_type: form.workType || undefined, publication_date: form.publicationDate || undefined }
      return Object.values(ef).some(Boolean) ? ef : undefined
    }
    if (form.ipType === 1) {
      const ef = { nice_class: form.niceClass || undefined, logo_description: form.logoDescription || undefined }
      return Object.values(ef).some(Boolean) ? ef : undefined
    }
    if (form.ipType === 2) {
      const ef = { technical_field: form.technicalField || undefined, inventors: form.inventors || undefined, claims: form.claims || undefined }
      return Object.values(ef).some(Boolean) ? ef : undefined
    }
    return undefined
  }

  const isFormValid = (): boolean => {
    const base = form.title.trim() && form.holderName.trim()
    if (!base) return false
    if (!fileHash || hashing) return false
    if (form.ipType === 0) return !!form.workType
    if (form.ipType === 1) return !!(form.description.trim())
    if (form.ipType === 2) return !!(form.technicalField.trim() && form.inventors.trim() && form.claims.trim())
    return true
  }
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [fileHash, setFileHash] = useState<string | null>(null)
  const [pHash,    setPHash]    = useState<string | null>(null)
  const [hashing,  setHashing]  = useState(false)
  const [checking, setChecking] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    if (selected.size > 50 * 1024 * 1024) { setError(t('rr.file.toobig')); return }
    setFile(selected)
    setFileHash(null)
    setPHash(null)
    setError(null)
    setHashing(true)
    try {
      const [sha, ph] = await Promise.all([
        hashFile(selected),
        computePerceptualHash(selected),
      ])
      setFileHash(sha)
      setPHash(ph)
    } finally {
      setHashing(false)
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pHash) { setStep('confirm'); return }
    setChecking(true)
    setError(null)
    try {
      const { isDuplicate, similarTitle, similarHolder } = await checkPerceptualDuplicate(pHash)
      if (isDuplicate) {
        setError(
          lang === 'ar'
            ? `هذا الملف مسجّل مسبقاً — العمل: "${similarTitle}" — صاحب الحق: ${similarHolder}`
            : `This file is already registered — Work: "${similarTitle}" — Rights holder: ${similarHolder}`
        )
        return
      }
      setStep('confirm')
    } catch {
      setStep('confirm')
    } finally {
      setChecking(false)
    }
  }

  const handleRegister = async () => {
    if (!wallet.isConnected || !wallet.isSepolia) return
    setProcessing(true)
    setError(null)
    try {
      const res = await registerIPOnChain({
        title: form.title,
        ipType: form.ipType,
        description: form.description,
        holderName: form.holderName,
        ownerAddress: wallet.address!,
        fileHash: fileHash!,
      })

      if (user) {
        try {
          await saveCertToSupabase({
            userId:         user.id,
            walletAddress:  wallet.address!,
            title:          form.title,
            ipType:         form.ipType,
            description:    form.description,
            holderName:     form.holderName,
            holderEmail:    form.holderEmail || undefined,
            extraFields:    buildExtraFields(),
            perceptualHash: pHash ?? undefined,
            result:         res,
          })
          if (file) {
            try { await uploadIPFile(file, res.certId) } catch (e) { console.error('File upload error:', e) }
          }
        } catch (sbErr) {
          console.error('Supabase save error:', sbErr)
        }
      }

      setResult(res)
      playSuccess()
      setStep('success')
    } catch (err) {
      const msg = (err as Error).message ?? ''
      playError()
      if (msg.toLowerCase().includes('user rejected') || msg.toLowerCase().includes('rejected')) {
        setError(t('rr.err.rejected'))
      } else if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('execution reverted')) {
        setError(t('rr.err.duplicate'))
      } else {
        setError(t('rr.err.failed'))
      }
    } finally {
      setProcessing(false)
    }
  }

  const ipTypeInfo = IP_TYPES[form.ipType]

  return (
    <div className="bc-page">
      <header className="bc-topbar">
        <Link to="/" className="bc-back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
          {t('pg.back')}
        </Link>

        <div className="bc-topbar-logo">
          <svg width="34" height="34" viewBox="0 0 44 44" fill="none">
            <path d="M22 5L38 12V26C38 35 22 42 22 42C22 42 6 35 6 26V12L22 5Z"
              fill="rgba(37,99,235,0.18)" stroke="#3b82f6" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M14 22L19.5 28.5L30 16" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{t('pg.brand')}</span>
        </div>

        <WalletConnect showDisconnect={false} />
      </header>

      {/* ── Motivational banner ── */}
      <motion.div
        className="rr-motivate"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <div className="rr-motivate-bg" />
        <div className="rr-motivate-inner">
          {/* Left: text */}
          <div className="rr-motivate-text">
            <div className="rr-motivate-badge">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              منصة رسمية معتمدة
            </div>
            <h2 className="rr-motivate-title">
              سجّل حقوقك على البلوكشين
              <span className="rr-motivate-accent"> واحفظ إبداعك للأبد</span>
            </h2>
            <p className="rr-motivate-desc">
              توثيق لا يُزال ولا يُزوَّر — كل عمل إبداعي يستحق حماية حقيقية وفق أعلى المعايير القانونية.
            </p>
            <div className="rr-motivate-benefits">
              {[
                'توثيق فوري وغير قابل للتزوير',
                'شهادة رقمية معتمدة قانونياً',
                'حماية دائمة لحقوقك الفكرية',
                'أكثر من 10,000 حق مسجّل بثقة',
              ].map((b, i) => (
                <motion.div
                  key={i}
                  className="rr-motivate-benefit"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, ease: EASE, delay: 0.3 + i * 0.08 }}
                >
                  <span className="rr-motivate-check">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </span>
                  {b}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right: stat cards */}
          <div className="rr-motivate-stats">
            {[
              { num: '+10K', label: 'حق مسجّل موثّق' },
              { num: '100%', label: 'أمان بلوكشين' },
              { num: '< 5د', label: 'وقت التسجيل' },
            ].map((s, i) => (
              <motion.div
                key={i}
                className="rr-motivate-stat"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: EASE, delay: 0.4 + i * 0.1 }}
              >
                <span className="rr-motivate-stat-num">{s.num}</span>
                <span className="rr-motivate-stat-label">{s.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="rr-content-split">
        {/* ── Illustration panel ── */}
        <div className="rr-illus-col">
          <ProtectionIllustration />
          <div className="rr-illus-label">
            <p>حماية حقوقك الفكرية</p>
            <p>موثّقة على البلوكشين</p>
          </div>
        </div>

        {/* ── Form panel ── */}
        <main className="bc-main">
        {!isContractDeployed() && (
          <div className="bc-alert bc-alert-warn bc-deploy-warn">
            {t('rr.err.failed')}
          </div>
        )}

        <div className="bc-steps-bar">
          <StepDot num={1} label={t('rr.step1')} active={step === 'form'} done={step !== 'form'} />
          <div className={`bc-step-connector${step !== 'form' ? ' bc-connector-done' : ''}`} />
          <StepDot num={2} label={t('rr.step2')} active={step === 'confirm'} done={step === 'success'} />
          <div className={`bc-step-connector${step === 'success' ? ' bc-connector-done' : ''}`} />
          <StepDot num={3} label={t('rr.step3')} active={step === 'success'} done={false} />
        </div>

        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.div
              key="form"
              className="bc-card"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              <h1 className="bc-card-title">{t('rr.form.title')}</h1>
              <p className="bc-card-desc">{t('rr.form.desc')}</p>

              <form className="bc-form" onSubmit={handleFormSubmit}>

                {/* ── اختيار النوع ── */}
                <div className="bc-form-group">
                  <label className="bc-label">{t('rr.ip.type')}</label>
                  <div className="ip-type-grid">
                    {IP_TYPES.map(tp => (
                      <button
                        key={tp.value}
                        type="button"
                        className={`ip-type-btn${form.ipType === tp.value ? ' ip-type-selected' : ''}`}
                        style={{ '--type-color': tp.color, '--type-bg': tp.bg } as React.CSSProperties}
                        onClick={() => setForm(f => ({ ...f, ipType: tp.value, title: '', description: '', workType: '', niceClass: '', logoDescription: '', technicalField: '', inventors: '', claims: '' }))}
                      >
                        {t(tp.labelKey)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── مشترك: اسم صاحب الحق + البريد ── */}
                <div className="bc-form-row-2">
                  <div className="bc-form-group">
                    <label className="bc-label">{t('rr.f.holder')} <span className="bc-required">*</span></label>
                    <input className="bc-input" placeholder={t('rr.ph.holder')} value={form.holderName}
                      onChange={e => setForm(f => ({ ...f, holderName: e.target.value }))} required />
                  </div>
                  <div className="bc-form-group">
                    <label className="bc-label">{t('rr.f.email')} <span className="bc-optional">{t('rr.optional')}</span></label>
                    <input className="bc-input" type="email" placeholder={t('rr.ph.email')} value={form.holderEmail}
                      onChange={e => setForm(f => ({ ...f, holderEmail: e.target.value }))} />
                  </div>
                </div>

                {/* ══ حقوق النشر (0) ══ */}
                {form.ipType === 0 && (
                  <AnimatePresence mode="wait">
                    <motion.div key="form-0" className="bc-type-fields"
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, ease: EASE }}>
                      <div className="bc-type-fields-header" style={{ background: 'rgba(37,99,235,0.07)', borderColor: 'rgba(37,99,235,0.18)', color: '#2563eb' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M14.83 14.83a4 4 0 1 1 0-5.66"/></svg>
                        حقول حقوق النشر
                      </div>
                      <div className="bc-form-group">
                        <label className="bc-label">{t('rr.f.title')} <span className="bc-required">*</span></label>
                        <input className="bc-input" placeholder="مثال: رواية «الطريق الطويل»، تطبيق X، لوحة Y..." value={form.title}
                          onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                      </div>
                      <div className="bc-form-group">
                        <label className="bc-label">{t('rr.f.work_type')} <span className="bc-required">*</span></label>
                        <select className="bc-input bc-select" value={form.workType}
                          onChange={e => setForm(f => ({ ...f, workType: e.target.value }))}>
                          <option value="">— اختر نوع العمل —</option>
                          <option value="book">كتاب / مؤلَّف أدبي</option>
                          <option value="software">برنامج / تطبيق</option>
                          <option value="image">صورة / رسم / تصميم</option>
                          <option value="music">موسيقى / تسجيل صوتي</option>
                          <option value="video">فيلم / مقطع مرئي</option>
                          <option value="other">أخرى</option>
                        </select>
                      </div>
                      <div className="bc-form-row-2">
                        <div className="bc-form-group">
                          <label className="bc-label">{t('rr.f.pub_date')} <span className="bc-optional">{t('rr.optional')}</span></label>
                          <input type="date" className="bc-input" value={form.publicationDate}
                            onChange={e => setForm(f => ({ ...f, publicationDate: e.target.value }))} />
                        </div>
                        <div className="bc-form-group" style={{ flex: 2 }}>
                          <label className="bc-label">وصف العمل <span className="bc-optional">{t('rr.optional')}</span></label>
                          <input className="bc-input" placeholder="وصف مختصر للعمل الإبداعي..." value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}

                {/* ══ العلامات التجارية (1) ══ */}
                {form.ipType === 1 && (
                  <AnimatePresence mode="wait">
                    <motion.div key="form-1" className="bc-type-fields"
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, ease: EASE }}>
                      <div className="bc-type-fields-header" style={{ background: 'rgba(124,58,237,0.07)', borderColor: 'rgba(124,58,237,0.18)', color: '#7c3aed' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        حقول العلامة التجارية
                      </div>
                      <div className="bc-form-group">
                        <label className="bc-label">اسم العلامة التجارية <span className="bc-required">*</span></label>
                        <input className="bc-input" placeholder="مثال: شركة النور، منتج X..." value={form.title}
                          onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                      </div>
                      <div className="bc-form-group">
                        <label className="bc-label">وصف العلامة ونشاطها <span className="bc-required">*</span></label>
                        <textarea className="bc-input bc-textarea" rows={3}
                          placeholder="اشرح طبيعة العلامة والمجال التجاري الذي تُستخدم فيه..."
                          value={form.description}
                          onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                      </div>
                      <div className="bc-form-row-2">
                        <div className="bc-form-group">
                          <label className="bc-label">{t('rr.f.nice_class')} <span className="bc-optional">{t('rr.optional')}</span>
                            <InfoTip term="تصنيف نيس" explanation="نظام دولي لتصنيف السلع والخدمات (45 فئة). مثال: الفئة 9 للبرمجيات، 25 للملابس، 35 للخدمات التجارية." /></label>
                          <input className="bc-input" placeholder="مثال: 9، 25، 35..." value={form.niceClass}
                            onChange={e => setForm(f => ({ ...f, niceClass: e.target.value }))} />
                        </div>
                        <div className="bc-form-group" style={{ flex: 2 }}>
                          <label className="bc-label">وصف الشعار <span className="bc-optional">{t('rr.optional')}</span></label>
                          <input className="bc-input" placeholder="وصف مختصر لشكل الشعار ومكوناته..." value={form.logoDescription}
                            onChange={e => setForm(f => ({ ...f, logoDescription: e.target.value }))} />
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}

                {/* ══ براءات الاختراع (2) ══ */}
                {form.ipType === 2 && (
                  <AnimatePresence mode="wait">
                    <motion.div key="form-2" className="bc-type-fields"
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, ease: EASE }}>
                      <div className="bc-type-fields-header" style={{ background: 'rgba(217,119,6,0.07)', borderColor: 'rgba(217,119,6,0.2)', color: '#d97706' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>
                        حقول براءة الاختراع
                      </div>
                      <div className="bc-form-group">
                        <label className="bc-label">عنوان الاختراع <span className="bc-required">*</span></label>
                        <input className="bc-input" placeholder="مثال: نظام ذكاء اصطناعي لتشخيص الأمراض..." value={form.title}
                          onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                      </div>
                      <div className="bc-form-row-2">
                        <div className="bc-form-group">
                          <label className="bc-label">{t('rr.f.tech_field')} <span className="bc-required">*</span></label>
                          <input className="bc-input" placeholder="مثال: ذكاء اصطناعي، طاقة متجددة..." value={form.technicalField}
                            onChange={e => setForm(f => ({ ...f, technicalField: e.target.value }))} />
                        </div>
                        <div className="bc-form-group" style={{ flex: 2 }}>
                          <label className="bc-label">{t('rr.f.inventors')} <span className="bc-required">*</span></label>
                          <input className="bc-input" placeholder="أسماء المخترعين، مفصولة بفاصلة..." value={form.inventors}
                            onChange={e => setForm(f => ({ ...f, inventors: e.target.value }))} />
                        </div>
                      </div>
                      <div className="bc-form-group">
                        <label className="bc-label">
                          {t('rr.f.claims')} <span className="bc-required">*</span>
                          <InfoTip term="المطالبات (Claims)" explanation="الجزء القانوني الأهم في براءة الاختراع — يُحدد بدقة ما تطالب بحمايته. كل مطالبة هي جملة تصف عنصراً مبتكراً في اختراعك." />
                        </label>
                        <textarea className="bc-input bc-textarea" rows={4}
                          placeholder="صِف مطالبات الحماية: ما الذي يجعل اختراعك فريداً وما الذي تطالب بحمايته..."
                          value={form.claims}
                          onChange={e => setForm(f => ({ ...f, claims: e.target.value }))} />
                      </div>
                      <div className="bc-form-group">
                        <label className="bc-label">وصف تقني <span className="bc-optional">{t('rr.optional')}</span></label>
                        <textarea className="bc-input bc-textarea" rows={2}
                          placeholder="شرح إضافي للآلية التقنية..."
                          value={form.description}
                          onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}

                {/* ── رفع الملف (مشترك) ── */}
                <div className="bc-form-group">
                  <label className="bc-label">
                    {form.ipType === 1 ? 'صورة الشعار' : form.ipType === 2 ? 'الملفات التقنية' : 'الملف المراد حمايته'}
                    <span className="bc-required"> *</span>
                  </label>
                  <label className={`file-upload-zone${file ? ' file-upload-zone--has' : ''}`}>
                    <input type="file" className="file-upload-input" onChange={handleFileChange} accept="*/*" />
                    {!file ? (
                      <>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                        <p className="file-upload-hint">{t('rr.file.hint')}</p>
                        <p className="file-upload-sub">{t('rr.file.max')}</p>
                        <p className="file-upload-sub" style={{color:'#f59e0b',marginTop:4}}>
                          {lang === 'ar' ? 'مطلوب — يمنع تكرار تسجيل نفس الملف من أي شخص' : 'Required — prevents duplicate registration of the same file'}
                        </p>
                      </>
                    ) : (
                      <div className="file-upload-preview">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round">
                          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
                        </svg>
                        <div>
                          <p className="file-upload-name">{file.name}</p>
                          <p className="file-upload-size">{(file.size / 1024).toFixed(1)} KB</p>
                          {hashing && <p className="file-upload-hashing">{t('rr.file.hashing')}</p>}
                          {fileHash && !hashing && (
                            <p className="file-upload-hash">
                              SHA-256: {fileHash.slice(0, 14)}...{fileHash.slice(-6)}
                              <InfoTip term="SHA-256" explanation="خوارزمية تحوّل ملفك إلى بصمة رقمية فريدة (64 حرفاً). إذا تغيّر حرف واحد في الملف تتغير البصمة كاملاً — دليل قاطع أن الملف لم يُعدَّل." />
                            </p>
                          )}
                          {pHash && !hashing && (
                            <p className="file-upload-hash" style={{color:'#a78bfa'}}>
                              pHash: {pHash.slice(0, 12)}... ✓
                              <InfoTip term="Perceptual Hash" explanation="بصمة بصرية للصورة — تكشف التشابه حتى لو عُدِّلت الألوان أو قُصَّت الحواف." />
                            </p>
                          )}
                        </div>
                        <button type="button" className="file-upload-remove" onClick={e => { e.preventDefault(); setFile(null); setFileHash(null) }}>✕</button>
                      </div>
                    )}
                  </label>
                </div>

                {error && (
                  <div className="bc-duplicate-alert">
                    <div className="bc-duplicate-icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                    </div>
                    <div className="bc-duplicate-body">
                      <p className="bc-duplicate-title">
                        {lang === 'ar' ? 'تعذّر تسجيل الملف' : 'File Cannot Be Registered'}
                      </p>
                      <p className="bc-duplicate-msg">{error}</p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-bc-primary"
                  disabled={!isFormValid() || hashing || checking}
                >
                  {checking
                    ? <><span className="btn-spinner" />{lang === 'ar' ? 'جاري الفحص...' : 'Checking...'}</>
                    : <>{t('rr.next')}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m15 18-6-6 6-6" />
                        </svg>
                      </>
                  }
                </button>
              </form>
            </motion.div>
          )}

          {step === 'confirm' && (
            <motion.div
              key="confirm"
              className="bc-card"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              <h1 className="bc-card-title">{t('rr.confirm.title')}</h1>
              <p className="bc-card-desc">{t('rr.confirm.desc')}</p>

              <p className="bc-section-label">{t('rr.wallet.status')}</p>
              <WalletConnect showHint />

              <p className="bc-section-label" style={{ marginTop: 28 }}>{t('rr.summary')}</p>
              <div className="bc-review-box">
                <div className="bc-review-row">
                  <span className="bc-review-key">{t('rr.rf.type')}</span>
                  <span className="ip-badge" style={{ background: ipTypeInfo.bg, color: ipTypeInfo.color }}>
                    {t(ipTypeInfo.labelKey)}
                  </span>
                </div>
                <div className="bc-review-row">
                  <span className="bc-review-key">{t('rr.rf.title')}</span>
                  <span className="bc-review-val">{form.title}</span>
                </div>
                <div className="bc-review-row">
                  <span className="bc-review-key">{t('rr.rf.holder')}</span>
                  <span className="bc-review-val">{form.holderName}</span>
                </div>
                {form.description && (
                  <div className="bc-review-row">
                    <span className="bc-review-key">{t('rr.rf.desc')}</span>
                    <span className="bc-review-val">{form.description}</span>
                  </div>
                )}
                {file && (
                  <div className="bc-review-row">
                    <span className="bc-review-key">{t('rr.rf.file')}</span>
                    <span className="bc-review-val bc-mono-sm">{file.name}</span>
                  </div>
                )}
                {fileHash && (
                  <div className="bc-review-row">
                    <span className="bc-review-key">{t('rr.rf.hash')} <InfoTip term="هاش الوثيقة" explanation="بصمة رقمية فريدة لملفك تُحسب بخوارزمية SHA-256. تُخزَّن في البلوكشين كدليل على أصالة الملف في وقت التسجيل." /></span>
                    <span className="bc-review-val bc-mono-sm">{fileHash.slice(0, 14)}...{fileHash.slice(-6)}</span>
                  </div>
                )}
              </div>

              {error && <div className="bc-alert bc-alert-error">{error}</div>}

              <div className="bc-gas-note">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {t('rr.gas.note')}
                <InfoTip term="رسوم الغاز (Gas)" explanation="رسوم رمزية صغيرة تُدفع لشبكة البلوكشين مقابل تنفيذ العملية. على شبكة Sepolia التجريبية هي مجانية — ETH تجريبي فقط." />
              </div>

              <div className="bc-confirm-actions">
                <button className="btn-bc-ghost" onClick={() => { setStep('form'); setError(null) }} disabled={processing}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                  {t('rr.prev')}
                </button>
                <button
                  className="btn-bc-primary"
                  onClick={handleRegister}
                  disabled={!wallet.isConnected || !wallet.isSepolia || processing}
                >
                  {processing
                    ? <><span className="btn-spinner" /> {t('rr.processing')}</>
                    : <>{t('rr.submit')}</>}
                </button>
              </div>
            </motion.div>
          )}

          {step === 'success' && result && (
            <motion.div
              key="success"
              className="bc-card bc-success-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <div className="bc-success-icon">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h1 className="bc-success-title">{t('rr.success.title')}</h1>
              <p className="bc-card-desc">{t('rr.success.desc')}</p>

              <div className="bc-cert-result-box">
                <div className="bc-cert-row-item">
                  <span className="bc-cert-rkey">
                    {t('rr.result.cert.id')}
                    <InfoTip term="رقم الشهادة" explanation="معرّف فريد لشهادتك على البلوكشين. احتفظ به لأنك ستحتاجه للتحقق من شهادتك لاحقاً." />
                  </span>
                  <span className="bc-cert-rval bc-cert-id-big">#{result.certId}</span>
                </div>
                <div className="bc-cert-row-item">
                  <span className="bc-cert-rkey">
                    {t('rr.result.tx')}
                    <InfoTip term="هاش المعاملة (TX Hash)" explanation="رقم إيصال معاملتك على البلوكشين. يمكنك من خلاله التحقق من تسجيل حقك على Etherscan في أي وقت ومن أي مكان." />
                  </span>
                  <a
                    className="bc-cert-rval bc-hash-link"
                    href={`${BLOCKCHAIN.EXPLORER}/tx/${result.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {result.txHash.slice(0, 18)}...{result.txHash.slice(-8)}
                  </a>
                </div>
                <div className="bc-cert-row-item">
                  <span className="bc-cert-rkey">
                    {t('rr.result.hash')}
                    <InfoTip term="هاش الوثيقة" explanation="البصمة الرقمية لملفك المرفق. تُثبت أن الملف لم يُعدَّل منذ لحظة التسجيل — حتى تغيير مسافة واحدة يغيّر الهاش كاملاً." />
                  </span>
                  <span className="bc-cert-rval bc-mono-sm">{result.documentHash.slice(0, 18)}...{result.documentHash.slice(-8)}</span>
                </div>
                <div className="bc-cert-row-item">
                  <span className="bc-cert-rkey">
                    {t('rr.result.block')}
                    <InfoTip term="رقم الكتلة" explanation="معاملاتك تُجمَّع في 'كتل' على البلوكشين. هذا الرقم يحدد في أي كتلة تم تسجيل حقك — ويُثبت توقيت التسجيل بدقة." />
                  </span>
                  <span className="bc-cert-rval">{result.blockNumber}</span>
                </div>
              </div>

              <div className="bc-success-actions">
                <Link to="/certificates" className="btn-bc-primary">{t('rr.view.certs')}</Link>
                <Link to="/verify" className="btn-bc-outline">{t('rr.verify.cert')}</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

/* ── Protection Illustration ── */
function ProtectionIllustration() {
  return (
    <svg width="300" height="420" viewBox="0 0 300 420" fill="none" xmlns="http://www.w3.org/2000/svg">

      {/* Ground shadow */}
      <ellipse cx="150" cy="400" rx="78" ry="11" fill="rgba(37,99,235,0.13)" />

      {/* Outer shield glow aura */}
      <motion.path
        d="M150 30 L252 76 L252 208 C252 278 150 320 150 320 C150 320 48 278 48 208 L48 76 Z"
        fill="rgba(37,99,235,0.07)"
        stroke="rgba(96,165,250,0.4)"
        strokeWidth="1.5"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Inner shield dashed */}
      <path
        d="M150 52 L230 90 L230 200 C230 256 150 293 150 293 C150 293 70 256 70 200 L70 90 Z"
        fill="rgba(37,99,235,0.09)"
        stroke="rgba(96,165,250,0.22)"
        strokeWidth="1"
        strokeDasharray="5 3"
      />

      {/* ── Person figure ── */}
      {/* Head */}
      <motion.circle
        cx="150" cy="116" r="32"
        fill="url(#hGrad)"
        stroke="rgba(96,165,250,0.45)"
        strokeWidth="1.5"
        animate={{ scale: [1, 1.015, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Head shine */}
      <ellipse cx="139" cy="105" rx="9" ry="6" fill="rgba(255,255,255,0.18)" transform="rotate(-20 139 105)" />

      {/* Body */}
      <motion.path
        d="M113 152 C105 152 99 159 99 168 L99 245 C99 253 105 260 113 260 L187 260 C195 260 201 253 201 245 L201 168 C201 159 195 152 187 152 Z"
        fill="url(#bGrad)"
        animate={{ scale: [1, 1.012, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Right arm */}
      <motion.path
        d="M196 183 Q228 190 248 207"
        stroke="url(#aGradR)"
        strokeWidth="17"
        strokeLinecap="round"
        fill="none"
        animate={{ d: ['M196 183 Q228 190 248 207', 'M196 183 Q228 188 248 203', 'M196 183 Q228 190 248 207'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Left arm */}
      <motion.path
        d="M104 183 Q72 190 52 207"
        stroke="url(#aGradL)"
        strokeWidth="17"
        strokeLinecap="round"
        fill="none"
        animate={{ d: ['M104 183 Q72 190 52 207', 'M104 183 Q72 188 52 203', 'M104 183 Q72 190 52 207'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
      />

      {/* Right hand glow */}
      <motion.circle
        cx="252" cy="210" r="14"
        fill="rgba(37,99,235,0.6)"
        stroke="rgba(96,165,250,0.75)"
        strokeWidth="1.5"
        animate={{ r: [14, 17, 14], opacity: [0.75, 1, 0.75] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Left hand glow */}
      <motion.circle
        cx="48" cy="210" r="14"
        fill="rgba(37,99,235,0.6)"
        stroke="rgba(96,165,250,0.75)"
        strokeWidth="1.5"
        animate={{ r: [14, 17, 14], opacity: [0.75, 1, 0.75] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
      />

      {/* Legs */}
      <rect x="112" y="259" width="28" height="54" rx="9" fill="url(#lGrad)" />
      <rect x="160" y="259" width="28" height="54" rx="9" fill="url(#lGrad)" />

      {/* Lock icon on chest */}
      <rect x="130" y="188" width="40" height="34" rx="7" fill="rgba(37,99,235,0.88)" stroke="rgba(96,165,250,0.65)" strokeWidth="1.5" />
      <path d="M141 188 L141 178 C141 168 159 168 159 178 L159 188" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="150" cy="205" r="5" fill="rgba(255,255,255,0.9)" />
      <rect x="148" y="205" width="4" height="9" rx="2" fill="rgba(255,255,255,0.9)" />

      {/* ── Floating IP badges ── */}
      {/* © top-left */}
      <motion.g animate={{ y: [-8, 8, -8] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
        <circle cx="28" cy="90" r="22" fill="rgba(37,99,235,0.18)" stroke="rgba(96,165,250,0.55)" strokeWidth="1.5" />
        <text x="28" y="98" textAnchor="middle" fill="#93c5fd" fontSize="20" fontWeight="700" fontFamily="serif">©</text>
      </motion.g>

      {/* ® top-right */}
      <motion.g animate={{ y: [7, -7, 7] }} transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}>
        <circle cx="273" cy="78" r="19" fill="rgba(139,92,246,0.18)" stroke="rgba(167,139,250,0.55)" strokeWidth="1.5" />
        <text x="273" y="85" textAnchor="middle" fill="#c4b5fd" fontSize="16" fontWeight="700" fontFamily="serif">®</text>
      </motion.g>

      {/* ™ right side */}
      <motion.g animate={{ y: [-5, 5, -5] }} transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}>
        <circle cx="282" cy="178" r="16" fill="rgba(37,99,235,0.14)" stroke="rgba(96,165,250,0.42)" strokeWidth="1.2" />
        <text x="282" y="184" textAnchor="middle" fill="#93c5fd" fontSize="12" fontWeight="700" fontFamily="serif">™</text>
      </motion.g>

      {/* Document / patent left */}
      <motion.g animate={{ y: [4, -4, 4] }} transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }}>
        <rect x="8" y="155" width="36" height="48" rx="5" fill="rgba(37,99,235,0.14)" stroke="rgba(96,165,250,0.4)" strokeWidth="1.2" />
        <rect x="14" y="167" width="24" height="3" rx="1.5" fill="rgba(255,255,255,0.28)" />
        <rect x="14" y="174" width="24" height="3" rx="1.5" fill="rgba(255,255,255,0.2)" />
        <rect x="14" y="181" width="16" height="3" rx="1.5" fill="rgba(255,255,255,0.18)" />
        <rect x="14" y="188" width="20" height="3" rx="1.5" fill="rgba(255,255,255,0.14)" />
      </motion.g>

      {/* ── Check badge bottom ── */}
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.55, delay: 1.1, ease: 'backOut' }}
      >
        <circle cx="150" cy="366" r="24" fill="rgba(34,197,94,0.15)" stroke="rgba(34,197,94,0.48)" strokeWidth="1.5" />
        <path d="M139 366 L147 374 L162 356" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </motion.g>

      {/* ── Particles ── */}
      <motion.circle cx="118" cy="50" r="3.5" fill="rgba(96,165,250,0.45)"
        animate={{ y: [-14, 0, -14], opacity: [0.35, 0.85, 0.35] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }} />
      <motion.circle cx="188" cy="38" r="2.5" fill="rgba(167,139,250,0.4)"
        animate={{ y: [-10, 4, -10], opacity: [0.3, 0.75, 0.3] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 1.1 }} />
      <motion.circle cx="68" cy="310" r="3" fill="rgba(96,165,250,0.35)"
        animate={{ y: [-7, 7, -7], opacity: [0.25, 0.65, 0.25] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }} />
      <motion.circle cx="238" cy="320" r="2.5" fill="rgba(167,139,250,0.35)"
        animate={{ y: [5, -5, 5], opacity: [0.25, 0.6, 0.25] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1.6 }} />
      <motion.circle cx="150" cy="342" r="3" fill="rgba(34,197,94,0.4)"
        animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }} />

      <defs>
        <linearGradient id="hGrad" x1="120" y1="86" x2="180" y2="148" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="bGrad" x1="99" y1="152" x2="201" y2="260" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
        <linearGradient id="aGradR" x1="196" y1="183" x2="248" y2="207" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id="aGradL" x1="104" y1="183" x2="52" y2="207" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id="lGrad" x1="0" y1="259" x2="0" y2="313" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>
    </svg>
  )
}
