// ════════════════════════════════════════════════════════════════
// FILE: src/lib/deploy.ts
// نشر العقد الذكي مباشرة من المتصفح عبر MetaMask
// يحمّل مترجم Solidity 0.8.20 ويجمّع وينشر العقد
// ════════════════════════════════════════════════════════════════
import { ethers } from 'ethers'
import { CONTRACT_ABI, getProvider } from './blockchain'

const SOLJSON_URL =
  'https://binaries.soliditylang.org/bin/soljson-v0.8.20+commit.a1b79de6.js'

// النص الكامل للعقد الذكي — يُجمَّع في المتصفح
const CONTRACT_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract IPRightsRegistry {

    enum IPType { Copyright, Trademark, Patent }

    struct Certificate {
        uint256 id;
        address owner;
        bytes32 documentHash;
        IPType  ipType;
        string  title;
        string  description;
        string  holderName;
        uint256 registeredAt;
        bool    isValid;
    }

    uint256 private _nextId;

    mapping(uint256  => Certificate) public certificates;
    mapping(bytes32  => uint256)     public hashToCertId;
    mapping(address  => uint256[])   private _ownerCerts;

    event IPRegistered(
        uint256 indexed certId,
        address indexed owner,
        bytes32         documentHash,
        uint8           ipType,
        string          title,
        uint256         timestamp
    );

    event CertificateTransferred(
        uint256 indexed certId,
        address indexed from,
        address indexed to
    );

    function registerIP(
        bytes32 documentHash,
        uint8   ipType,
        string  calldata title,
        string  calldata description,
        string  calldata holderName
    ) external returns (uint256 certId) {
        require(documentHash != bytes32(0),        "Hash cannot be empty");
        require(ipType <= 2,                        "Invalid IP type");
        require(hashToCertId[documentHash] == 0,   "Already registered");
        require(bytes(title).length > 0,           "Title required");

        _nextId++;
        certId = _nextId;

        certificates[certId] = Certificate({
            id:           certId,
            owner:        msg.sender,
            documentHash: documentHash,
            ipType:       IPType(ipType),
            title:        title,
            description:  description,
            holderName:   holderName,
            registeredAt: block.timestamp,
            isValid:      true
        });

        hashToCertId[documentHash] = certId;
        _ownerCerts[msg.sender].push(certId);

        emit IPRegistered(certId, msg.sender, documentHash, ipType, title, block.timestamp);
    }

    function getCertificate(uint256 certId) external view returns (
        address owner,
        bytes32 documentHash,
        uint8   ipType,
        string  memory title,
        string  memory description,
        string  memory holderName,
        uint256 registeredAt,
        bool    isValid
    ) {
        Certificate storage c = certificates[certId];
        require(c.id != 0, "Certificate not found");
        return (c.owner, c.documentHash, uint8(c.ipType), c.title, c.description, c.holderName, c.registeredAt, c.isValid);
    }

    function verifyByHash(bytes32 documentHash) external view returns (uint256) {
        return hashToCertId[documentHash];
    }

    function getOwnerCertificates(address owner) external view returns (uint256[] memory) {
        return _ownerCerts[owner];
    }

    function _removeOwnerCert(address owner, uint256 certId) private {
        uint256[] storage certs = _ownerCerts[owner];
        for (uint256 i = 0; i < certs.length; i++) {
            if (certs[i] == certId) {
                certs[i] = certs[certs.length - 1];
                certs.pop();
                break;
            }
        }
    }

    function transferCertificate(uint256 certId, address newOwner) external {
        require(certificates[certId].owner == msg.sender, "Not the owner");
        require(newOwner != address(0), "Invalid address");

        address oldOwner = certificates[certId].owner;
        certificates[certId].owner = newOwner;
        _removeOwnerCert(oldOwner, certId);
        _ownerCerts[newOwner].push(certId);

        emit CertificateTransferred(certId, oldOwner, newOwner);
    }

    function totalCertificates() external view returns (uint256) {
        return _nextId;
    }
}
`

// ── loadSolcCompiler — يحمّل مترجم Solidity من الإنترنت ────────────────────
// يستخدم soljson (WebAssembly) الرسمي من Ethereum Foundation
async function loadSolcCompiler(): Promise<(input: string) => string> {
  return new Promise((resolve, reject) => {
    // إعداد Module قبل تحميل السكريبت حتى يستدعى onRuntimeInitialized
    ;(window as any).Module = {
      onRuntimeInitialized() {
        try {
          const M = (window as any).Module
          const fn = M.cwrap('solidity_compile', 'string', ['string', 'number'])
          resolve(fn)
        } catch {
          reject(new Error('فشل تهيئة المترجم'))
        }
      },
    }

    const script = document.createElement('script')
    script.src = SOLJSON_URL
    script.onerror = () => reject(new Error('فشل تحميل المترجم — تحقق من الإنترنت'))
    document.head.appendChild(script)

    setTimeout(
      () => reject(new Error('انتهت مهلة تحميل المترجم (60 ثانية)')),
      60_000,
    )
  })
}

// ── compileContract — يجمّع العقد ويستخرج الـ bytecode ─────────────────────
function compileContract(solcFn: (input: string) => string): string {
  const input = {
    language: 'Solidity',
    sources: { 'IPRightsRegistry.sol': { content: CONTRACT_SOURCE } },
    settings: {
      outputSelection: { '*': { '*': ['evm.bytecode.object'] } },
      optimizer: { enabled: true, runs: 200 },
    },
  }

  const rawOutput = solcFn(JSON.stringify(input))
  const output = JSON.parse(rawOutput)

  const errors = (output.errors ?? []).filter((e: any) => e.severity === 'error')
  if (errors.length > 0) {
    throw new Error('خطأ في التجميع: ' + errors[0].formattedMessage)
  }

  const bytecode =
    output.contracts?.['IPRightsRegistry.sol']?.['IPRightsRegistry']
      ?.evm?.bytecode?.object

  if (!bytecode) throw new Error('لم يتم استخراج الـ bytecode')
  return '0x' + bytecode
}

// ════════════════════════════════════════════════════════════════
// compileAndDeploy — الدالة الرئيسية: تجميع + نشر العقد عبر MetaMask
// onStatus: دالة callback لعرض رسائل التقدم في الواجهة
// ════════════════════════════════════════════════════════════════
export async function compileAndDeploy(
  onStatus: (msg: string) => void,
): Promise<string> {
  onStatus('جاري تحميل مترجم Solidity 0.8.20...')
  const solcFn = await loadSolcCompiler()

  onStatus('جاري تجميع العقد الذكي...')
  const bytecode = compileContract(solcFn)

  onStatus('افتح MetaMask وأكّد نشر العقد...')
  const provider = getProvider()
  const signer = await provider.getSigner()
  const factory = new ethers.ContractFactory(CONTRACT_ABI, bytecode, signer)
  const contract = await factory.deploy()

  onStatus('في انتظار تأكيد البلوكشين...')
  await contract.waitForDeployment()

  const address = await contract.getAddress()
  localStorage.setItem('ipr_contract_address', address)

  return address
}

// saveManualAddress — لحفظ العنوان يدوياً إذا نشر العقد من مكان آخر
export function saveManualAddress(address: string) {
  localStorage.setItem('ipr_contract_address', address)
}
