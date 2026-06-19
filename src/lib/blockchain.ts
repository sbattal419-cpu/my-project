import { ethers } from 'ethers'
import { BLOCKCHAIN } from '../config/blockchain.config'

// ─── Active Provider ───────────────────────────────────────────────────────────
let _activeProvider: any = null
export function setActiveProvider(p: any) { _activeProvider = p }

// ─── ABI ─────────────────────────────────────────────────────────────────────
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
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function getProvider() {
  const p = _activeProvider ?? window.ethereum
  if (!p) throw new Error('لا يوجد محفظة متصلة')
  return new ethers.BrowserProvider(p)
}

function getReadOnlyProvider() {
  return new ethers.JsonRpcProvider(BLOCKCHAIN.PUBLIC_RPC)
}

export async function getContract(signed = false) {
  if (signed) {
    const provider = getProvider()
    const signer = await provider.getSigner()
    return new ethers.Contract(BLOCKCHAIN.CONTRACT_ADDRESS, CONTRACT_ABI, signer)
  }
  const provider = (_activeProvider ?? (typeof window !== 'undefined' && window.ethereum))
    ? getProvider()
    : getReadOnlyProvider()
  return new ethers.Contract(BLOCKCHAIN.CONTRACT_ADDRESS, CONTRACT_ABI, provider)
}

export function buildDocumentHash(data: {
  title: string
  ipType: number
  description: string
  holderName: string
  ownerAddress: string
  nonce: number
}): string {
  const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
    ['string', 'uint8', 'string', 'string', 'address', 'uint256'],
    [data.title, data.ipType, data.description, data.holderName, data.ownerAddress, data.nonce]
  )
  return ethers.keccak256(encoded)
}

export function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export function truncateHash(hash: string): string {
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`
}

// ─── SHA-256 ──────────────────────────────────────────────────────────────────
export async function hashFile(file: File): Promise<string> {
  const buffer    = await file.arrayBuffer()
  const hashBuf   = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuf))
  return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
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

// ─── الخيار ب: التحقق من الحق ────────────────────────────────────────────────
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
}

export async function fetchCertificate(certId: string): Promise<CertificateData> {
  const contract = await getContract()
  const r = await contract.getCertificate(BigInt(certId))
  return {
    certId,
    owner:        r[0],
    documentHash: r[1],
    ipType:       Number(r[2]),
    title:        r[3],
    description:  r[4],
    holderName:   r[5],
    registeredAt: new Date(Number(r[6]) * 1000),
    isValid:      r[7],
  }
}

export async function verifyByHash(hash: string): Promise<string> {
  const contract = await getContract()
  const id = await contract.verifyByHash(hash)
  return id.toString()
}

// ─── الخيار ج: NFT Gallery ────────────────────────────────────────────────────
export async function fetchOwnerCertificates(address: string): Promise<CertificateData[]> {
  const contract = await getContract()
  const ids: bigint[] = await contract.getOwnerCertificates(address)

  const certs = await Promise.all(
    ids.map(id => fetchCertificate(id.toString()))
  )
  return certs.reverse()
}

export async function transferCertOnChain(certId: string, toAddress: string): Promise<string> {
  const contract = await getContract(true)
  const tx = await contract.transferCertificate(BigInt(certId), toAddress)
  const receipt = await tx.wait()
  return receipt.hash
}

export function isContractDeployed(): boolean {
  return BLOCKCHAIN.CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000'
}
