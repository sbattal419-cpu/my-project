import { motion } from 'framer-motion'
import { useLang } from '../context/LanguageContext'

const EASE = 'easeOut' as const

const WHY_ITEMS = [
  {
    titleKey: 'why.1.title', descKey: 'why.1.desc',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
  },
  {
    titleKey: 'why.2.title', descKey: 'why.2.desc',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  {
    titleKey: 'why.3.title', descKey: 'why.3.desc',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
    ),
  },
  {
    titleKey: 'why.4.title', descKey: 'why.4.desc',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
  },
  {
    titleKey: 'why.5.title', descKey: 'why.5.desc',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
  },
  {
    titleKey: 'why.6.title', descKey: 'why.6.desc',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
]

const SVC_ITEMS = [
  {
    titleKey: 'svc.1.title', descKey: 'svc.1.desc',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M14.83 14.83a4 4 0 1 1 0-5.66"/>
      </svg>
    ),
  },
  {
    titleKey: 'svc.2.title', descKey: 'svc.2.desc',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
  },
  {
    titleKey: 'svc.3.title', descKey: 'svc.3.desc',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4"/>
        <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
        <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
      </svg>
    ),
  },
  {
    titleKey: 'svc.4.title', descKey: 'svc.4.desc',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="M9 12l2 2 4-4"/>
      </svg>
    ),
  },
]

export default function ServicesSection() {
  const { t } = useLang()

  return (
    <section className="merged-section section" id="services">
      <div className="container">

        {/* ── WHY US ── */}
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <div className="section-badge">{t('why.badge')}</div>
          <h2 className="section-title">{t('why.title')}</h2>
          <p className="section-subtitle">{t('why.subtitle')}</p>
        </motion.div>

        <div className="why-grid">
          {WHY_ITEMS.map((item, i) => (
            <motion.div
              key={item.titleKey}
              className="why-card"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.45, ease: EASE, delay: i * 0.08 }}
              whileHover={{ y: -6 }}
            >
              <div className="why-card-icon">{item.icon}</div>
              <h3 className="why-card-title">{t(item.titleKey)}</h3>
              <p className="why-card-desc">{t(item.descKey)}</p>
            </motion.div>
          ))}
        </div>

        {/* ── DIVIDER ── */}
        <div className="merged-divider">
          <span className="merged-divider-label">{t('svc.badge')}</span>
        </div>

        {/* ── SERVICES ── */}
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <h2 className="section-title">{t('svc.title')}</h2>
          <p className="section-subtitle">{t('svc.subtitle')}</p>
        </motion.div>

        <div className="svc-grid">
          {SVC_ITEMS.map((svc, i) => (
            <motion.div
              key={svc.titleKey}
              className="svc-card"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, ease: EASE, delay: i * 0.1 }}
              whileHover={{ y: -8 }}
            >
              <motion.div
                className="svc-card-icon-wrap"
                whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1 }}
                transition={{ duration: 0.4 }}
              >
                {svc.icon}
              </motion.div>
              <h3 className="svc-card-title">{t(svc.titleKey)}</h3>
              <p className="svc-card-desc">{t(svc.descKey)}</p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}
