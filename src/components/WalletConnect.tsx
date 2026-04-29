import { useState } from 'react'
import { useWallet } from '../hooks/useWallet'
import { truncateAddress } from '../lib/blockchain'
import WalletSelectorModal from './WalletSelectorModal'

interface Props {
  showDisconnect?: boolean
}

export default function WalletConnect({ showDisconnect = true }: Props) {
  const { address, isConnected, isSepolia, isConnecting, error, connectWith, disconnect, switchToSepolia } = useWallet()
  const [showModal, setShowModal] = useState(false)

  if (!isConnected) {
    return (
      <>
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

        {showModal && (
          <WalletSelectorModal
            onSelect={(provider) => connectWith(provider)}
            onClose={() => setShowModal(false)}
          />
        )}
      </>
    )
  }

  if (!isSepolia) {
    return (
      <div className="wc-box wc-wrong-net">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <div className="wc-text">
          <p className="wc-title">شبكة خاطئة</p>
          <p className="wc-desc">يجب التبديل إلى Sepolia Testnet</p>
        </div>
        <button className="btn-wc btn-wc-switch" onClick={switchToSepolia}>
          تبديل الشبكة
        </button>
      </div>
    )
  }

  return (
    <div className="wc-box wc-connected">
      <span className="wc-dot" />
      <div className="wc-text">
        <p className="wc-network">Sepolia Testnet</p>
        <p className="wc-addr">{truncateAddress(address!)}</p>
      </div>
      {showDisconnect && (
        <button className="btn-wc btn-wc-disconnect" onClick={disconnect}>
          قطع الاتصال
        </button>
      )}
    </div>
  )
}
