export const BLOCKCHAIN = {
  CONTRACT_ADDRESS: (import.meta.env.VITE_CONTRACT_ADDRESS as string) ?? '0x0000000000000000000000000000000000000000',
  CHAIN_ID: 11155111,
  NETWORK_NAME: 'Sepolia Testnet',
  EXPLORER: 'https://sepolia.etherscan.io',
  PUBLIC_RPC: 'https://rpc.sepolia.org',
}

export const IP_TYPES = [
  { value: 0, label: 'حقوق النشر',       labelKey: 'ipt.0', color: '#2563eb', bg: 'rgba(37,99,235,0.1)'  },
  { value: 1, label: 'العلامات التجارية', labelKey: 'ipt.1', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
  { value: 2, label: 'براءات الاختراع',   labelKey: 'ipt.2', color: '#d97706', bg: 'rgba(217,119,6,0.1)'  },
  { value: 3, label: 'استشارة قانونية',   labelKey: 'ipt.3', color: '#059669', bg: 'rgba(5,150,105,0.1)'  },
]

export type IPTypeValue = 0 | 1 | 2 | 3
