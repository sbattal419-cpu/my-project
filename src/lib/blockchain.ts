// ════════════════════════════════════════════════════════════════
// FILE: src/lib/blockchain.ts
// كل عمليات Ethereum: ABI العقد، تسجيل الحق، التحقق، نقل الملكية
// الشبكة: Sepolia Testnet (chainId: 11155111)
// للتعديل: ابحث عن اسم الوظيفة مثل: registerIPOnChain / hashFile / fetchCertificate
// ════════════════════════════════════════════════════════════════
import { ethers } from 'ethers'
import { BLOCKCHAIN } from '../config/blockchain.config'

// _activeProvider — المزوّد النشط (MetaMask أو محفظة EIP-6963 أخرى)
// يُضبط عبر setActiveProvider عند ربط محفظة
let _activeProvider: any = null
export function setActiveProvider(p: any) { _activeProvider = p }

// ════════════════════════════════════════════════════════════════
// SECTION: CONTRACT ABI — واجهة العقد الذكي
// للتعديل: ابحث عن CONTRACT ABI
// registerIP     → تسجيل حق جديد → يُرجع certId
// getCertificate → قراءة شهادة بالـ certId
// verifyByHash   → البحث بهاش الملف → يُرجع certId
// getOwnerCertificates → كل شهادات عنوان محفظة
// transferCertificate  → نقل الملكية لعنوان آخر
// ════════════════════════════════════════════════════════════════
export const CONTRACT_ABI = [
  {
    inputs: [
      { name: 'documentHash', type: 'bytes32' },
      { name: 'ipType',       type: 'uint8'   },
      { name: 'title',        type: 'string'  },
      { name: 'description',  type: 'string'  },
      { name: 'holderName',   type: 'string'  },
    ],
    name: 'registerIP',
    outputs: [{ name: 'certId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'certId', type: 'uint256' }],
    name: 'getCertificate',
    outputs: [
      { name: 'owner',        type: 'address' },
      { name: 'documentHash', type: 'bytes32' },
      { name: 'ipType',       type: 'uint8'   },
      { name: 'title',        type: 'string'  },
      { name: 'description',  type: 'string'  },
      { name: 'holderName',   type: 'string'  },
      { name: 'registeredAt', type: 'uint256' },
      { name: 'isValid',      type: 'bool'    },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'documentHash', type: 'bytes32' }],
    name: 'verifyByHash',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'getOwnerCertificates',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'certId',   type: 'uint256' },
      { name: 'newOwner', type: 'address' },
    ],
    name: 'transferCertificate',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalCertificates',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true,  name: 'certId',       type: 'uint256' },
      { indexed: true,  name: 'owner',         type: 'address' },
      { indexed: false, name: 'documentHash',  type: 'bytes32' },
      { indexed: false, name: 'ipType',        type: 'uint8'   },
      { indexed: false, name: 'title',         type: 'string'  },
      { indexed: false, name: 'timestamp',     type: 'uint256' },
    ],
    name: 'IPRegistered',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'certId', type: 'uint256' },
      { indexed: true, name: 'from',   type: 'address' },
      { indexed: true, name: 'to',     type: 'address' },
    ],
    name: 'CertificateTransferred',
    type: 'event',
  },
]

// ════════════════════════════════════════════════════════════════
// SECTION: HELPERS — وظائف مساعدة
// للتعديل: ابحث عن HELPERS
// ════════════════════════════════════════════════════════════════

// ── getProvider — يُرجع BrowserProvider من المحفظة المتصلة (للقراءة والكتابة) ─
export function getProvider() {
  const p = _activeProvider ?? window.ethereum                                      // استخدم المزوّد النشط أو window.ethereum
  if (!p) throw new Error('لا يوجد محفظة متصلة')
  return new ethers.BrowserProvider(p)                                             // BrowserProvider يفهم محافظ المتصفح
}

// ── getReadOnlyProvider — مزوّد للقراءة فقط (بدون محفظة) ────────────────────
function getReadOnlyProvider() {
  return new ethers.JsonRpcProvider(BLOCKCHAIN.PUBLIC_RPC)                         // يتصل بـ RPC العامة مباشرة (بدون توقيع)
}

