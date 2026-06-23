// ════════════════════════════════════════════════════════════════
// FILE: src/hooks/useWallet.ts
// Hook إدارة حالة محفظة Ethereum (MetaMask / EIP-6963)
// للتعديل: ابحث عن connect / switchToSepolia / disconnect
// القيم المُعادة:
//   address      — عنوان المحفظة المتصلة
//   isConnected  — هل المحفظة مربوطة؟
//   isSepolia    — هل الشبكة Sepolia (chainId=11155111)؟
//   connect      — ربط window.ethereum (MetaMask)
//   connectWith  — ربط مزوّد محدد (EIP-6963)
//   disconnect   — قطع الاتصال
//   switchToSepolia — تبديل الشبكة لـ Sepolia
// ════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import { BLOCKCHAIN } from '../config/blockchain.config'
import { setActiveProvider } from '../lib/blockchain'

interface WalletState {
  address:      string | null
  chainId:      number | null
  isConnecting: boolean
  error:        string | null
  provider:     any
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null, chainId: null, isConnecting: false, error: null, provider: null,
  })

  const disconnect = useCallback(() => {
    setActiveProvider(null)
    setState({ address: null, chainId: null, isConnecting: false, error: null, provider: null })
  }, [])

  const connectWith = useCallback(async (rawProvider: any) => {
    setState(s => ({ ...s, isConnecting: true, error: null }))
    try {
      const ethProvider = new ethers.BrowserProvider(rawProvider)
      const accounts    = await ethProvider.send('eth_requestAccounts', []) as string[]
      const network     = await ethProvider.getNetwork()
      setActiveProvider(rawProvider)
      setState({ address: accounts[0], chainId: Number(network.chainId), isConnecting: false, error: null, provider: rawProvider })
    } catch (err) {
      const msg = (err as Error).message
      setState(s => ({
        ...s,
        isConnecting: false,
        error: msg.includes('rejected') ? 'تم رفض طلب الاتصال' : 'فشل الاتصال بالمحفظة',
      }))
    }
  }, [])

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setState(s => ({ ...s, error: 'يرجى تثبيت محفظة بلوكتشين أولاً' }))
      return
    }
    await connectWith(window.ethereum)
  }, [connectWith])

  const switchToSepolia = useCallback(async () => {
    const p = state.provider || window.ethereum
    if (!p) return
    try {
      await p.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0xaa36a7' }] })
    } catch {
      await p.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0xaa36a7',
          chainName: 'Sepolia Testnet',
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['https://rpc.sepolia.org'],
          blockExplorerUrls: ['https://sepolia.etherscan.io'],
        }],
      })
    }
  }, [state.provider])

  // Event listeners — re-attach whenever active provider changes
  useEffect(() => {
    const p = state.provider || window.ethereum
    if (!p) return
    const onAccounts = (accs: unknown) => {
      const accounts = accs as string[]
      accounts.length === 0 ? disconnect() : setState(s => ({ ...s, address: accounts[0] }))
    }
    const onChain = (chainId: unknown) => {
      setState(s => ({ ...s, chainId: parseInt(chainId as string, 16) }))
    }
    p.on?.('accountsChanged', onAccounts)
    p.on?.('chainChanged',    onChain)
    return () => {
      p.removeListener?.('accountsChanged', onAccounts)
      p.removeListener?.('chainChanged',    onChain)
    }
  }, [state.provider, disconnect])

  // Auto-reconnect on mount if wallet was already approved
  useEffect(() => {
    if (!window.ethereum) return
    window.ethereum.request({ method: 'eth_accounts' }).then(async (accs: unknown) => {
      const accounts = accs as string[]
      if (accounts.length > 0) {
        const ethProvider = new ethers.BrowserProvider(window.ethereum!)
        const network     = await ethProvider.getNetwork()
        setActiveProvider(window.ethereum)
        setState({ address: accounts[0], chainId: Number(network.chainId), isConnecting: false, error: null, provider: window.ethereum })
      }
    })
  }, [])

  return {
    ...state,
    hasWallet:   !!window.ethereum,
    isConnected: !!state.address,
    isSepolia:   state.chainId === BLOCKCHAIN.CHAIN_ID,
    connect,
    connectWith,
    disconnect,
    switchToSepolia,
  }
}
