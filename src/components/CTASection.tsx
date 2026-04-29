import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const EASE = 'easeOut' as const

export default function CTASection() {
  return (
    <section className="cta-section">
      <div className="container">
        <div className="cta-inner">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <div className="cta-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              ابدأ الحماية الآن
            </div>

            <h2 className="cta-title">ابدأ الآن بحماية حقوقك الفكرية</h2>

            <p className="cta-desc">
              لا تتأخر في تأمين إبداعاتك وابتكاراتك. منصتنا تجعل تسجيل
              الحقوق الفكرية أمراً سهلاً وسريعاً وموثوقاً بالكامل.
            </p>

            <Link to="/register-right" className="btn-cta">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
              سجّل حقوقك الآن
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
