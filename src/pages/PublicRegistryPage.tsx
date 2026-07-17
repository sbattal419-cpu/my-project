// ════════════════════════════════════════════════════════════════
// FILE: src/pages/PublicRegistryPage.tsx
// السجل العام — يعرض كل الحقوق المسجّلة (بدون تسجيل دخول)
// للتعديل:
//   بطاقة الحق    → ابحث عن RightCard
//   فلتر النوع    → ابحث عن typeFilter
//   البحث بالنص   → ابحث عن query
//   نافذة التفاصيل → ابحث عن CertDetailModal
// البيانات: getAllRights() من Supabase (آخر 100 حق)
// رابط QR: /registry?cert=123 يفتح الصفحة ويعرض تفاصيل الشهادة تلقائياً
//          (إن لم تكن ضمن الـ100 الأحدث تُجلب مباشرة بـ getRightByCertId)
// ════════════════════════════════════════════════════════════════
import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useSearchParams } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import { IP_TYPES } from '../config/blockchain.config'
import { getAllRights, getRightByCertId, type RightsRow } from '../lib/supabase-ipr'

const EASE = 'easeOut' as const

// ── Right card ────────────────────────────────────────────────────────────────
// onOpen: يفتح نافذة التفاصيل (النقر على البطاقة أو مسح رمز QR كلاهما يؤدي لنفس النافذة)
function RightCard({ row, onOpen }: { row: RightsRow; onOpen: (row: RightsRow) => void }) {
  const { t, lang } = useLang()
  const ipType = IP_TYPES[row.ip_type] ?? IP_TYPES[0]
  return (
    <motion.div
      className="pub-right-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ease: EASE }}
      onClick={() => onOpen(row)}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(row) } }}
      style={{ cursor: 'pointer' }}
    >
      <div className="pub-card-top">
        <span className="ip-badge" style={{ background: ipType.bg, color: ipType.color }}>
          {t(ipType.labelKey)}
        </span>
        <span className="pub-card-cert">#{row.cert_id}</span>
      </div>
      <h3 className="pub-card-title">{row.title}</h3>
      <p className="pub-card-holder">
        <span className="pub-card-holder-label">{t('pub.holder')}:</span> {row.holder_name}
      </p>
      {row.description && <p className="pub-card-desc-text">{row.description}</p>}
      <div className="pub-card-footer">
        <span className="pub-card-date">
          {new Date(row.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
        <span className="pub-card-hash">{row.document_hash.slice(0, 10)}…</span>
      </div>
    </motion.div>
  )
}

