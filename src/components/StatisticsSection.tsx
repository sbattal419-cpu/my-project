import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

const EASE = 'easeOut' as const

function useCounter(target: number, duration = 2200, active = false) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!active) return
    let startTime: number | null = null
    let raf: number

    const step = (ts: number) => {
      if (!startTime) startTime = ts
      const elapsed = ts - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [active, target, duration])

  return value
}

const STATS = [
  { target: 10000, suffix: '+', label: 'حق مسجل' },
  { target: 5000, suffix: '+', label: 'مستخدم نشط' },
  { target: 15, suffix: '+', label: 'سنة خبرة' },
]

function StatItem({ target, suffix, label, active }: {
  target: number
  suffix: string
  label: string
  active: boolean
}) {
  const count = useCounter(target, 2200, active)
  const formatted = count.toLocaleString('en-US')

  return (
    <div className="stat-item">
      <span className="stat-num">
        {formatted}
        <span className="stat-suffix">{suffix}</span>
      </span>
      <p className="stat-label">{label}</p>
    </div>
  )
}

export default function StatisticsSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })

  return (
    <section className="stats-section" id="about">
      <div className="container">
        <motion.div
          className="section-header"
          style={{ marginBottom: 48 }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: EASE }}
        >
          <div className="section-badge" style={{ background: 'rgba(96,165,250,0.15)', color: '#93c5fd' }}>
            بالأرقام
          </div>
          <h2 className="section-title" style={{ color: '#fff' }}>إنجازاتنا تتحدث عنا</h2>
          <p className="section-subtitle" style={{ color: 'rgba(255,255,255,0.65)' }}>
            أرقام حقيقية تعكس ثقة عملائنا ومستوى خدماتنا المتميزة على مدار سنوات من العطاء.
          </p>
        </motion.div>

        <div className="stats-grid" ref={ref}>
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, ease: EASE, delay: i * 0.12 }}
            >
              <StatItem
                target={stat.target}
                suffix={stat.suffix}
                label={stat.label}
                active={inView}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
