// ════════════════════════════════════════════════════════════════
// FILE: src/config/blockchain.config.ts
// إعدادات البلوكشين والعقد الذكي
// لتغيير عنوان العقد: عدّل VITE_CONTRACT_ADDRESS في ملف .env
// للتعديل: ابحث عن BLOCKCHAIN أو IP_TYPES
// ════════════════════════════════════════════════════════════════
export const BLOCKCHAIN = {
  CONTRACT_ADDRESS: (import.meta.env.VITE_CONTRACT_ADDRESS as string) ?? '0x0000000000000000000000000000000000000000',
  CHAIN_ID: 11155111,
  NETWORK_NAME: 'Sepolia Testnet',
  EXPLORER: 'https://sepolia.etherscan.io',
  PUBLIC_RPC: 'https://rpc.sepolia.org',
}

// IP_TYPES — أنواع الحقوق الفكرية: value يُستخدم في العقد وDB
// value: 0=حق مؤلف  1=علامة تجارية  2=براءة اختراع
export const IP_TYPES = [
  { value: 0, label: 'حقوق النشر',       labelKey: 'ipt.0', color: '#2563eb', bg: 'rgba(37,99,235,0.1)'  },
  { value: 1, label: 'العلامات التجارية', labelKey: 'ipt.1', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
  { value: 2, label: 'براءات الاختراع',   labelKey: 'ipt.2', color: '#d97706', bg: 'rgba(217,119,6,0.1)'  },
]

export type IPTypeValue = 0 | 1 | 2 | 3
