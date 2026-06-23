// ════════════════════════════════════════════════════════════════
// FILE: src/pages/VerifyPage.tsx
// صفحة التحقق من الشهادات — بدون تسجيل دخول
// طريقتان للبحث:
//   id   → fetchCertificate(certId) مباشرة من البلوكشين
//   hash → verifyByHash(hash) يُرجع certId ثم fetchCertificate
// للتعديل:
//   البحث → ابحث عن handleSearch
//   عرض النتيجة → ابحث عن CertResult
// ════════════════════════════════════════════════════════════════
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { fetchCertificate, verifyByHash, truncateAddress } from '../lib/blockchain'
import { IP_TYPES, BLOCKCHAIN } from '../config/blockchain.config'
import { useLang } from '../context/LanguageContext'
import InfoTip from '../components/InfoTip'
import type { CertificateData } from '../lib/blockchain'

const EASE = 'easeOut' as const

type Tab = 'id' | 'hash'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button className="bc-copy-btn" onClick={copy} title="نسخ">
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  )
}

function CertResult({ cert }: { cert: CertificateData }) {
  const { t, lang } = useLang()
  const ipType = IP_TYPES[cert.ipType] ?? IP_TYPES[0]
  const verifyUrl = `${window.location.origin}/verify?id=${cert.certId}`
  return (
    <div className="bc-verify-result">
      <div className="bc-verify-result-header">
        <div className="bc-verify-result-title-row">
          <span className="ip-badge" style={{ background: ipType.bg, color: ipType.color }}>
            {t(ipType.labelKey)}
          </span>
          <h2 className="bc-verify-title">{cert.title}</h2>
        </div>
        <div className={`bc-validity-badge${cert.isValid ? ' bc-valid' : ' bc-invalid'}`}>
          {cert.isValid ? (
            <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> {t('vfy.valid')}</>
          ) : (
            <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg> {t('vfy.revoked')}</>
          )}
        </div>
      </div>

      <div className="bc-verify-body">
        <div className="bc-verify-details">
          <div className="bc-vd-row">
            <span className="bc-vd-key">
              {t('vfy.f.cert.id')}
              <InfoTip term="رقم الشهادة" explanation="المعرّف الفريد لشهادتك على البلوكشين. استخدمه للبحث والتحقق في أي وقت." />
            </span>
            <span className="bc-vd-val bc-cert-num">#{cert.certId}</span>
          </div>
          <div className="bc-vd-row">
            <span className="bc-vd-key">{t('vfy.f.holder')}</span>
            <span className="bc-vd-val">{cert.holderName}</span>
          </div>
          <div className="bc-vd-row">
            <span className="bc-vd-key">
              {t('vfy.f.bc.owner')}
              <InfoTip term="عنوان المحفظة" explanation="عنوانك الفريد على شبكة البلوكشين. مثل رقم حسابك المصرفي — عام ويمكن مشاركته، لكن المفتاح الخاص للمحفظة يجب أن يبقى سرياً." />
            </span>
            <span className="bc-vd-val bc-mono">{truncateAddress(cert.owner)}</span>
          </div>
          <div className="bc-vd-row">
            <span className="bc-vd-key">{t('vfy.f.reg.date')}</span>
            <span className="bc-vd-val">
              {cert.registeredAt.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          {cert.description && (
            <div className="bc-vd-row">
              <span className="bc-vd-key">{t('vfy.f.desc')}</span>
              <span className="bc-vd-val">{cert.description}</span>
            </div>
          )}
          <div className="bc-vd-row bc-vd-row-hash">
            <span className="bc-vd-key">
              {t('vfy.f.doc.hash')}
              <InfoTip term="هاش الوثيقة" explanation="البصمة الرقمية للملف المسجّل. يمكنك التحقق منها بنفسك: احسب هاش ملفك وقارنه بهذا الرقم — أي تطابق يعني أن الملف أصلي ولم يُعدَّل." />
            </span>
            <div className="bc-hash-row">
              <span className="bc-vd-val bc-mono bc-hash-break">{cert.documentHash.slice(0, 20)}...{cert.documentHash.slice(-10)}</span>
              <CopyButton text={cert.documentHash} />
            </div>
          </div>
        </div>

        <div className="bc-verify-qr">
          <QRCodeSVG value={verifyUrl} size={120} bgColor="transparent" fgColor="#60a5fa" level="M" />
          <p className="bc-qr-label">
            {t('vfy.qr.label')}
            <InfoTip term="رمز QR" explanation="امسحه بكاميرا هاتفك مباشرة. سيفتح صفحة التحقق من هذه الشهادة تلقائياً — يمكن مشاركته مع أي جهة للتحقق الفوري." size={12} />
          </p>
        </div>
      </div>

      <div className="bc-verify-actions bc-verify-actions-row">
        <a
          href={`${BLOCKCHAIN.EXPLORER}/address/${cert.owner}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-bc-outline btn-bc-sm"
        >
          {t('vfy.etherscan')}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
        <InfoTip
          term="Etherscan"
          explanation="موقع مستقل يعرض جميع معاملات شبكة Ethereum علناً. يمكنك التحقق من شهادتك بشكل مستقل تماماً دون الحاجة للمنصة."
          size={16}
        />
      </div>
    </div>
  )
}

export default function VerifyPage() {
  const { t } = useLang()
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

  // handleSearch — يبحث عن الشهادة حسب التبويب المختار
  // tab='id'   → fetchCertificate مباشرة
  // tab='hash' → verifyByHash أولاً (يُرجع certId) ثم fetchCertificate
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
        if (id === '0') throw new Error('no_hash')
        certId = id
      }
      const data = await fetchCertificate(certId)
      setCert(data)
    } catch (err) {
      const msg = (err as Error).message ?? ''
      if (msg === 'no_hash') {
        setError(t('vfy.err.no.hash'))
      } else if (msg.includes('Certificate not found') || msg.includes('not found')) {
        setError(t('vfy.err.no.id'))
      } else {
        setError(t('vfy.err.fail'))
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

        <div style={{ width: 200 }} />
      </header>

      <main className="bc-main">
        <div className="bc-page-head">
          <div className="bc-page-head-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <h1 className="bc-page-title">{t('vfy.page.title')}</h1>
          <p className="bc-page-desc">{t('vfy.page.desc')}</p>
        </div>

        <div className="bc-card">
          <div className="bc-tabs">
            <button
              className={`bc-tab${tab === 'id' ? ' bc-tab-active' : ''}`}
              onClick={() => reset('id')}
            >
              {t('vfy.tab.id')}
            </button>
            <button
              className={`bc-tab${tab === 'hash' ? ' bc-tab-active' : ''}`}
              onClick={() => reset('hash')}
            >
              {t('vfy.tab.hash')}
            </button>
          </div>

          <div className="bc-search-row">
            <input
              className="bc-input bc-search-input"
              placeholder={tab === 'id' ? t('vfy.ph.id') : t('vfy.ph.hash')}
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
                ? <><span className="btn-spinner" /> {t('vfy.searching')}</>
                : <>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                  {t('vfy.search')}
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
            {t('vfy.link.reg')}
          </Link>
          <Link to="/certificates" className="btn-bc-outline">
            {t('vfy.link.certs')}
          </Link>
        </div>
      </main>
    </div>
  )
}