// ── CertDetailModal ───────────────────────────────────────────────────────────
// نافذة تفاصيل شهادة واحدة — تُفتح بالنقر على بطاقة أو عبر رابط QR (?cert=123)
// الأنماط inline بالكامل حتى تعمل دون أي تعديل على ملفات CSS
function CertDetailModal({ row, loading, notFound, onClose }: {
  row: RightsRow | null
  loading: boolean
  notFound: boolean
  onClose: () => void
}) {
  const { t, lang } = useLang()

  // إغلاق بمفتاح Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const ipType = row ? (IP_TYPES[row.ip_type] ?? IP_TYPES[0]) : null

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.75)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 1000,
  }
  const panel: React.CSSProperties = {
    background: '#0f172a', border: '1px solid rgba(59,130,246,0.35)', borderRadius: 16,
    padding: 24, width: '100%', maxWidth: 540, maxHeight: '85vh', overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)', position: 'relative',
  }
  const rowStyle: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', gap: 12,
    padding: '10px 0', borderBottom: '1px solid rgba(148,163,184,0.14)', fontSize: 14,
  }
  const labelStyle: React.CSSProperties = { color: '#94a3b8', whiteSpace: 'nowrap' }
  const valueStyle: React.CSSProperties = { color: '#e2e8f0', fontWeight: 600, wordBreak: 'break-all', textAlign: 'end' }

  return (
    <div style={overlay} onClick={onClose}>
      <motion.div
        style={panel}
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ ease: EASE, duration: 0.18 }}
      >
        <button
          onClick={onClose}
          aria-label="close"
          style={{
            position: 'absolute', top: 12, insetInlineEnd: 12, background: 'transparent',
            border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: 4,
          }}
        >×</button>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <div className="bc-spinner" />
          </div>
        ) : notFound || !row ? (
          <div style={{ textAlign: 'center', padding: '32px 8px' }}>
            <h2 style={{ color: '#e2e8f0', margin: '0 0 8px' }}>{t('pub.empty.title')}</h2>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: 14 }}>{t('pub.empty.desc')}</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span className="ip-badge" style={{ background: ipType!.bg, color: ipType!.color }}>
                {t(ipType!.labelKey)}
              </span>
              <span style={{ color: '#64748b', fontSize: 13, fontWeight: 700 }}>#{row.cert_id}</span>
            </div>

            <h2 style={{ color: '#f1f5f9', margin: '0 0 10px', fontSize: 22, lineHeight: 1.35 }}>{row.title}</h2>
            {row.description && (
              <p style={{ color: '#94a3b8', margin: '0 0 16px', fontSize: 14, lineHeight: 1.7 }}>{row.description}</p>
            )}

            <div style={rowStyle}>
              <span style={labelStyle}>{t('pub.holder')}</span>
              <span style={valueStyle}>{row.holder_name}</span>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>{t('vfy.f.cert.id')}</span>
              <span style={valueStyle}>#{row.cert_id}</span>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>{t('vfy.f.reg.date')}</span>
              <span style={valueStyle}>
                {new Date(row.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>{t('vfy.f.doc.hash')}</span>
              <span style={{ ...valueStyle, fontFamily: 'monospace', fontSize: 12 }}>{row.document_hash}</span>
            </div>
            {row.wallet_address && (
              <div style={rowStyle}>
                <span style={labelStyle}>Wallet</span>
                <span style={{ ...valueStyle, fontFamily: 'monospace', fontSize: 12 }}>{row.wallet_address}</span>
              </div>
            )}
            {row.tx_hash && (
              <div style={{ ...rowStyle, borderBottom: 'none' }}>
                <span style={labelStyle}>Tx</span>
                <a
                  href={`https://sepolia.etherscan.io/tx/${row.tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...valueStyle, color: '#60a5fa', fontFamily: 'monospace', fontSize: 12 }}
                >
                  {row.tx_hash.slice(0, 14)}…{row.tx_hash.slice(-8)}
                </a>
              </div>
            )}

            <Link
              to="/verify"
              style={{
                display: 'block', textAlign: 'center', marginTop: 18, padding: '11px 16px',
                background: 'rgba(37,99,235,0.18)', border: '1px solid rgba(59,130,246,0.45)',
                borderRadius: 10, color: '#93c5fd', textDecoration: 'none', fontWeight: 700, fontSize: 14,
              }}
            >
              {lang === 'ar' ? 'التحقق من الشهادة' : 'Verify certificate'}
            </Link>
          </>
        )}
      </motion.div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PublicRegistryPage() {
  const { t } = useLang()
  const [rights, setRights] = useState<RightsRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<number | null>(null)

  // ── فتح شهادة محددة عبر الرابط: /registry?cert=123 (رمز QR على الشهادة المطبوعة)
  const [searchParams, setSearchParams] = useSearchParams()
  const certParam = searchParams.get('cert')
  const [selected, setSelected] = useState<RightsRow | null>(null)
  const [certLoading, setCertLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    getAllRights()
      .then(setRights)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // يبحث عن الشهادة داخل القائمة المحمّلة أولاً (بدون طلب شبكة)،
  // وإن لم توجد (أقدم من آخر 100) يجلبها مباشرة من Supabase
  useEffect(() => {
    if (!certParam) { setSelected(null); setNotFound(false); return }

    const local = rights.find(r => String(r.cert_id) === certParam)
    if (local) { setSelected(local); setNotFound(false); return }
    if (loading) return // انتظر تحميل القائمة قبل طلب إضافي

    let cancelled = false
    setCertLoading(true)
    setNotFound(false)
    getRightByCertId(certParam)
      .then(row => { if (!cancelled) { setSelected(row); setNotFound(!row) } })
      .catch(() => { if (!cancelled) { setSelected(null); setNotFound(true) } })
      .finally(() => { if (!cancelled) setCertLoading(false) })
    return () => { cancelled = true }
  }, [certParam, rights, loading])

  // فتح/إغلاق النافذة عبر الرابط حتى يكون قابلاً للمشاركة والرجوع بزر المتصفح
  const openCert = (row: RightsRow) => setSearchParams({ cert: String(row.cert_id) })
  const closeCert = () => setSearchParams({})

  // filtered — يُحسَّب تلقائياً عند تغيير query أو typeFilter
  // يُصفّي بالنوع أولاً ثم بنص البحث (العنوان أو صاحب الحق)
  const filtered = useMemo(() => {
    let list = rights
    if (typeFilter !== null) list = list.filter(r => r.ip_type === typeFilter)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(r => r.title.toLowerCase().includes(q) || r.holder_name.toLowerCase().includes(q))
    }
    return list
  }, [rights, query, typeFilter])

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
            <path d="M22 5L38 12V26C38 35 22 42 22 42C22 42 6 35 6 26V12L22 5Z" fill="rgba(37,99,235,0.18)" stroke="#3b82f6" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M14 22L19.5 28.5L30 16" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{t('pg.brand')}</span>
        </div>
        <div style={{ width: 160 }} />
      </header>

      <main className="bc-main">
        {/* Page head */}
        <div className="bc-page-head">
          <div className="bc-page-head-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <h1 className="bc-page-title">{t('pub.page.title')}</h1>
          <p className="bc-page-desc">{t('pub.page.desc')}</p>
          {!loading && (
            <span className="pub-total-badge">{rights.length} {t('pub.total')}</span>
          )}
        </div>

        {/* Search */}
        <div className="pub-search-row">
          <div className="pub-search-wrap">
            <svg className="pub-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              className="bc-input pub-search-input"
              placeholder={t('pub.search.ph')}
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Type filter chips */}
        <div className="pub-filter-chips">
          <button
            className={`pub-chip${typeFilter === null ? ' pub-chip-active' : ''}`}
            onClick={() => setTypeFilter(null)}
          >
            {t('pub.filter.all')}
          </button>
          {IP_TYPES.map(tp => (
            <button
              key={tp.value}
              className={`pub-chip${typeFilter === tp.value ? ' pub-chip-active' : ''}`}
              style={typeFilter === tp.value ? {} : { borderColor: tp.color, color: tp.color }}
              onClick={() => setTypeFilter(typeFilter === tp.value ? null : tp.value)}
            >
              {t(tp.labelKey)}
            </button>
          ))}
        </div>

        {/* Rights grid */}
        {loading ? (
          <div className="bc-loading-state">
            <div className="bc-spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bc-empty-state">
            <h2 className="bc-empty-title">{t('pub.empty.title')}</h2>
            <p className="bc-empty-desc">{t('pub.empty.desc')}</p>
          </div>
        ) : (
          <div className="pub-rights-grid">
            {filtered.map(row => <RightCard key={row.id} row={row} onOpen={openCert} />)}
          </div>
        )}

      </main>

      {/* نافذة تفاصيل الشهادة — تظهر عند وجود ?cert= في الرابط */}
      <AnimatePresence>
        {certParam && (
          <CertDetailModal
            key="cert-modal"
            row={selected}
            loading={certLoading}
            notFound={notFound}
            onClose={closeCert}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
