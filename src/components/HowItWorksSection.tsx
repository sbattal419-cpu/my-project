import { motion } from 'framer-motion'

const EASE = 'easeOut' as const

const STEPS = [
  {
    num: '01',
    title: 'إنشاء حساب',
    desc: 'سجّل حسابك في المنصة بخطوات بسيطة وآمنة باستخدام بياناتك الشخصية أو الرسمية.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
        <line x1="19" y1="8" x2="19" y2="14"/>
        <line x1="22" y1="11" x2="16" y2="11"/>
      </svg>
    ),
    active: true,
  },
  {
    num: '02',
    title: 'رفع الوثائق',
    desc: 'أرفق جميع المستندات والملفات المطلوبة بصيغ آمنة وموثوقة عبر نظامنا الإلكتروني.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    ),
    active: false,
  },
  {
    num: '03',
    title: 'مراجعة الطلب',
    desc: 'يقوم فريق متخصص من الخبراء القانونيين بمراجعة طلبك والتحقق من استيفاء جميع المتطلبات.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
    ),
    active: false,
  },
  {
    num: '04',
    title: 'إصدار الشهادة',
    desc: 'استلم شهادتك الرسمية المعتمدة إلكترونياً التي تثبت حقوقك الفكرية بشكل قانوني ومعترف به.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="6"/>
        <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
      </svg>
    ),
    active: true,
  },
]

export default function HowItWorksSection() {
  return (
    <section className="how-section section" id="how">
      <div className="container">
        <div className="section-header">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <div className="section-badge">✦ كيف يعمل النظام</div>
            <h2 className="section-title">خطوات تسجيل حقوقك</h2>
            <p className="section-subtitle">
              إجراءات واضحة ومبسطة تضمن حصولك على حماية حقوقك الفكرية
              بأسرع وقت ممكن وبأعلى معايير الدقة والاحترافية.
            </p>
          </motion.div>
        </div>

        <div className="steps-wrapper">
          <div className="steps-line" />
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              className="step-item"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55, ease: EASE, delay: i * 0.13 }}
              whileHover={{ scale: 1.02 }}
            >
              <motion.div
                className={`step-circle${step.active ? ' step-circle-active' : ''}`}
                whileHover={{ scale: 1.12, boxShadow: '0 0 28px rgba(37,99,235,0.4)' }}
                transition={{ duration: 0.25 }}
              >
                <span className="step-num-label">خطوة {step.num}</span>
                <span className="step-icon-inner">{step.icon}</span>
              </motion.div>
              <div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
