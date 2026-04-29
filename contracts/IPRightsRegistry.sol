// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IPRightsRegistry - منظومة تسجيل الحقوق الفكرية على البلوكتشين
contract IPRightsRegistry {

    enum IPType { Copyright, Trademark, Patent, Consultation }

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

    // ─── تسجيل حق جديد ───────────────────────────────────────────────────────
    function registerIP(
        bytes32 documentHash,
        uint8   ipType,
        string  calldata title,
        string  calldata description,
        string  calldata holderName
    ) external returns (uint256 certId) {
        require(documentHash != bytes32(0),        "Hash cannot be empty");
        require(ipType <= 3,                        "Invalid IP type");
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

    // ─── قراءة شهادة ─────────────────────────────────────────────────────────
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

    // ─── التحقق بالهاش ───────────────────────────────────────────────────────
    function verifyByHash(bytes32 documentHash) external view returns (uint256) {
        return hashToCertId[documentHash];
    }

    // ─── شهادات المالك (NFT Gallery) ─────────────────────────────────────────
    function getOwnerCertificates(address owner) external view returns (uint256[] memory) {
        return _ownerCerts[owner];
    }

    // ─── تحويل الشهادة (مثل NFT transfer) ────────────────────────────────────
    function transferCertificate(uint256 certId, address newOwner) external {
        require(certificates[certId].owner == msg.sender, "Not the owner");
        require(newOwner != address(0), "Invalid address");

        address oldOwner = certificates[certId].owner;
        certificates[certId].owner = newOwner;
        _ownerCerts[newOwner].push(certId);

        emit CertificateTransferred(certId, oldOwner, newOwner);
    }

    function totalCertificates() external view returns (uint256) {
        return _nextId;
    }
}
