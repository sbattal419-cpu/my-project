import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'
import { IP_TYPES } from '../config/blockchain.config'
import { getAllRights, type RightsRow } from '../lib/supabase-ipr'

const EASE = 'easeOut' as const

// ── Star component ────────────────────────────────────────────────────────────
function Stars({
  value, max = 5, size = 32, interactive = false, onChange,
}: {
  value: number; max?: number; size?: number; interactive?: boolean; onChange?: (v: number) => void
}) {
  const [hover, setHover] = useState(0)
  const display = interactive ? (hover || value) : value
  return (
    <div className="stars-row" onMouseLeave={() => interactive && setHover(0)}>
      {Array.from({ length: max }, (_, i) => i + 1).map(i => (
        <button
          key={i}
          type="button"
          className={`star-btn${display >= i ? ' star-filled' : ''}`}
          style={{ fontSize: size }}
          onClick={() => interactive && onChange?.(i)}
          onMouseEnter={() => interactive && setHover(i)}
          disabled={!interactive}
          aria-label={`${i}`}
        >★</button>
      ))}
    </div>
  )
}

// ── Right card ────────────────────────────────────────────────────────────────
function RightCard({ row }: { row: RightsRow }) {
  const { t, lang } = useLang()
  const ipType = IP_TYPES[row.ip_type] ?? IP_TYPES[0]
  return (
    <motion.div className="pub-right-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: EASE }}>
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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PublicRegistryPage() {
  const { t } = useLang()
  const [rights, setRights] = useState<RightsRow[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<number | null>(null)

  useEffect(() => {
    getAllRights()
      .then(setRights)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

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
            {filtered.map(row => <RightCard key={row.id} row={row} />)}
          </div>
        )}

      </main>
    </div>
  )
}
