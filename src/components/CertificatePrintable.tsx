// ════════════════════════════════════════════════════════════════
// FILE: src/components/CertificatePrintable.tsx
// طبقة شهادة مخفية على الشاشة (display:none) تظهر فقط عند الطباعة/التنزيل كـ PDF
// عبر window.print() — انظر index.css قسم PRINTABLE CERTIFICATE
// ════════════════════════════════════════════════════════════════
import { QRCodeSVG } from 'qrcode.react'
import { IP_TYPES } from '../config/blockchain.config'
import { useLang } from '../context/LanguageContext'
import type { CertificateData } from '../lib/blockchain'

export default function CertificatePrintable({ cert }: { cert: CertificateData | null }) {
  const { t, lang } = useLang()
  if (!cert) return null

  const ipType = IP_TYPES[cert.ipType] ?? IP_TYPES[0]
  const verifyUrl = `${window.location.origin}/verify?id=${cert.certId}`

  return (
    <div className="cert-printable">
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
}