// ── getContractAddress — يقرأ عنوان العقد من env أو localStorage ────────────
export function getContractAddress(): string {
  return (
    BLOCKCHAIN.CONTRACT_ADDRESS ||
    localStorage.getItem('ipr_contract_address') ||
    '0x0000000000000000000000000000000000000000'
  )
}

// ── getContract — يُنشئ كائن العقد الذكي للتفاعل معه ──────────────────────────
// signed=true  → يحتاج توقيع من المحفظة (للكتابة: registerIP, transferCertificate)
// signed=false → قراءة فقط (getCertificate, verifyByHash, getOwnerCertificates)
export async function getContract(signed = false) {
  const addr = getContractAddress()
  if (signed) {
    const provider = getProvider()
    const signer = await provider.getSigner()                                       // Signer = هوية المحفظة للتوقيع على المعاملات
    return new ethers.Contract(addr, CONTRACT_ABI, signer)
  }
  // للقراءة: استخدم BrowserProvider إذا وُجدت محفظة، وإلا انتقل لـ RPC عامة
  const provider = (_activeProvider ?? (typeof window !== 'undefined' && window.ethereum))
    ? getProvider()
    : getReadOnlyProvider()                                                         // fallback للـ RPC العامة (بدون محفظة)
  return new ethers.Contract(addr, CONTRACT_ABI, provider)
}

// ── buildDocumentHash — بناء هاش فريد للحق الفكري ─────────────────────────────
// يُشفّر بيانات الحق بصيغة ABI ثم يطبّق keccak256 (هاش Ethereum الأساسي)
// النتيجة: bytes32 فريد يُرسَل للعقد الذكي كمعرّف للوثيقة
// nonce = الوقت الحالي بالثواني لضمان أن كل تسجيل يعطي هاشاً مختلفاً
export function buildDocumentHash(data: {
  title: string
  ipType: number
  description: string
  holderName: string
  ownerAddress: string
  nonce: number
}): string {
  // AbiCoder.encode يحوّل البيانات لصيغة bytes بترتيب وأنواع ثابتة كما يفهمها EVM
  const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
    ['string', 'uint8', 'string', 'string', 'address', 'uint256'],                 // أنواع Solidity
    [data.title, data.ipType, data.description, data.holderName, data.ownerAddress, data.nonce]
  )
  return ethers.keccak256(encoded)                                                  // keccak256 = خوارزمية الهاش في Ethereum
}

