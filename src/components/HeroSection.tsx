import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'

const EASE = 'easeOut' as const

export default function HeroSection() {
  const { t } = useLang()

  return (
    <section className="hero-section" id="home">
      <div className="hero-bg-radial" />
      <div className="hero-grid-pattern" />
      <div className="hero-orb hero-orb-1" />
      <div className="hero-orb hero-orb-2" />
      <div className="hero-orb hero-orb-3" />

      <div className="container">
        <div className="hero-inner">

          {/* ── LEFT: Text ── */}
          <div className="hero-content">
            <motion.div
              className="hero-tag"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: EASE, delay: 0.1 }}
            >
              <span className="hero-tag-dot" />
              {t('hero.tag')}
            </motion.div>

            <motion.h1
              className="hero-title"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: EASE, delay: 0.2 }}
            >
              {t('hero.title')}
            </motion.h1>

            <motion.p
              className="hero-desc"
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: EASE, delay: 0.3 }}
            >
              {t('hero.desc')}
            </motion.p>

            <motion.div
              className="hero-why-block"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.38 }}
            >
              <span className="hero-why-label">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </span>
            </motion.div>

            <motion.div
              className="hero-actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: EASE, delay: 0.62 }}
            >
              <Link to="/register-right" className="btn-hero-primary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
                {t('hero.btn.free')}
              </Link>
              <Link to="/verify" className="btn-hero-secondary">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                {t('hero.btn.search')}
              </Link>
            </motion.div>

            <motion.div
              className="hero-trust"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.65, ease: EASE, delay: 0.78 }}
            >
              <span className="hero-trust-dot" />
              {t('hero.trust')}
            </motion.div>
          </div>

          {/* ── RIGHT: Visual ── */}
          <motion.div
            className="hero-visual"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.25 }}
          >
            <div className="hero-shield-wrap">
              <motion.div
                className="hero-shield-glow"
                animate={{ scale: [1, 1.18, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
              />

              <motion.div
                animate={{ y: [-9, 9, -9] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                whileHover={{ scale: 1.04 }}
              >
                <IPIllustration />
              </motion.div>

              <motion.div
                className="hero-float-card"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0, y: [0, -7, 0] }}
                transition={{ opacity: { duration: 0.5, delay: 0.8 }, x: { duration: 0.5, delay: 0.8 }, y: { duration: 3.5, repeat: Infinity, ease: EASE, delay: 1 } }}
              >
                <div className="hero-float-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                  </svg>
                </div>
                <div>
                  <div className="hero-float-num">+10,000</div>
                  <div className="hero-float-sub">{t('hero.float.label')}</div>
                </div>
              </motion.div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}

function IPIllustration() {
  return (
    <svg width="340" height="300" viewBox="0 0 460 380" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="230" cy="310" rx="150" ry="22" fill="rgba(37,99,235,0.14)" />

      <rect x="80" y="40" width="300" height="290" rx="18" fill="url(#ipDocGrad)" />
      <rect x="80" y="40" width="300" height="290" rx="18" stroke="rgba(59,130,246,0.4)" strokeWidth="1.5" />

      <rect x="80" y="40" width="300" height="52" rx="18" fill="rgba(37,99,235,0.25)" />
      <rect x="80" y="70" width="300" height="22" fill="rgba(37,99,235,0.25)" />

      <rect x="110" y="52" width="100" height="7" rx="3.5" fill="rgba(255,255,255,0.85)" />
      <rect x="110" y="65" width="65" height="5" rx="2.5" fill="rgba(255,255,255,0.45)" />

      <circle cx="340" cy="62" r="18" fill="rgba(37,99,235,0.2)" stroke="rgba(96,165,250,0.55)" strokeWidth="1.5" />
      <circle cx="340" cy="62" r="12" fill="none" stroke="rgba(96,165,250,0.3)" strokeWidth="1" strokeDasharray="3 2" />
      <text x="340" y="67" textAnchor="middle" fill="#93c5fd" fontSize="14" fontWeight="700" fontFamily="serif">©</text>

      <rect x="108" y="116" width="244" height="6" rx="3" fill="rgba(255,255,255,0.14)" />
      <rect x="108" y="130" width="220" height="6" rx="3" fill="rgba(255,255,255,0.1)" />
      <rect x="108" y="144" width="200" height="6" rx="3" fill="rgba(255,255,255,0.1)" />
      <rect x="108" y="168" width="244" height="6" rx="3" fill="rgba(255,255,255,0.07)" />
      <rect x="108" y="182" width="180" height="6" rx="3" fill="rgba(255,255,255,0.07)" />
      <rect x="108" y="196" width="210" height="6" rx="3" fill="rgba(255,255,255,0.07)" />

      <circle cx="230" cy="262" r="36" fill="rgba(37,99,235,0.15)" stroke="rgba(96,165,250,0.45)" strokeWidth="1.5" />
      <circle cx="230" cy="262" r="26" fill="rgba(37,99,235,0.1)" />
      <text x="230" y="270" textAnchor="middle" fill="#93c5fd" fontSize="26" fontWeight="800" fontFamily="serif">IP</text>

      <circle cx="52" cy="100" r="28" fill="rgba(37,99,235,0.18)" stroke="rgba(96,165,250,0.45)" strokeWidth="1.5" />
      <text x="52" y="107" textAnchor="middle" fill="#93c5fd" fontSize="22" fontWeight="700" fontFamily="serif">©</text>

      <circle cx="410" cy="260" r="22" fill="rgba(37,99,235,0.15)" stroke="rgba(96,165,250,0.38)" strokeWidth="1.5" />
      <text x="410" y="266" textAnchor="middle" fill="#93c5fd" fontSize="16" fontWeight="700" fontFamily="serif">®</text>

      <circle cx="398" cy="80" r="18" fill="rgba(37,99,235,0.12)" stroke="rgba(96,165,250,0.3)" strokeWidth="1.2" />
      <text x="398" y="86" textAnchor="middle" fill="#93c5fd" fontSize="13" fontWeight="700" fontFamily="serif">™</text>

      <circle cx="62" cy="220" r="5" fill="rgba(59,130,246,0.35)" />
      <circle cx="48" cy="240" r="3" fill="rgba(59,130,246,0.22)" />
      <circle cx="400" cy="150" r="4" fill="rgba(59,130,246,0.28)" />
      <circle cx="418" cy="170" r="3" fill="rgba(59,130,246,0.18)" />

      <rect x="86" y="290" width="94" height="30" rx="15" fill="rgba(34,197,94,0.15)" stroke="rgba(34,197,94,0.4)" strokeWidth="1" />
      <circle cx="105" cy="305" r="8" fill="rgba(34,197,94,0.22)" />
      <path d="M101 305L104 308L110 302" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="118" y="300" width="52" height="5" rx="2.5" fill="rgba(34,197,94,0.5)" />
      <rect x="118" y="309" width="36" height="4" rx="2" fill="rgba(34,197,94,0.3)" />

      <defs>
        <linearGradient id="ipDocGrad" x1="80" y1="40" x2="380" y2="330" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#050d1a" />
          <stop offset="100%" stopColor="#0f2d4e" />
        </linearGradient>
      </defs>
    </svg>
  )
}
