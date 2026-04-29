import { useState, useEffect } from 'react'

export interface EIP6963WalletInfo {
  uuid: string
  name: string
  icon: string
  rdns: string
}

export interface EIP6963Wallet {
  info: EIP6963WalletInfo
  provider: any
}

export function useEIP6963(): EIP6963Wallet[] {
  const [wallets, setWallets] = useState<EIP6963Wallet[]>([])

  useEffect(() => {
    const onAnnounce = (event: Event) => {
      const { detail } = event as CustomEvent<EIP6963Wallet>
      setWallets(prev => {
        const exists = prev.some(w => w.info.uuid === detail.info.uuid)
        return exists ? prev : [...prev, detail]
      })
    }

    window.addEventListener('eip6963:announceProvider', onAnnounce)
    window.dispatchEvent(new Event('eip6963:requestProvider'))

    return () => window.removeEventListener('eip6963:announceProvider', onAnnounce)
  }, [])

  return wallets
}
