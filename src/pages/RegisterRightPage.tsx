import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useWallet } from '../hooks/useWallet'
import { registerIPOnChain, hashFile, isContractDeployed } from '../lib/blockchain'
import { saveCertToSupabase, uploadIPFile } from '../lib/supabase-ipr'
import { useAuth } from '../context/AuthContext'
import { IP_TYPES, BLOCKCHAIN } from '../config/blockchain.config'
import WalletConnect from '../components/WalletConnect'
import { playSuccess, playError } from '../lib/sounds'

const EASE = 'easeOut' as const

type Step = 'form' | 'confirm' | 'success'

interface FormData {
  title: string
  ipType: number
  description: string
  holderName: string
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
  const [step, setStep] = useState<Step>('form')
  const [form, setForm] = useState<FormData>({ title: '', ipType: 0, description: '', holderName: '' })

  useEffect(() => {
    const savedName = user?.user_metadata?.full_name as string | undefined
    if (savedName) {
      setForm(f => ({ ...f, holderName: f.holderName || savedName }))
    }
  }, [user])
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [fileHash, setFileHash] = useState<string | null>(null)
  const [hashing, setHashing] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    if (selected.size > 50 * 1024 * 1024) { setError('حجم الملف يجب أن يكون أقل من 50 ميغابايت'); return }
    setFile(selected)
    setHashing(true)
    try {
      const hash = await hashFile(selected)
      setFileHash(hash)
    } finally {
      setHashing(false)
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStep('confirm')
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
        fileHash: fileHash ?? undefined,
      })

      // حفظ في Supabase إذا كان المستخدم مسجلاً
      if (user) {
        try {
          await saveCertToSupabase({
            userId:        user.id,
            walletAddress: wallet.address!,
            title:         form.title,
            ipType:        form.ipType,
            description:   form.description,
            holderName:    form.holderName,
            result:        res,
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
        setError('تم رفض المعاملة من المحفظة')
      } else if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('execution reverted')) {
        setError('هذا الملف مسجل مسبقاً على البلوكتشين. استخدمي ملفاً مختلفاً.')
      } else {
        setError('فشل التسجيل. يرجى التأكد من توفر ETH تجريبي كافٍ ثم المحاولة مجدداً.')
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
          الرئيسية
        </Link>

        <div className="bc-topbar-logo">
          <svg width="34" height="34" viewBox="0 0 44 44" fill="none">
            <path d="M22 5L38 12V26C38 35 22 42 22 42C22 42 6 35 6 26V12L22 5Z"
              fill="rgba(37,99,235,0.18)" stroke="#3b82f6" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M14 22L19.5 28.5L30 16" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>إدارة الحقوق الملكية</span>
        </div>

        <WalletConnect showDisconnect={false} />
      </header>

      <main className="bc-main">
        {!isContractDeployed() && (
          <div className="bc-alert bc-alert-warn bc-deploy-warn">
            العقد الذكي لم يُنشر بعد. راجع ملف <code>.env.local</code> وأضف <code>VITE_CONTRACT_ADDRESS</code>.
          </div>
        )}

        <div className="bc-steps-bar">
          <StepDot num={1} label="بيانات الحق" active={step === 'form'} done={step !== 'form'} />
          <div className={`bc-step-connector${step !== 'form' ? ' bc-connector-done' : ''}`} />
          <StepDot num={2} label="تأكيد ودفع" active={step === 'confirm'} done={step === 'success'} />
          <div className={`bc-step-connector${step === 'success' ? ' bc-connector-done' : ''}`} />
          <StepDot num={3} label="الشهادة" active={step === 'success'} done={false} />
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
              <h1 className="bc-card-title">تسجيل حق فكري جديد</h1>
              <p className="bc-card-desc">أدخل بيانات الحق لتسجيله على البلوكتشين بشكل دائم وآمن</p>

              <form className="bc-form" onSubmit={handleFormSubmit}>
                <div className="bc-form-group">
                  <label className="bc-label">نوع الحق الفكري</label>
                  <div className="ip-type-grid">
                    {IP_TYPES.map(t => (
                      <button
                        key={t.value}
                        type="button"
                        className={`ip-type-btn${form.ipType === t.value ? ' ip-type-selected' : ''}`}
                        style={{ '--type-color': t.color, '--type-bg': t.bg } as React.CSSProperties}
                        onClick={() => setForm(f => ({ ...f, ipType: t.value }))}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bc-form-group">
                  <label className="bc-label">عنوان الحق <span className="bc-required">*</span></label>
                  <input
                    className="bc-input"
                    placeholder='مثال: رواية "الطريق الطويل"'
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    required
                  />
                </div>

                <div className="bc-form-group">
                  <label className="bc-label">اسم صاحب الحق <span className="bc-required">*</span></label>
                  <input
                    className="bc-input"
                    placeholder="الاسم الكامل لصاحب الحق"
                    value={form.holderName}
                    onChange={e => setForm(f => ({ ...f, holderName: e.target.value }))}
                    required
                  />
                </div>

                <div className="bc-form-group">
                  <label className="bc-label">وصف الحق <span className="bc-optional">(اختياري)</span></label>
                  <textarea
                    className="bc-input bc-textarea"
                    rows={3}
                    placeholder="وصف مختصر للحق الفكري وتفاصيله..."
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>

                {/* رفع الملف */}
                <div className="bc-form-group">
                  <label className="bc-label">
                    الملف المراد حمايته
                    <span className="bc-optional"> (اختياري — صورة، PDF، ...)</span>
                  </label>
                  <label className={`file-upload-zone${file ? ' file-upload-zone--has' : ''}`}>
                    <input type="file" className="file-upload-input" onChange={handleFileChange} accept="*/*" />
                    {!file ? (
                      <>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                        <p className="file-upload-hint">اضغط لاختيار ملف أو اسحبه هنا</p>
                        <p className="file-upload-sub">الحد الأقصى 50 ميغابايت</p>
                      </>
                    ) : (
                      <div className="file-upload-preview">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round">
                          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
                        </svg>
                        <div>
                          <p className="file-upload-name">{file.name}</p>
                          <p className="file-upload-size">{(file.size / 1024).toFixed(1)} KB</p>
                          {hashing && <p className="file-upload-hashing">جاري حساب الهاش...</p>}
                          {fileHash && !hashing && (
                            <p className="file-upload-hash">
                              SHA-256: {fileHash.slice(0, 14)}...{fileHash.slice(-6)}
                            </p>
                          )}
                        </div>
                        <button type="button" className="file-upload-remove" onClick={e => { e.preventDefault(); setFile(null); setFileHash(null) }}>✕</button>
                      </div>
                    )}
                  </label>
                </div>

                <button
                  type="submit"
                  className="btn-bc-primary"
                  disabled={!form.title.trim() || !form.holderName.trim() || hashing}
                >
                  التالي: مراجعة وتأكيد
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
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
              <h1 className="bc-card-title">مراجعة وتأكيد</h1>
              <p className="bc-card-desc">تحقق من البيانات وربط محفظتك قبل الإرسال إلى البلوكتشين</p>

              <p className="bc-section-label">حالة المحفظة</p>
              <WalletConnect />

              <p className="bc-section-label" style={{ marginTop: 28 }}>ملخص بيانات الحق</p>
              <div className="bc-review-box">
                <div className="bc-review-row">
                  <span className="bc-review-key">النوع</span>
                  <span className="ip-badge" style={{ background: ipTypeInfo.bg, color: ipTypeInfo.color }}>
                    {ipTypeInfo.label}
                  </span>
                </div>
                <div className="bc-review-row">
                  <span className="bc-review-key">العنوان</span>
                  <span className="bc-review-val">{form.title}</span>
                </div>
                <div className="bc-review-row">
                  <span className="bc-review-key">صاحب الحق</span>
                  <span className="bc-review-val">{form.holderName}</span>
                </div>
                {form.description && (
                  <div className="bc-review-row">
                    <span className="bc-review-key">الوصف</span>
                    <span className="bc-review-val">{form.description}</span>
                  </div>
                )}
                {file && (
                  <div className="bc-review-row">
                    <span className="bc-review-key">الملف</span>
                    <span className="bc-review-val bc-mono-sm">{file.name}</span>
                  </div>
                )}
                {fileHash && (
                  <div className="bc-review-row">
                    <span className="bc-review-key">هاش الملف</span>
                    <span className="bc-review-val bc-mono-sm">{fileHash.slice(0, 14)}...{fileHash.slice(-6)}</span>
                  </div>
                )}
              </div>

              {error && <div className="bc-alert bc-alert-error">{error}</div>}

              <div className="bc-gas-note">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                ستُرسل معاملة إلى Sepolia Testnet. تأكد من توفر ETH تجريبي لرسوم الغاز.
              </div>

              <div className="bc-confirm-actions">
                <button className="btn-bc-ghost" onClick={() => { setStep('form'); setError(null) }} disabled={processing}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                  السابق
                </button>
                <button
                  className="btn-bc-primary"
                  onClick={handleRegister}
                  disabled={!wallet.isConnected || !wallet.isSepolia || processing}
                >
                  {processing
                    ? <><span className="btn-spinner" /> جاري التسجيل...</>
                    : <>تسجيل الآن</>}
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
              <h1 className="bc-success-title">تم التسجيل بنجاح!</h1>
              <p className="bc-card-desc">تم تسجيل حقك الفكري على البلوكتشين بشكل دائم وثابت</p>

              <div className="bc-cert-result-box">
                <div className="bc-cert-row-item">
                  <span className="bc-cert-rkey">رقم الشهادة</span>
                  <span className="bc-cert-rval bc-cert-id-big">#{result.certId}</span>
                </div>
                <div className="bc-cert-row-item">
                  <span className="bc-cert-rkey">معرف المعاملة (TxHash)</span>
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
                  <span className="bc-cert-rkey">هاش الوثيقة</span>
                  <span className="bc-cert-rval bc-mono-sm">{result.documentHash.slice(0, 18)}...{result.documentHash.slice(-8)}</span>
                </div>
                <div className="bc-cert-row-item">
                  <span className="bc-cert-rkey">رقم الكتلة</span>
                  <span className="bc-cert-rval">{result.blockNumber}</span>
                </div>
              </div>

              <div className="bc-success-actions">
                <Link to="/certificates" className="btn-bc-primary">عرض شهاداتي</Link>
                <Link to="/verify" className="btn-bc-outline">التحقق من شهادة</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
