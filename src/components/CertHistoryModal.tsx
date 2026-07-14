// ════════════════════════════════════════════════════════════════
// FILE: src/components/CertHistoryModal.tsx
// مودال يعرض السجل التاريخي الكامل لشهادة: التسجيل + كل عمليات النقل
// المصدر: أحداث البلوكشين (IPRegistered / CertificateTransferred) عبر fetchCertificateHistory
// ════════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchCertificateHistory, truncateAddress, type HistoryEvent } from '../lib/blockchain'
import { BLOCKCHAIN } from '../config/blockchain.config'
import { useLang } from '../context/LanguageContext'

const EASE = 'easeOut' as const

export default function CertHistoryModal({ certId, onClose }: { certId: string; onClose: () => void }) {
  const { t, lang } = useLang()
  const [events, setEvents] = useState<HistoryEvent[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setEvents(null)
    setError(null)
    fetchCertificateHistory(certId)
      .then(data => { if (!cancelled) setEvents(data) })
      .catch(() => { if (!cancelled) setError(t('hist.err')) })
    return () => { cancelled = true }
  }, [certId])

  const fmtDate = (ms: number | null) => ms
    ? new Date(ms).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : t('hist.unknown.date')

  return (
    <motion.div
      className="bc-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bc-modal cert-history-modal"
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 20 }}
        transition={{ ease: EASE }}
        onClick={e => e.stopPropagation()}
      >
        <div className="bc-modal-header">
          <h2 className="bc-modal-title">{t('hist.title')} #{certId}</h2>
          <button className="bc-modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {error && <div className="bc-alert bc-alert-error">{error}</div>}

        {!error && !events && (
          <div className="bc-loading-state">
            <div className="bc-spinner" />
            <p>{t('hist.loading')}</p>
          </div>
        )}

        {!error && events && events.length === 0 && (
          <p className="bc-modal-desc">{t('hist.empty')}</p>
        )}

        {!error && events && events.length > 0 && (
          <ul className="cert-history-timeline">
            <AnimatePresence>
              {events.map((ev, i) => (
                <motion.li
                  key={ev.txHash + i}
                  className={`cert-history-item cert-history-${ev.type}`}
                  initial={{ opacity: 0, x: lang === 'ar' ? 12 : -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, ease: EASE }}
                >
                  <span className="cert-history-dot" aria-hidden="true" />
                  <div className="cert-history-content">
                    <div className="cert-history-head">
                      <span className="cert-history-label">
                        {ev.type === 'registered' ? t('hist.registered') : t('hist.transferred')}
                      </span>
                      <span className="cert-history-date">{fmtDate(ev.timestamp)}</span>
                    </div>
                    {ev.type === 'registered' ? (
                      <p className="cert-history-detail">
                        {t('hist.owner')}: <span className="bc-mono">{truncateAddress(ev.owner!)}</span>
                      </p>
                    ) : (
                      <p className="cert-history-detail">
                        {t('hist.from')} <span className="bc-mono">{truncateAddress(ev.from!)}</span>
                        {' '}{t('hist.to')} <span className="bc-mono">{truncateAddress(ev.to!)}</span>
                      </p>
                    )}
                    <a
                      href={`${BLOCKCHAIN.EXPLORER}/tx/${ev.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cert-history-link"
                    >
                      {t('vfy.etherscan')}
                    </a>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </motion.div>
    </motion.div>
  )
}
