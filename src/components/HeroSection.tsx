import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const EASE = 'easeOut' as const

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 3 + 1.5,
  duration: Math.random() * 8 + 6,
  delay: Math.random() * 4,
}))

export default function HeroSection() {
  return (
    <section className="hero-section" id="home">
      <div className="hero-bg-radial" />
      <div className="hero-grid-pattern" />
      <div className="hero-orb hero-orb-1" />
      <div className="hero-orb hero-orb-2" />
      <div className="hero-orb hero-orb-3" />

      {/* Floating particles */}
      {PARTICLES.map(p => (
        <motion.div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: 'rgba(96,165,250,0.55)',
            pointerEvents: 'none',
          }}
          animate={{ y: [-12, 12, -12], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}

      <div className="container">
        <div className="hero-inner">
          {/* Content */}
          <div className="hero-content">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
            >
              <div className="hero-tag">
                <span className="hero-tag-dot" />
                منصة رسمية معتمدة
              </div>
            </motion.div>

            <motion.h1
              className="hero-title"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: EASE, delay: 0.2 }}
            >
              منصة رقمية لإدارة حقوق الملكية الفكرية
              <br />
              <span className="hero-title-accent" style={{ fontSize: '0.55em', letterSpacing: '0.04em', fontWeight: 500, opacity: 0.75 }}>
                Digital Platform for Intellectual Property Rights Management
              </span>
            </motion.h1>

            <motion.p
              className="hero-desc"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: EASE, delay: 0.3 }}
            >
              نقدم خدمات تسجيل وحماية الحقوق الفكرية وفق أعلى المعايير القانونية،
              بإجراءات رقمية سلسة وموثوقة تضمن حقوقك الإبداعية والتجارية.
            </motion.p>

            <motion.div
              className="hero-actions"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: EASE, delay: 0.4 }}
            >
              <Link to="/register-right" className="btn-hero-primary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12l7 7 7-7"/>
                </svg>
                تسجيل حق جديد
              </Link>
              <Link to="/verify" className="btn-hero-secondary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                البحث عن حق
              </Link>
            </motion.div>

            <motion.div
              className="hero-trust"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.65, ease: EASE, delay: 0.55 }}
            >
              <span className="hero-trust-dot" />
              موثوق من أكثر من 10,000 مسجل — محمي وفق أعلى معايير الأمان
            </motion.div>
          </div>

          {/* Visual */}
          <div className="hero-visual">
            <div className="hero-shield-wrap">
              <motion.div
                className="hero-shield-glow"
                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              />

              <motion.div
                animate={{ y: [-10, 8, -10] }}
                transition={{ duration: 5, repeat: Infinity, ease: EASE }}
                whileHover={{ scale: 1.06 }}
              >
                <ShieldIllustration />
              </motion.div>

              <motion.div
                className="hero-float-card"
                animate={{ y: [0, -7, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: EASE, delay: 0.8 }}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="hero-float-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                  </svg>
                </div>
                <div>
                  <div className="hero-float-num">+10,000</div>
                  <div className="hero-float-sub">حق مسجل</div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ShieldIllustration() {
  return (
    <svg width="300" height="340" viewBox="0 0 300 340" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="150" cy="310" rx="90" ry="14" fill="rgba(37,99,235,0.18)" />
      <path
        d="M150 24L264 78L264 200C264 266 150 316 150 316C150 316 36 266 36 200L36 78Z"
        fill="rgba(37,99,235,0.12)" stroke="rgba(96,165,250,0.5)" strokeWidth="1.5"
      />
      <path
        d="M150 46L242 92L242 196C242 252 150 296 150 296C150 296 58 252 58 196L58 92Z"
        fill="rgba(37,99,235,0.15)" stroke="rgba(96,165,250,0.25)" strokeWidth="1"
      />
      <rect x="96" y="100" width="108" height="142" rx="8" fill="rgba(255,255,255,0.96)" />
      <rect x="96" y="100" width="108" height="28" rx="8" fill="rgba(37,99,235,0.9)" />
      <rect x="96" y="116" width="108" height="12" fill="rgba(37,99,235,0.9)" />
      <rect x="110" y="108" width="50" height="5" rx="2.5" fill="rgba(255,255,255,0.9)" />
      <rect x="110" y="116" width="35" height="4" rx="2" fill="rgba(255,255,255,0.5)" />
      <rect x="108" y="142" width="84" height="5" rx="2.5" fill="#1e4976" />
      <rect x="108" y="155" width="84" height="5" rx="2.5" fill="#1e4976" />
      <rect x="108" y="168" width="60" height="5" rx="2.5" fill="#1e4976" />
      <rect x="108" y="183" width="84" height="4" rx="2" fill="#e2e8f0" />
      <rect x="108" y="194" width="68" height="4" rx="2" fill="#e2e8f0" />
      <rect x="108" y="205" width="84" height="4" rx="2" fill="#e2e8f0" />
      <circle cx="150" cy="228" r="18" fill="#2563eb" />
      <circle cx="150" cy="228" r="14" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="3 2"/>
      <path d="M142 228L148 234L159 221" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
