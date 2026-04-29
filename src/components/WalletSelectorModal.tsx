import { useEIP6963 } from '../hooks/useEIP6963'

interface Props {
  onSelect: (provider: any) => void
  onClose:  () => void
}

const GENERIC_ICON = (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/>
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
    <line x1="12" y1="12" x2="12" y2="16"/>
    <line x1="10" y1="14" x2="14" y2="14"/>
  </svg>
)

export default function WalletSelectorModal({ onSelect, onClose }: Props) {
  const eip6963Wallets = useEIP6963()

  // Build final wallet list: EIP-6963 wallets + legacy window.ethereum fallback
  const wallets = eip6963Wallets.length > 0
    ? eip6963Wallets
    : window.ethereum
      ? [{ info: { uuid: 'legacy', name: 'محفظة المتصفح', icon: '', rdns: '' }, provider: window.ethereum }]
      : []

  const noWallets = wallets.length === 0

  return (
    <div className="wsm-overlay" onClick={onClose}>
      <div className="wsm-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="wsm-header">
          <span className="wsm-title">اختر محفظتك</span>
          <button className="wsm-close" onClick={onClose} aria-label="إغلاق">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Wallet list */}
        {!noWallets ? (
          <ul className="wsm-list">
            {wallets.map(w => (
              <li key={w.info.uuid}>
                <button className="wsm-item" onClick={() => { onSelect(w.provider); onClose() }}>
                  <span className="wsm-icon">
                    {w.info.icon
                      ? <img src={w.info.icon} alt={w.info.name} width="32" height="32" />
                      : GENERIC_ICON}
                  </span>
                  <span className="wsm-name">{w.info.name}</span>
                  <svg className="wsm-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="9 18 3 12 9 6"/>
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          /* No wallets detected */
          <div className="wsm-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round">
              <rect x="2" y="7" width="20" height="14" rx="2"/>
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
            </svg>
            <p>لا توجد محفظة مثبتة في متصفحك</p>
            <p className="wsm-empty-sub">قم بتثبيت إحدى المحافظ التالية:</p>
            <div className="wsm-install-links">
              <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="wsm-install-btn">
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" width="20" height="20" />
                MetaMask
              </a>
              <a href="https://www.coinbase.com/wallet/downloads" target="_blank" rel="noopener noreferrer" className="wsm-install-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#0052FF"><rect width="24" height="24" rx="12" fill="#0052FF"/><path d="M12 6a6 6 0 1 0 0 12A6 6 0 0 0 12 6zm0 2.4a3.6 3.6 0 1 1 0 7.2 3.6 3.6 0 0 1 0-7.2z" fill="#fff"/></svg>
                Coinbase Wallet
              </a>
            </div>
          </div>
        )}

        <p className="wsm-hint">تنبيه: فقط محافظ EVM متوافقة مع Sepolia</p>
      </div>
    </div>
  )
}
