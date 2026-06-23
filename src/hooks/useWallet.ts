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

  // disconnect — يُصفّر كل حالة المحفظة ويحذف المزوّد النشط من blockchain.ts
  const disconnect = useCallback(() => {
    setActiveProvider(null)                                                          // امسح المزوّد من lib/blockchain.ts أيضاً
    setState({ address: null, chainId: null, isConnecting: false, error: null, provider: null })
  }, [])

  // ── connectWith — ربط مزوّد محدد (EIP-6963 أو window.ethereum) ──────────────
  const connectWith = useCallback(async (rawProvider: any) => {
    setState(s => ({ ...s, isConnecting: true, error: null }))                      // أظهر حالة التحميل فوراً
    try {
      const ethProvider = new ethers.BrowserProvider(rawProvider)                   // لفّ المزوّد الخام بـ ethers.js
      const accounts    = await ethProvider.send('eth_requestAccounts', []) as string[] // افتح popup المحفظة لطلب الإذن
      const network     = await ethProvider.getNetwork()                            // اجلب chainId للتحقق أننا على Sepolia
      setActiveProvider(rawProvider)                                                 // احفظ المزوّد ليستخدمه blockchain.ts لاحقاً
      setState({ address: accounts[0], chainId: Number(network.chainId), isConnecting: false, error: null, provider: rawProvider })
    } catch (err) {
      const msg = (err as Error).message
      setState(s => ({
        ...s,
        isConnecting: false,
        // رسالة مناسبة: "rejected" = رفض المستخدم الإذن، غير ذلك = خطأ تقني
        error: msg.includes('rejected') ? 'تم رفض طلب الاتصال' : 'فشل الاتصال بالمحفظة',
      }))
    }
  }, [])

  // ── connect — ربط MetaMask الافتراضي (window.ethereum) ──────────────────────
  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setState(s => ({ ...s, error: 'يرجى تثبيت محفظة بلوكتشين أولاً' }))        // لا توجد محفظة مثبّتة في المتصفح
      return
    }
    await connectWith(window.ethereum)                                               // يُعيد استخدام connectWith لتوحيد المنطق
  }, [connectWith])

  // ── switchToSepolia — تبديل الشبكة لـ Sepolia Testnet ────────────────────────
  const switchToSepolia = useCallback(async () => {
    const p = state.provider || window.ethereum                                      // استخدم المزوّد النشط أو window.ethereum
    if (!p) return
    try {
      // محاولة 1: التبديل مباشرة (تنجح إذا أُضيفت Sepolia في المحفظة مسبقاً)
      await p.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0xaa36a7' }] })
      // 0xaa36a7 hex = 11155111 decimal = chainId شبكة Sepolia
    } catch {
      // محاولة 2: إذا لم تكن Sepolia موجودة → أضفها بكامل تفاصيل الشبكة
      await p.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0xaa36a7',
          chainName: 'Sepolia Testnet',
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['https://rpc.sepolia.org'],                                      // عنوان RPC للاتصال بالشبكة
          blockExplorerUrls: ['https://sepolia.etherscan.io'],                       // رابط مستكشف الكتل
        }],
      })
    }
  }, [state.provider])

  // ── Event listeners — يعيد الربط عند تغيير المزوّد النشط ────────────────────
  useEffect(() => {
    const p = state.provider || window.ethereum
    if (!p) return

    // onAccounts — يُطلَق عند تغيير الحساب أو قطع الاتصال من داخل المحفظة
    const onAccounts = (accs: unknown) => {
      const accounts = accs as string[]
      // قائمة فارغة = المستخدم قطع الاتصال يدوياً → disconnect كاملاً
      // وإلا: حدّث العنوان بالحساب الأول في القائمة
      accounts.length === 0 ? disconnect() : setState(s => ({ ...s, address: accounts[0] }))
    }

    // onChain — يُطلَق عند تغيير الشبكة من داخل المحفظة
    const onChain = (chainId: unknown) => {
      // chainId يصل كـ hex string (مثل "0xaa36a7") → parseInt(x, 16) لتحويله لرقم صحيح
      setState(s => ({ ...s, chainId: parseInt(chainId as string, 16) }))
    }

    p.on?.('accountsChanged', onAccounts)   // اشترك في حدث تغيير الحساب
    p.on?.('chainChanged',    onChain)       // اشترك في حدث تغيير الشبكة
    return () => {
      // إلغاء الاشتراك عند إعادة التركيب أو تغيير المزوّد (تجنّب memory leak)
      p.removeListener?.('accountsChanged', onAccounts)
      p.removeListener?.('chainChanged',    onChain)
    }
  }, [state.provider, disconnect])

  // ── Auto-reconnect — إعادة الاتصال التلقائي عند تحميل الصفحة ────────────────
  // eth_accounts (بلا popup) يُرجع الحسابات المصرّح بها مسبقاً فقط
  // يختلف عن eth_requestAccounts الذي يُظهر popup طلب الإذن في كل مرة
  useEffect(() => {
    if (!window.ethereum) return
    window.ethereum.request({ method: 'eth_accounts' }).then(async (accs: unknown) => {
      const accounts = accs as string[]
      if (accounts.length > 0) {                                                    // إذا كان المستخدم وصّل المحفظة في جلسة سابقة
        const ethProvider = new ethers.BrowserProvider(window.ethereum!)
        const network     = await ethProvider.getNetwork()                          // اجلب الشبكة الحالية
        setActiveProvider(window.ethereum)                                           // سجّل المزوّد في blockchain.ts
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
