// ════════════════════════════════════════════════════════════════
// FILE: src/components/WelcomeToast.tsx
// إشعار ترحيب يظهر بعد تسجيل الدخول ويختفي تلقائياً بعد 4 ثواني
// يعرض شريط تقدم متحرك يُظهر الوقت المتبقي
// يُستخدم في: HomePage — يقرأ اسم المستخدم من sessionStorage
// ════════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface Props {
  name: string
  onDismiss: () => void
}

export default function WelcomeToast({ name, onDismiss }: Props) {
  const [progress, setProgress] = useState(100)
  const DURATION = 4000

  useEffect(() => {
    const start = Date.now()
    const timer = setInterval(() => {
      const elapsed = Date.now() - start
      const remaining = Math.max(0, 100 - (elapsed / DURATION) * 100)
      setProgress(remaining)
      if (remaining === 0) { clearInterval(timer); onDismiss() }
    }, 30)
    return () => clearInterval(timer)
  }, [onDismiss])

  return (
    <motion.div
      className="welcome-toast"
      initial={{ opacity: 0, y: -24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
    >
      <div className="welcome-toast-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </div>
      <div className="welcome-toast-content">
        <p className="welcome-toast-title">مرحباً {name}!</p>
        <p className="welcome-toast-sub">سعيدون بعودتك إلى منصة إدارة حقوق الملكية الفكرية</p>
      </div>
      <button className="welcome-toast-close" onClick={onDismiss} aria-label="إغلاق">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <div className="welcome-toast-bar" style={{ width: `${progress}%` }} />
    </motion.div>
  )
}
