import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { fetchCertificate, verifyByHash, truncateAddress } from '../lib/blockchain'
import { IP_TYPES, BLOCKCHAIN } from '../config/blockchain.config'
import type { CertificateData } from '../lib/blockchain'

const EASE = 'easeOut' as const

type Tab = 'id' | 'hash'

function CertResult({ cert }: { cert: CertificateData }) {
  const ipType = IP_TYPES[cert.ipType] ?? IP_TYPES[0]
  return (
    <div className="bc-verify-result">
      <div className="bc-verify-result-header">
        <div className="bc-verify-result-title-row">
          <span className="ip-badge" style={{ background: ipType.bg, color: ipType.color }}>
            {ipType.label}
          </span>
          <h2 className="bc-verify-title">{cert.title}</h2>
        </div>
        <div className={`bc-validity-badge${cert.isValid ? ' bc-valid' : ' bc-invalid'}`}>
          {cert.isValid ? (
            <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> صالحة</>
          ) : (
            <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg> ملغاة</>
          )}
        </div>
      </div>

      <div className="bc-verify-details">
        <div className="bc-vd-row">
          <span className="bc-vd-key">رقم الشهادة</span>
          <span className="bc-vd-val bc-cert-num">#{cert.certId}</span>
        </div>
        <div className="bc-vd-row">
          <span className="bc-vd-key">صاحب الحق</span>
          <span className="bc-vd-val">{cert.holderName}</span>
        </div>
        <div className="bc-vd-row">
          <span className="bc-vd-key">المالك على البلوكتشين</span>
          <span className="bc-vd-val bc-mono">{truncateAddress(cert.owner)}</span>
        </div>
        <div className="bc-vd-row">
          <span className="bc-vd-key">تاريخ التسجيل</span>
          <span className="bc-vd-val">
            {cert.registeredAt.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
        {cert.description && (
          <div className="bc-vd-row">
            <span className="bc-vd-key">الوصف</span>
            <span className="bc-vd-val">{cert.description}</span>
          </div>
        )}
        <div className="bc-vd-row bc-vd-row-hash">
          <span className="bc-vd-key">هاش الوثيقة</span>
          <span className="bc-vd-val bc-mono bc-hash-break">{cert.documentHash}</span>
        </div>
      </div>

      <div className="bc-verify-actions">
        <a
          href={`${BLOCKCHAIN.EXPLORER}/address/${cert.owner}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-bc-outline btn-bc-sm"
        >
          عرض على Etherscan
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  const [tab, setTab] = useState<Tab>('id')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [cert, setCert] = useState<CertificateData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reset = (newTab: Tab) => {
    setTab(newTab)
    setInput('')
    setCert(null)
    setError(null)
  }

  const handleSearch = async () => {
    const val = input.trim()
    if (!val) return
    setLoading(true)
    setError(null)
    setCert(null)
    try {
      let certId = val
      if (tab === 'hash') {
        const id = await verifyByHash(val)
        if (id === '0') throw new Error('لم يتم العثور على شهادة مسجلة بهذا الهاش')
        certId = id
      }
      const data = await fetchCertificate(certId)
      setCert(data)
    } catch (err) {
      const msg = (err as Error).message ?? ''
      if (msg.includes('Certificate not found') || msg.includes('not found')) {
        setError('لا توجد شهادة بهذا الرقم')
      } else if (msg.includes('لم يتم العثور')) {
        setError(msg)
      } else {
        setError('فشل التحقق. تأكد من صحة القيمة المدخلة.')
      }
    } finally {
      setLoading(false)
    }
  }

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

        <div style={{ width: 200 }} />
      </header>

      <main className="bc-main">
        <div className="bc-page-head">
          <div className="bc-page-head-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <h1 className="bc-page-title">التحقق من الحقوق</h1>
          <p className="bc-page-desc">تحقق من صحة أي حق فكري مسجل على البلوكتشين</p>
        </div>

        <div className="bc-card">
          <div className="bc-tabs">
            <button
              className={`bc-tab${tab === 'id' ? ' bc-tab-active' : ''}`}
              onClick={() => reset('id')}
            >
              بحث برقم الشهادة
            </button>
            <button
              className={`bc-tab${tab === 'hash' ? ' bc-tab-active' : ''}`}
              onClick={() => reset('hash')}
            >
              بحث بهاش الوثيقة
            </button>
          </div>

          <div className="bc-search-row">
            <input
              className="bc-input bc-search-input"
              placeholder={tab === 'id' ? 'أدخل رقم الشهادة (مثال: 1)' : 'أدخل هاش الوثيقة (0x...)'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && handleSearch()}
            />
            <button
              className="btn-bc-primary bc-search-btn"
              onClick={handleSearch}
              disabled={!input.trim() || loading}
            >
              {loading
                ? <><span className="btn-spinner" /> بحث...</>
                : <>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                  بحث
                </>}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="err"
                className="bc-alert bc-alert-error"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {error}
              </motion.div>
            )}
            {cert && (
              <motion.div
                key="cert"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ ease: EASE }}
              >
                <CertResult cert={cert} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="bc-verify-links">
          <Link to="/register-right" className="btn-bc-outline">
            تسجيل حق جديد
          </Link>
          <Link to="/certificates" className="btn-bc-outline">
            شهاداتي الرقمية
          </Link>
        </div>
      </main>
    </div>
  )
}
