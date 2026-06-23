// ════════════════════════════════════════════════════════════════
// FILE: src/components/WalletConnect.tsx
// مكوّن ربط/فصل محفظة Ethereum — يظهر بثلاث حالات:
//   غير مربوطة  → زر "ربط المحفظة" + modal اختيار المحفظة
//   شبكة خاطئة → زر "تبديل الشبكة" إلى Sepolia
//   مربوطة      → عنوان المحفظة المختصر + زر فصل (اختياري)
// Props:
//   showDisconnect — إظهار زر قطع الاتصال (افتراضي: true)
//   showHint       — إظهار تلميح توضيحي أسفل البطاقة
// يُستخدم في: RegisterRightPage، CertificatesPage، Navbar
// ════════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react'
import { useWallet } from '../hooks/useWallet'
import { useAuth } from '../context/AuthContext'
import { truncateAddress } from '../lib/blockchain'
import { saveWalletAddress } from '../lib/supabase-ipr'
import WalletSelectorModal from './WalletSelectorModal'
import WalletGuideModal from './WalletGuideModal'
import InfoTip from './InfoTip'

interface Props {
  showDisconnect?: boolean
  showHint?: boolean
}

export default function WalletConnect({ showDisconnect = true, showHint = false }: Props) {
  const { address, isConnected, isSepolia, isConnecting, error, connectWith, disconnect, switchToSepolia } = useWallet()
  const { user } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  // حفظ عنوان المحفظة في Supabase عند الربط
  useEffect(() => {
    if (isConnected && address && user) {
      saveWalletAddress(user.id, address).catch(() => {})
    }
  }, [isConnected, address, user])

  if (!isConnected) {
    return (
      <>
        <div className="wc-wrapper">
          <div className="wc-box wc-disconnected">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
            <div className="wc-text">
              <p className="wc-title">المحفظة غير مربوطة</p>
              {error && <p className="wc-error">{error}</p>}
            </div>
            <button className="btn-wc btn-wc-connect" onClick={() => setShowModal(true)} disabled={isConnecting}>
              {isConnecting ? <span className="btn-spinner" /> : null}
              {isConnecting ? 'جاري الاتصال...' : 'ربط المحفظة'}
            </button>
          </div>

          {showHint && (
            <div className="wc-hint">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>المحفظة الرقمية هي توقيعك على البلوكشين — تُستخدم مرة واحدة لتأكيد التسجيل.</span>
              <button className="wc-hint-link" onClick={() => setShowGuide(true)}>
                كيف أربطها؟
              </button>
            </div>
          )}
        </div>

        {showModal && (
          <WalletSelectorModal
            onSelect={(provider) => connectWith(provider)}
            onClose={() => setShowModal(false)}
          />
        )}
        {showGuide && <WalletGuideModal onClose={() => setShowGuide(false)} />}
      </>
    )
  }

  if (!isSepolia) {
    return (
      <>
        <div className="wc-wrapper">
          <div className="wc-box wc-wrong-net">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div className="wc-text">
              <p className="wc-title">شبكة خاطئة</p>
              <p className="wc-desc" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                يجب التبديل إلى Sepolia Testnet
                <InfoTip term="Sepolia Testnet" explanation="شبكة بلوكشين تجريبية تستخدم ETH وهمي مجاني للاختبار. لا توجد أموال حقيقية — مثالية لتسجيل الحقوق بأمان." />
              </p>
            </div>
            <button className="btn-wc btn-wc-switch" onClick={switchToSepolia}>
              تبديل الشبكة
            </button>
          </div>
          {showHint && (
            <div className="wc-hint wc-hint-warn">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span>أنت على شبكة خاطئة. اضغط "تبديل الشبكة" للانتقال إلى Sepolia Testnet تلقائياً.</span>
            </div>
          )}
        </div>
        {showGuide && <WalletGuideModal onClose={() => setShowGuide(false)} />}
      </>
    )
  }

  return (
    <>
      <div className="wc-wrapper">
        <div className="wc-box wc-connected">
          <span className="wc-dot" />
          <div className="wc-text">
            <p className="wc-network" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              Sepolia Testnet
              <InfoTip term="Sepolia Testnet" explanation="شبكة بلوكشين تجريبية تستخدم ETH وهمي مجاني. شهاداتك مسجلة هنا وستبقى محفوظة بشكل دائم." />
            </p>
            <p className="wc-addr">{truncateAddress(address!)}</p>
          </div>
          {showDisconnect && (
            <button className="btn-wc btn-wc-disconnect" onClick={disconnect}>
              قطع الاتصال
            </button>
          )}
        </div>
        {showHint && (
          <div className="wc-hint wc-hint-success">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>تم ربط المحفظة وحفظ عنوانها. يمكنك الآن إتمام التسجيل.</span>
          </div>
        )}
      </div>
      {showGuide && <WalletGuideModal onClose={() => setShowGuide(false)} />}
    </>
  )
}
