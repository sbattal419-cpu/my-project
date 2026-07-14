// ════════════════════════════════════════════════════════════════
// FILE: src/components/CertificatePrintable.tsx
// طبقة شهادة مُبعدة عن الشاشة (خارج viewport) تُلتقط بواسطة html2canvas
// وتُحوَّل إلى ملف PDF يُنزَّل مباشرة — انظر src/lib/certPdf.ts
// ════════════════════════════════════════════════════════════════
import { forwardRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { IP_TYPES } from '../config/blockchain.config'
import { useLang } from '../context/LanguageContext'
import type { CertificateData } from '../lib/blockchain'

const CertificatePrintable = forwardRef<HTMLDivElement, { cert: CertificateData | null }>(({ cert }, ref) => {
  const { t, lang } = useLang()
  if (!cert) return null

  const ipType = IP_TYPES[cert.ipType] ?? IP_TYPES[0]
  const verifyUrl = `${window.location.origin}/verify?id=${cert.certId}`

  return (
    <div className="cert-printable" ref={ref}>
      <div className="cert-printable-border">
        <p className="cert-printable-title">{t('cert.print.title')}</p>
        <p className="cert-printable-subtitle">{t('cert.print.issued')}</p>

        <p className="cert-printable-work-title">{cert.title}</p>
        <p>{t(ipType.labelKey)}</p>

        <div className="cert-printable-row"><span>{t('vfy.f.cert.id')}</span><b>#{cert.certId}</b></div>
        <div className="cert-printable-row"><span>{t('vfy.f.holder')}</span><b>{cert.holderName}</b></div>
        <div className="cert-printable-row">
          <span>{t('vfy.f.reg.date')}</span>
          <b>{cert.registeredAt.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</b>
        </div>
        <div className="cert-printable-row"><span>{t('vfy.f.doc.hash')}</span><b>{cert.documentHash.slice(0, 18)}...{cert.documentHash.slice(-8)}</b></div>

        <div className="cert-printable-qr">
          <QRCodeSVG value={verifyUrl} size={110} bgColor="#ffffff" fgColor="#1d4ed8" level="M" />
        </div>

        <p className="cert-printable-footer">{t('cert.print.verify')} {verifyUrl}</p>
      </div>
    </div>
  )
})

export default CertificatePrintable
