// ════════════════════════════════════════════════════════════════
// FILE: src/components/InfoTip.tsx
// أيقونة ℹ️ صغيرة — عند الضغط تُظهر بطاقة شرح للمصطلح
// Props: term (اسم المصطلح) + explanation (الشرح) + size (حجم الأيقونة)
// يُغلق تلقائياً عند النقر خارجه
// يُستخدم في: RegisterRightPage، CertificatesPage، VerifyPage
// ════════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from 'react'

interface Props {
  term: string
  explanation: string
  size?: number
}

export default function InfoTip({ term, explanation, size = 14 }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="infotip-wrap" ref={ref}>
      <button
        type="button"
        className="infotip-btn"
        style={{ width: size + 2, height: size + 2 }}
        onClick={() => setOpen(v => !v)}
        aria-label={`شرح: ${term}`}
      >
        <svg width={size - 2} height={size - 2} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </button>

      {open && (
        <div className="infotip-card">
          <p className="infotip-term">{term}</p>
          <p className="infotip-desc">{explanation}</p>
        </div>
      )}
    </div>
  )
}
