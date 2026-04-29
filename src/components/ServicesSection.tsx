import { motion } from 'framer-motion'

const EASE = 'easeOut' as const

const SERVICES = [
  {
    title: 'تسجيل حقوق النشر',
    desc: 'حماية أعمالك الإبداعية والأدبية والفنية من خلال إجراءات تسجيل رسمية معتمدة.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M14.83 14.83a4 4 0 1 1 0-5.66"/>
      </svg>
    ),
  },
  {
    title: 'تسجيل العلامات التجارية',
    desc: 'تأمين هوية علامتك التجارية وتمييزها قانونياً في الأسواق المحلية والدولية.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
  },
  {
    title: 'تسجيل براءات الاختراع',
    desc: 'حماية اختراعاتك وابتكاراتك التقنية وضمان حقوق الاستغلال الحصري لمدة قانونية.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4"/>
        <line x1="12" y1="2" x2="12" y2="6"/>
        <line x1="12" y1="18" x2="12" y2="22"/>
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
        <line x1="2" y1="12" x2="6" y2="12"/>
        <line x1="18" y1="12" x2="22" y2="12"/>
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
      </svg>
    ),
  },
  {
    title: 'الاستشارات القانونية',
    desc: 'خبراء قانونيون متخصصون في الملكية الفكرية يقدمون المشورة والدعم اللازمين لحماية حقوقك.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="M9 12l2 2 4-4"/>
      </svg>
    ),
  },
]

export default function ServicesSection() {
  return (
    <section className="services-section section" id="services">
      <div className="container">
        <div className="section-header">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <div className="section-badge">✦ خدماتنا</div>
            <h2 className="section-title">خدمات الحقوق الملكية والفكرية</h2>
            <p className="section-subtitle">
              نوفر منظومة متكاملة من الخدمات القانونية لحماية جميع أنواع الحقوق الفكرية
              بمعايير دولية عالية الجودة.
            </p>
          </motion.div>
        </div>

        <div className="services-grid">
          {SERVICES.map((service, i) => (
            <motion.div
              key={service.title}
              className="service-card"
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, ease: EASE, delay: i * 0.1 }}
              whileHover={{ y: -10, boxShadow: '0 20px 48px rgba(37,99,235,0.18)' }}
              whileTap={{ scale: 0.97 }}
            >
              <motion.div
                className="service-icon-wrap"
                whileHover={{ rotate: [0, -8, 8, 0], scale: 1.12 }}
                transition={{ duration: 0.4 }}
              >
                {service.icon}
              </motion.div>
              <h3 className="service-title">{service.title}</h3>
              <p className="service-desc">{service.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
