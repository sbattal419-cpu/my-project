import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useLang } from '../context/LanguageContext'

const EASE = 'easeOut' as const

export default function CTASection() {
  const { t } = useLang()

  return (
    <section className="cta-section">
      <div className="container">
        <div className="cta-inner">

          {/* ── Left: Text ── */}
          <motion.div
            className="cta-text-col"
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <div className="cta-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              {t('cta.badge')}
            </div>

            <h2 className="cta-title">{t('cta.title')}</h2>
            <p className="cta-desc">{t('cta.desc')}</p>

            <Link to="/register-right" className="btn-cta">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
              {t('cta.btn')}
            </Link>
          </motion.div>

          {/* ── Right: Ownership proof animation ── */}
          <motion.div
            className="cta-illus-col"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, ease: EASE, delay: 0.15 }}
          >
            <OwnershipCertAnim />
          </motion.div>

        </div>
      </div>
    </section>
  )
}

/* ── Person protecting their rights ── */
function OwnershipCertAnim() {
  return (
    <div style={{ position: 'relative', width: 280, height: 360 }}>
      <svg width="280" height="360" viewBox="0 0 280 360" fill="none" xmlns="http://www.w3.org/2000/svg">

        {/* Ground shadow */}
        <ellipse cx="140" cy="344" rx="72" ry="10" fill="rgba(139,92,246,0.15)" />

        {/* Outer shield — pulsing aura */}
        <motion.path
          d="M140 22 L238 66 L238 188 C238 256 140 298 140 298 C140 298 42 256 42 188 L42 66 Z"
          fill="rgba(79,70,229,0.07)"
          stroke="rgba(139,92,246,0.45)"
          strokeWidth="1.5"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Inner shield dashed */}
        <path
          d="M140 44 L218 80 L218 182 C218 238 140 275 140 275 C140 275 62 238 62 182 L62 80 Z"
          fill="rgba(79,70,229,0.08)"
          stroke="rgba(139,92,246,0.22)"
          strokeWidth="1"
          strokeDasharray="5 3"
        />

        {/* ── Person ── */}
        {/* Head */}
        <motion.circle
          cx="140" cy="104" r="30"
          fill="url(#ctaHGrad)"
          stroke="rgba(167,139,250,0.5)"
          strokeWidth="1.5"
          animate={{ scale: [1, 1.018, 1] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <ellipse cx="129" cy="94" rx="8" ry="5.5" fill="rgba(255,255,255,0.18)" transform="rotate(-20 129 94)" />

        {/* Body */}
        <motion.path
          d="M104 139 C97 139 91 146 91 155 L91 228 C91 236 97 242 104 242 L176 242 C183 242 189 236 189 228 L189 155 C189 146 183 139 176 139 Z"
          fill="url(#ctaBGrad)"
          animate={{ scale: [1, 1.012, 1] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Right arm — extends toward shield */}
        <motion.path
          d="M184 168 Q212 174 230 190"
          stroke="url(#ctaAR)" strokeWidth="16" strokeLinecap="round" fill="none"
          animate={{ d: ['M184 168 Q212 174 230 190', 'M184 168 Q212 171 230 185', 'M184 168 Q212 174 230 190'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Left arm */}
        <motion.path
          d="M96 168 Q68 174 50 190"
          stroke="url(#ctaAL)" strokeWidth="16" strokeLinecap="round" fill="none"
          animate={{ d: ['M96 168 Q68 174 50 190', 'M96 168 Q68 171 50 185', 'M96 168 Q68 174 50 190'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
        />

        {/* Right hand */}
        <motion.circle cx="234" cy="193" r="13"
          fill="rgba(79,70,229,0.65)" stroke="rgba(139,92,246,0.8)" strokeWidth="1.5"
          animate={{ r: [13, 16, 13], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Left hand */}
        <motion.circle cx="46" cy="193" r="13"
          fill="rgba(79,70,229,0.65)" stroke="rgba(139,92,246,0.8)" strokeWidth="1.5"
          animate={{ r: [13, 16, 13], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        />

        {/* Legs */}
        <rect x="103" y="241" width="26" height="50" rx="8" fill="url(#ctaLGrad)" />
        <rect x="151" y="241" width="26" height="50" rx="8" fill="url(#ctaLGrad)" />

        {/* Lock on chest */}
        <rect x="121" y="172" width="38" height="32" rx="7"
          fill="rgba(79,70,229,0.9)" stroke="rgba(139,92,246,0.7)" strokeWidth="1.5" />
        <path d="M131 172 L131 163 C131 154 149 154 149 163 L149 172"
          fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="140" cy="188" r="4.5" fill="rgba(255,255,255,0.9)" />
        <rect x="138" y="188" width="4" height="8" rx="2" fill="rgba(255,255,255,0.9)" />

        {/* ── Floating IP badges ── */}
        <motion.g animate={{ y: [-8, 8, -8] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
          <circle cx="24" cy="78" r="21" fill="rgba(79,70,229,0.2)" stroke="rgba(139,92,246,0.6)" strokeWidth="1.5" />
          <text x="24" y="86" textAnchor="middle" fill="#c4b5fd" fontSize="19" fontWeight="700" fontFamily="serif">©</text>
        </motion.g>

        <motion.g animate={{ y: [7, -7, 7] }} transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}>
          <circle cx="258" cy="66" r="18" fill="rgba(79,70,229,0.18)" stroke="rgba(139,92,246,0.55)" strokeWidth="1.5" />
          <text x="258" y="73" textAnchor="middle" fill="#c4b5fd" fontSize="15" fontWeight="700" fontFamily="serif">®</text>
        </motion.g>

        <motion.g animate={{ y: [-5, 5, -5] }} transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}>
          <circle cx="266" cy="162" r="15" fill="rgba(79,70,229,0.15)" stroke="rgba(139,92,246,0.45)" strokeWidth="1.2" />
          <text x="266" y="168" textAnchor="middle" fill="#c4b5fd" fontSize="11" fontWeight="700" fontFamily="serif">™</text>
        </motion.g>

        {/* Document left */}
        <motion.g animate={{ y: [4, -4, 4] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }}>
          <rect x="6" y="140" width="34" height="44" rx="5" fill="rgba(79,70,229,0.16)" stroke="rgba(139,92,246,0.42)" strokeWidth="1.2" />
          <rect x="12" y="151" width="22" height="3" rx="1.5" fill="rgba(255,255,255,0.28)" />
          <rect x="12" y="158" width="22" height="3" rx="1.5" fill="rgba(255,255,255,0.2)" />
          <rect x="12" y="165" width="14" height="3" rx="1.5" fill="rgba(255,255,255,0.16)" />
        </motion.g>

        {/* Check badge bottom */}
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.9 }}
          style={{ transformOrigin: '140px 322px' }}
        >
          <circle cx="140" cy="322" r="22" fill="rgba(34,197,94,0.15)" stroke="rgba(34,197,94,0.5)" strokeWidth="1.5" />
          <path d="M129 322 L137 330 L152 312" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </motion.g>

        {/* Particles */}
        <motion.circle cx="108" cy="34" r="3.5" fill="rgba(167,139,250,0.5)"
          animate={{ y: [-13, 0, -13], opacity: [0.3, 0.85, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }} />
        <motion.circle cx="178" cy="24" r="2.5" fill="rgba(167,139,250,0.4)"
          animate={{ y: [-9, 4, -9], opacity: [0.25, 0.75, 0.25] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 1.1 }} />
        <motion.circle cx="60" cy="278" r="3" fill="rgba(139,92,246,0.4)"
          animate={{ y: [-7, 7, -7], opacity: [0.25, 0.65, 0.25] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }} />
        <motion.circle cx="224" cy="286" r="2.5" fill="rgba(139,92,246,0.35)"
          animate={{ y: [5, -5, 5], opacity: [0.25, 0.6, 0.25] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1.6 }} />

        <defs>
          <linearGradient id="ctaHGrad" x1="112" y1="76" x2="168" y2="134" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
          <linearGradient id="ctaBGrad" x1="91" y1="139" x2="189" y2="242" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#3730a3" />
          </linearGradient>
          <linearGradient id="ctaAR" x1="184" y1="168" x2="230" y2="190" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3730a3" />
            <stop offset="100%" stopColor="#6d28d9" />
          </linearGradient>
          <linearGradient id="ctaAL" x1="96" y1="168" x2="50" y2="190" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3730a3" />
            <stop offset="100%" stopColor="#6d28d9" />
          </linearGradient>
          <linearGradient id="ctaLGrad" x1="0" y1="241" x2="0" y2="291" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4338ca" />
            <stop offset="100%" stopColor="#312e81" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}
