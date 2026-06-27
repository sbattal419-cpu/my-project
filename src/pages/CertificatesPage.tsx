// ════════════════════════════════════════════════════════════════
// FILE: src/pages/CertificatesPage.tsx
// صفحة شهاداتي — عرض وإدارة الحقوق المسجّلة
// المصدر الأساسي: Supabase (إذا مسجّل دخول) أو البلوكشين (بالمحفظة)
// للتعديل:
//   جلب الشهادات  → ابحث عن loadCerts
//   نقل الملكية   → ابحث عن handleTransfer
//   مودال النقل   → ابحث عن Transfer Modal
//   بطاقة الشهادة → ابحث عن CertCard
// ════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback, useRef } from 'react'
import InfoTip from '../components/InfoTip'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useWallet } from '../hooks/useWallet'
import { fetchOwnerCertificates, transferCertOnChain } from '../lib/blockchain'
import { getUserCerts, type RightsRow } from '../lib/supabase-ipr'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { IP_TYPES, BLOCKCHAIN } from '../config/blockchain.config'
import type { CertificateData } from '../lib/blockchain'
import WalletConnect from '../components/WalletConnect'

const EASE = 'easeOut' as const

function CopyHashBtn({ hash }: { hash: string }) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const copy = () => {
    navigator.clipboard.writeText(hash).then(() => {
      setCopied(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button className="bc-copy-btn" onClick={copy} title="نسخ الهاش">
      {copied ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  )
}

function CertCard({ cert, onTransfer }: { cert: CertificateData; onTransfer: () => void }) {
  const { t, lang } = useLang()
  const ipType = IP_TYPES[cert.ipType] ?? IP_TYPES[0]
  return (
    <motion.div
      className="cert-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ease: EASE }}
    >
      <div className="cert-card-top">
        <span className="ip-badge" style={{ background: ipType.bg, color: ipType.color }}>
          {t(ipType.labelKey)}
        </span>
        <span className="cert-card-id">#{cert.certId}</span>
      </div>

      <h3 className="cert-card-title">{cert.title}</h3>
      <p className="cert-card-holder">{cert.holderName}</p>

      <div className="cert-card-meta">
        <span className="cert-card-date">
          {cert.registeredAt.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
        <span className={`cert-card-status${cert.isValid ? ' cert-valid' : ' cert-invalid'}`}>
          {cert.isValid ? t('my.valid') : t('my.revoked')}
          <InfoTip
            term={cert.isValid ? 'شهادة صالحة' : 'شهادة ملغاة'}
            explanation={cert.isValid
              ? 'الشهادة نشطة ومعترف بها رسمياً على البلوكشين. يمكن التحقق منها في أي وقت.'
              : 'تم إلغاء هذه الشهادة رسمياً. لا تزال مسجلة في البلوكشين كسجل تاريخي لكنها لم تعد سارية المفعول.'}
          />
        </span>
      </div>

      <div className="cert-card-hash">
        <span className="cert-card-hash-label">
          {t('my.doc.hash')}
          <InfoTip term="هاش الوثيقة" explanation="البصمة الرقمية الفريدة لملفك. انسخها واحتفظ بها — يمكنك مقارنتها بأي نسخة من الملف لإثبات أصالتها." />
        </span>
        <div className="bc-hash-row">
          <span className="cert-card-hash-val">{cert.documentHash.slice(0, 14)}...{cert.documentHash.slice(-8)}</span>
          <CopyHashBtn hash={cert.documentHash} />
        </div>
      </div>

      {cert.isValid && (
        <div className="cert-stamp" aria-hidden="true">
          <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <path id="top-arc" d="M 12,50 A 38,38 0 0,1 88,50" />
              <path id="bot-arc" d="M 18,58 A 38,38 0 0,0 82,58" />
            </defs>
            <circle cx="50" cy="50" r="46" fill="none" stroke="#2563eb" strokeWidth="2.5" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="#2563eb" strokeWidth="1.2" strokeDasharray="3.5 2.5" />
            <text fontSize="9.5" fill="#2563eb" fontWeight="700" fontFamily="Arial, sans-serif" letterSpacing="1.5">
              <textPath href="#top-arc" startOffset="50%" textAnchor="middle">معتمد رسمياً</textPath>
            </text>
            <text fontSize="8.5" fill="#2563eb" fontWeight="600" fontFamily="Arial, sans-serif" letterSpacing="1">
              <textPath href="#bot-arc" startOffset="50%" textAnchor="middle">ملكية فكرية</textPath>
            </text>
            <path d="M50 24L62 30V42C62 51 50 57 50 57C50 57 38 51 38 42V30Z" fill="rgba(37,99,235,0.12)" stroke="#2563eb" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M44 41L48 45L57 35" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>
      )}

      <div className="cert-card-actions">
        <a
          href={`${BLOCKCHAIN.EXPLORER}/address/${cert.owner}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-cert-explorer"
        >
          Etherscan
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
        <InfoTip term="Etherscan" explanation="موقع مستقل يعرض جميع معاملات البلوكشين. اضغط لرؤية عنوان محفظتك وجميع الحقوق المسجلة عليها بشكل عام وشفاف." />
        {cert.isValid && (
          <button className="btn-cert-transfer" onClick={onTransfer}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
            {t('my.transfer.btn')}
          </button>
        )}
      </div>
    </motion.div>
  )
}

export default function CertificatesPage() {
  const wallet  = useWallet()
  const { user } = useAuth()
  const { t } = useLang()
  const [certs, setCerts] = useState<CertificateData[]>([])
  const [source, setSource] = useState<'supabase' | 'blockchain'>('blockchain')
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [transferCertId, setTransferCertId] = useState<string | null>(null)
  const [toAddress, setToAddress] = useState('')
  const [transferring, setTransferring] = useState(false)
  const [transferError, setTransferError] = useState<string | null>(null)
  const [transferSuccess, setTransferSuccess] = useState(false)

  const isReady = wallet.isConnected && wallet.isSepolia

  // loadCerts — جلب الشهادات من Supabase أو البلوكشين
  // إذا user موجود → getUserCerts من Supabase (أسرع وأكمل بيانات)
  // إذا لا user → fetchOwnerCertificates من البلوكشين (بعنوان المحفظة)

  // userId مستخرج مسبقاً من user?.id لتجنب حلقة تحميل لانهائية:
  // user هو كائن Object يتغير reference عند كل render حتى لو البيانات نفسها
  // → وضعه في deps useCallback يُعيد إنشاء loadCerts كل render → useEffect يستدعيه كل render
  // الحل: استخدم userId (string | null) بدلاً من user في الـ deps
  const userId = user?.id ?? null

  const loadCerts = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      if (userId) {
        const rows = await getUserCerts(userId)
        setSource('supabase')
        setCerts(rows.map((r: RightsRow) => ({
          certId:       r.cert_id,
          owner:        r.wallet_address,
          documentHash: r.document_hash,
          ipType:       r.ip_type,
          title:        r.title,
          description:  r.description,
          holderName:   r.holder_name,
          registeredAt: new Date(r.created_at),
          isValid:      true,
        })))
      } else if (wallet.address) {
        setSource('blockchain')
        const data = await fetchOwnerCertificates(wallet.address)
        setCerts(data)
      }
    } catch (err) {
      setLoadError((err as Error).message || 'فشل تحميل الشهادات')
    } finally {
      setLoading(false)
    }
  }, [userId, wallet.address]) // userId و wallet.address فقط — لا user كاملاً

  useEffect(() => {
    if (userId || (isReady && wallet.address)) {
      loadCerts()
    }
  }, [userId, isReady, wallet.address]) // loadCerts محذوف من الـ deps لأنه مشتق منهم

  // handleTransfer — نقل ملكية شهادة على البلوكشين
  // يستدعي transferCertOnChain ثم يُعيد تحميل الشهادات
  const handleTransfer = async () => {
    if (!transferCertId || !toAddress.trim()) return
    setTransferring(true)
    setTransferError(null)
    setTransferSuccess(false)
    try {
      await transferCertOnChain(transferCertId, toAddress.trim())
      setTransferSuccess(true)
      setTimeout(() => {
        setTransferCertId(null)
        setToAddress('')
        setTransferSuccess(false)
        loadCerts()
      }, 2000)
    } catch (err) {
      const msg = (err as Error).message ?? ''
      if (msg.toLowerCase().includes('user rejected') || msg.toLowerCase().includes('rejected')) {
        setTransferError(t('my.err.rejected'))
      } else {
        setTransferError(t('my.err.failed'))
      }
    } finally {
      setTransferring(false)
    }
  }

  const closeModal = () => {
    if (transferring) return
    setTransferCertId(null)
    setToAddress('')
    setTransferError(null)
    setTransferSuccess(false)
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

        <WalletConnect showDisconnect={false} />
      </header>

      <main className="bc-main">
        <div className="bc-page-head">
          <div className="bc-page-head-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <h1 className="bc-page-title">{t('my.page.title')}</h1>
          <p className="bc-page-desc">{t('my.page.desc')}</p>
        </div>

        {!isReady ? (
          <div className="bc-wallet-prompt-card">
            <div className="bc-wpc-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <h2 className="bc-wpc-title">{t('my.wallet.req')}</h2>
            <p className="bc-wpc-desc">{t('my.wallet.desc')}</p>
            <WalletConnect />
          </div>
        ) : loading ? (
          <div className="bc-loading-state">
            <div className="bc-spinner" />
            <p>{t('my.loading')}</p>
          </div>
        ) : loadError ? (
          <div className="bc-alert bc-alert-error">{loadError}</div>
        ) : certs.length === 0 ? (
          <div className="bc-empty-state">
            <div className="bc-empty-icon">
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" />
              </svg>
            </div>
            <h2 className="bc-empty-title">{t('my.empty.title')}</h2>
            <p className="bc-empty-desc">{t('my.empty.desc')}</p>
            <Link to="/register-right" className="btn-bc-primary">
              {t('vfy.link.reg')}
            </Link>
          </div>
        ) : (
          <>
            <div className="bc-certs-header">
              <span className="bc-certs-count">{certs.length} {t('my.cert.registered')}</span>
              <span className="bc-source-badge" title={source === 'supabase' ? 'Supabase' : 'Blockchain'}>
                {source === 'supabase' ? '⚡ Supabase' : '⛓ Blockchain'}
              </span>
              <button className="btn-bc-outline btn-bc-sm" onClick={loadCerts} disabled={loading}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                {t('my.refresh')}
              </button>
            </div>
            <div className="bc-certs-grid">
              {certs.map(cert => (
                <CertCard
                  key={cert.certId}
                  cert={cert}
                  onTransfer={() => { setTransferCertId(cert.certId); setTransferError(null) }}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Transfer Modal */}
      <AnimatePresence>
        {transferCertId && (
          <motion.div
            className="bc-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="bc-modal"
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 20 }}
              transition={{ ease: EASE }}
              onClick={e => e.stopPropagation()}
            >
              {transferSuccess ? (
                <div className="bc-modal-success">
                  <div className="bc-success-icon bc-success-icon-sm">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p>{t('my.success.transfer')}</p>
                </div>
              ) : (
                <>
                  <div className="bc-modal-header">
                    <h2 className="bc-modal-title">{t('my.modal.title')} #{transferCertId}</h2>
                    <button className="bc-modal-close" onClick={closeModal}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>

                  <p className="bc-modal-desc">{t('my.modal.desc')}</p>

                  <div className="bc-form-group">
                    <label className="bc-label">{t('my.wallet.recipient')}</label>
                    <input
                      className="bc-input bc-mono"
                      placeholder="0x..."
                      value={toAddress}
                      onChange={e => setToAddress(e.target.value)}
                      disabled={transferring}
                    />
                  </div>

                  {transferError && (
                    <div className="bc-alert bc-alert-error">{transferError}</div>
                  )}

                  <div className="bc-modal-warn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    {t('my.modal.warn')}
                  </div>

                  <div className="bc-modal-actions">
                    <button className="btn-bc-ghost" onClick={closeModal} disabled={transferring}>
                      {t('cancel')}
                    </button>
                    <button
                      className="btn-bc-primary"
                      onClick={handleTransfer}
                      disabled={!toAddress.trim() || transferring}
                    >
                      {transferring
                        ? <><span className="btn-spinner" /> {t('my.transferring')}</>
                        : t('my.confirm.transfer')}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