// truncateAddress — اختصار عنوان المحفظة للعرض: 0x1234...abcd
export function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`                                 // أول 6 أحرف + آخر 4 أحرف
}

// ── hashFile — حساب هاش SHA-256 لملف ────────────────────────────────────────
// يُستخدم كبصمة فريدة للملف لتسجيلها على البلوكشين
// الخطوات:
// 1. arrayBuffer() → قراءة الملف كبيانات ثنائية خام
// 2. crypto.subtle.digest → تطبيق SHA-256 بالـ Web Crypto API (أسرع من JS خالص)
// 3. Uint8Array → تحويل الـ buffer لمصفوفة بايتات
// 4. hex string → تحويل كل بايت لرقمين hex مع padding (مثل: 5 → "05")
export async function hashFile(file: File): Promise<string> {
  const buffer    = await file.arrayBuffer()                                        // اقرأ الملف كـ ArrayBuffer
  const hashBuf   = await crypto.subtle.digest('SHA-256', buffer)                  // طبّق SHA-256 على البيانات الخام
  const hashArray = Array.from(new Uint8Array(hashBuf))                            // حوّل لمصفوفة بايتات
  return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('')       // حوّل كل بايت لـ hex مع "0x" في البداية
}

// ─── Perceptual Hash (dHash) — للصور فقط ─────────────────────────────────────
// خوارزمية dHash: تقارن البيكسلات المتجاورة في صورة مصغّرة 9×8
// النتيجة: سلسلة 64 حرف (0/1) — صور متشابهة = أرقام متقاربة
export async function computePerceptualHash(file: File): Promise<string | null> {
  if (!file.type.startsWith('image/')) return null

  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width  = 9
        canvas.height = 8
        const ctx = canvas.getContext('2d')
        if (!ctx) { URL.revokeObjectURL(url); resolve(null); return }

        ctx.drawImage(img, 0, 0, 9, 8)
        const { data } = ctx.getImageData(0, 0, 9, 8)

        let hash = ''
        for (let y = 0; y < 8; y++) {
          for (let x = 0; x < 8; x++) {
            const i1 = (y * 9 + x)     * 4
            const i2 = (y * 9 + x + 1) * 4
            const gray1 = 0.299 * data[i1] + 0.587 * data[i1 + 1] + 0.114 * data[i1 + 2]
            const gray2 = 0.299 * data[i2] + 0.587 * data[i2 + 1] + 0.114 * data[i2 + 2]
            hash += gray1 > gray2 ? '1' : '0'
          }
        }

        URL.revokeObjectURL(url)
        resolve(hash)
      } catch {
        URL.revokeObjectURL(url)
        resolve(null)
      }
    }

    img.onerror = () => { URL.revokeObjectURL(url); resolve(null) }
    img.src = url
  })
}

// مسافة هامينغ: كم بت مختلف بين هاشين (0 = متطابق، 64 = مختلف كلياً)
export function hammingDistance(h1: string, h2: string): number {
  let dist = 0
  const len = Math.min(h1.length, h2.length)
  for (let i = 0; i < len; i++) {
    if (h1[i] !== h2[i]) dist++
  }
  return dist
}

// عتبة التشابه: مسافة ≤ 10 = رفض (تشابه ~84%+)
export const PHASH_THRESHOLD = 10

export interface RegisterParams {
  title: string
  ipType: number
  description: string
  holderName: string
  ownerAddress: string
  fileHash?: string  // SHA-256 hash of the uploaded file
}

export interface RegisterResult {
  certId: string
  txHash: string
  documentHash: string
  blockNumber: number
}

// ════════════════════════════════════════════════════════════════
// SECTION: registerIPOnChain — التسجيل على البلوكشين
// للتعديل: ابحث عن registerIPOnChain
// الخطوات:
// 1. getContract(signed=true) → يحتاج توقيع من MetaMask
// 2. contract.registerIP(docHash, ipType, title, ...) → إرسال معاملة
// 3. tx.wait() → الانتظار حتى تُؤكَّد الكتلة
// 4. استخراج certId من حدث IPRegistered في الـ logs
// ════════════════════════════════════════════════════════════════
export async function registerIPOnChain(params: RegisterParams): Promise<RegisterResult> {
  const contract = await getContract(true)
  const nonce    = Math.floor(Date.now() / 1000)
  const docHash  = params.fileHash ?? buildDocumentHash({ ...params, nonce })

  const tx      = await contract.registerIP(docHash, params.ipType, params.title, params.description, params.holderName)
  const receipt = await tx.wait()

  let certId = '0'
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log)
      if (parsed?.name === 'IPRegistered') {
        certId = parsed.args.certId.toString()
        break
      }
    } catch { /* skip non-matching logs */ }
  }

  return { certId, txHash: receipt.hash, documentHash: docHash, blockNumber: receipt.blockNumber }
}

// ════════════════════════════════════════════════════════════════
// SECTION: VERIFY — التحقق من الشهادات
// للتعديل: ابحث عن VERIFY
// fetchCertificate — جلب بيانات شهادة بـ certId (قراءة فقط)
// verifyByHash    — البحث بهاش الملف → يُرجع certId (0 = غير موجود)
// ════════════════════════════════════════════════════════════════
export interface CertificateData {
  certId: string
  owner: string
  documentHash: string
  ipType: number
  title: string
  description: string
  holderName: string
  registeredAt: Date
  isValid: boolean
  txHash?: string          // هاش معاملة التسجيل (متوفر فقط عند الجلب من Supabase)
}

// ── fetchCertificate — جلب بيانات شهادة من البلوكشين بـ certId ──────────────
// getCertificate يُرجع tuple بترتيب ثابت محدد في ABI — نقرأ بالأرقام r[0]..r[7]
export async function fetchCertificate(certId: string): Promise<CertificateData> {
  const contract = await getContract()
  const r = await contract.getCertificate(BigInt(certId))                          // BigInt مطلوب لـ uint256 في ethers.js v6
  return {
    certId,
    owner:        r[0],                                                             // address المالك الحالي
    documentHash: r[1],                                                             // bytes32 هاش الوثيقة
    ipType:       Number(r[2]),                                                     // uint8 نوع الحق (0-4)
    title:        r[3],                                                             // string العنوان
    description:  r[4],                                                             // string الوصف
    holderName:   r[5],                                                             // string اسم صاحب الحق
    registeredAt: new Date(Number(r[6]) * 1000),                                   // uint256 Unix timestamp → ضرب×1000 لتحويله لـ JS Date
    isValid:      r[7],                                                             // bool هل الشهادة سارية؟
  }
}

export async function verifyByHash(hash: string): Promise<string> {
  const contract = await getContract()
  const id = await contract.verifyByHash(hash)
  return id.toString()
}

// ════════════════════════════════════════════════════════════════
// SECTION: OWNER CERTS — شهادات المحفظة
// للتعديل: ابحث عن OWNER CERTS
// fetchOwnerCertificates — كل شهادات عنوان محفظة (للعرض في CertificatesPage)
// transferCertOnChain    — نقل ملكية شهادة لعنوان آخر
// ════════════════════════════════════════════════════════════════
// ── fetchOwnerCertificates — جلب كل شهادات عنوان محفظة ─────────────────────
// getOwnerCertificates يُرجع مصفوفة certIds → نجلب كل شهادة بالتوازي
export async function fetchOwnerCertificates(address: string): Promise<CertificateData[]> {
  const contract = await getContract()
  const ids: bigint[] = await contract.getOwnerCertificates(address)               // اجلب كل IDs الشهادات لهذا العنوان

  // Promise.all تجلب كل الشهادات بالتوازي (أسرع من تسلسلي)
  // نجلب هاش معاملة التسجيل بالتوازي أيضاً (fallback للشهادات اللي ما إلها صف بـ Supabase)
  const certs = await Promise.all(
    ids.map(async id => {
      const [cert, txHash] = await Promise.all([
        fetchCertificate(id.toString()),
        fetchRegistrationTxHash(id.toString()),
      ])
      return { ...cert, txHash: txHash ?? undefined }
    })
  )
  return certs.reverse()                                                            // اعكس الترتيب لعرض الأحدث أولاً
}

// ── fetchRegistrationTxHash — هاش معاملة تسجيل شهادة عبر حدث IPRegistered ────
// fallback عندما لا يتوفر tx_hash من Supabase (شهادات ما إلها صف بالجدول)
export async function fetchRegistrationTxHash(certId: string): Promise<string | null> {
  try {
    const contract = await getContract()
    const id = BigInt(certId)
    const provider = contract.runner as any
    const address = await contract.getAddress()
    const latest = await provider.getBlockNumber()
    const deployBlock = await findDeploymentBlock(provider, address)
    const logs = await queryFilterChunked(contract, contract.filters.IPRegistered(id), deployBlock, latest)
    return (logs[0] as any)?.transactionHash ?? null
  } catch {
    return null
  }
}

// ── transferCertOnChain — نقل ملكية شهادة لعنوان آخر ─────────────────────────
// يحتاج توقيع (signed=true) لأنها معاملة كتابة على البلوكشين
export async function transferCertOnChain(certId: string, toAddress: string): Promise<string> {
  const contract = await getContract(true)                                          // Signer مطلوب للتوقيع
  const tx = await contract.transferCertificate(BigInt(certId), toAddress)         // أرسل معاملة البلوكشين
  const receipt = await tx.wait()                                                   // انتظر تأكيد الكتلة
  return receipt.hash                                                               // أرجع txHash للتسجيل والعرض
}

// ════════════════════════════════════════════════════════════════
// SECTION: HISTORY — سجل أحداث الشهادة الكامل (تسجيل + كل عمليات النقل)
// للتعديل: ابحث عن fetchCertificateHistory
// ════════════════════════════════════════════════════════════════
export interface HistoryEvent {
  type: 'registered' | 'transferred'
  txHash: string
  blockNumber: number
  timestamp: number | null   // Unix ms، أو null إذا تعذّر جلب وقت الكتلة
  owner?: string             // لحدث التسجيل
  from?: string               // لحدث النقل
  to?: string                 // لحدث النقل
}

// MAX_LOG_RANGE — أقصى عدد كتل بالاستعلام الواحد (RPC العامة مثل rpc.sepolia.org
// ترفض eth_getLogs إذا تجاوز المدى من الكتلة 0 حتى الأحدث — نُقسِّم الاستعلام لدفعات آمنة)
const MAX_LOG_RANGE = 5000

// findDeploymentBlock — يحدّد رقم كتلة نشر العقد عبر بحث ثنائي (binary search) على eth_getCode
// أسرع بكثير من مسح كل السجل من الكتلة 0، ويُخزَّن بالنتيجة بـ localStorage لتفادي إعادة البحث
async function findDeploymentBlock(provider: any, address: string): Promise<number> {
  const cacheKey = `ipr_deploy_block_${address.toLowerCase()}`
  const cached = localStorage.getItem(cacheKey)
  if (cached) return Number(cached)

  try {
    let lo = 0
    let hi = await provider.getBlockNumber()
    const latestCode = await provider.getCode(address, hi)
    if (latestCode === '0x') return 0 // العقد غير منشور فعلياً على هذا العنوان

    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2)
      const code = await provider.getCode(address, mid)
      if (code === '0x') lo = mid + 1
      else hi = mid
    }
    localStorage.setItem(cacheKey, String(lo))
    return lo
  } catch {
    return 0 // تعذّر البحث الثنائي → نبدأ من الصفر مع التقسيم لدفعات
  }
}

// queryFilterChunked — يُقسِّم استعلام eth_getLogs لدفعات بحجم MAX_LOG_RANGE
// لتفادي رفض RPC العامة للمدى الواسع، مع تشغيل دفعات محدودة بالتوازي
async function queryFilterChunked(contract: any, filter: any, fromBlock: number, toBlock: number) {
  const ranges: [number, number][] = []
  for (let start = fromBlock; start <= toBlock; start += MAX_LOG_RANGE) {
    ranges.push([start, Math.min(start + MAX_LOG_RANGE - 1, toBlock)])
  }

  const CONCURRENCY = 5
  const results: any[] = []
  for (let i = 0; i < ranges.length; i += CONCURRENCY) {
    const batch = ranges.slice(i, i + CONCURRENCY)
    const batchResults = await Promise.all(
      batch.map(([from, to]) => contract.queryFilter(filter, from, to).catch(() => []))
    )
    for (const r of batchResults) results.push(...r)
  }
  return results
}

// fetchCertificateHistory — يجلب كل أحداث IPRegistered و CertificateTransferred
// الخاصة بشهادة معينة، مرتّبة زمنياً من الأقدم للأحدث
export async function fetchCertificateHistory(certId: string): Promise<HistoryEvent[]> {
  const contract = await getContract()
  const id = BigInt(certId)
  const provider = contract.runner as any
  const address = await contract.getAddress()

  const latest = await provider.getBlockNumber()
  const deployBlock = await findDeploymentBlock(provider, address)

  const [registeredLogs, transferredLogs] = await Promise.all([
    queryFilterChunked(contract, contract.filters.IPRegistered(id), deployBlock, latest),
    queryFilterChunked(contract, contract.filters.CertificateTransferred(id), deployBlock, latest),
  ])

  const events: HistoryEvent[] = []

  for (const log of registeredLogs) {
    const args = (log as ethers.EventLog).args
    events.push({
      type: 'registered',
      txHash: log.transactionHash,
      blockNumber: log.blockNumber,
      timestamp: Number(args.timestamp) * 1000,
      owner: args.owner,
    })
  }

  for (const log of transferredLogs) {
    const args = (log as ethers.EventLog).args
    const block = provider ? await provider.getBlock(log.blockNumber) : null
    events.push({
      type: 'transferred',
      txHash: log.transactionHash,
      blockNumber: log.blockNumber,
      timestamp: block ? block.timestamp * 1000 : null,
      from: args.from,
      to: args.to,
    })
  }

  return events.sort((a, b) => a.blockNumber - b.blockNumber)
}

// isContractDeployed — تحقق هل نشرنا العقد الذكي فعلاً (ليس العنوان الافتراضي)
export function isContractDeployed(): boolean {
  return getContractAddress() !== '0x0000000000000000000000000000000000000000'
}
