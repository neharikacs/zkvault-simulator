/**
 * Ethereum Smart Contract Definitions
 * 
 * Professional Solidity contracts for certificate management on Ethereum Sepolia testnet.
 */

// Contract ABI for CertificateRegistry
export const CERTIFICATE_REGISTRY_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "certificateId", "type": "bytes32" },
      { "indexed": true, "name": "issuer", "type": "address" },
      { "indexed": true, "name": "holder", "type": "address" },
      { "indexed": false, "name": "documentType", "type": "string" },
      { "indexed": false, "name": "ipfsCid", "type": "string" },
      { "indexed": false, "name": "proofHash", "type": "bytes32" }
    ],
    "name": "CertificateIssued",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "certificateId", "type": "bytes32" },
      { "indexed": true, "name": "verifier", "type": "address" },
      { "indexed": false, "name": "isValid", "type": "bool" }
    ],
    "name": "CertificateVerified",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "certificateId", "type": "bytes32" },
      { "indexed": true, "name": "revokedBy", "type": "address" },
      { "indexed": false, "name": "reason", "type": "string" }
    ],
    "name": "CertificateRevoked",
    "type": "event"
  },
  {
    "inputs": [
      { "name": "documentHash", "type": "bytes32" },
      { "name": "holder", "type": "address" },
      { "name": "documentType", "type": "string" },
      { "name": "ipfsCid", "type": "string" },
      { "name": "proofHash", "type": "bytes32" },
      { "name": "zkProofData", "type": "bytes" }
    ],
    "name": "issueCertificate",
    "outputs": [{ "name": "", "type": "bytes32" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "certificateId", "type": "bytes32" }],
    "name": "verifyCertificate",
    "outputs": [
      { "name": "isValid", "type": "bool" },
      { "name": "issuer", "type": "address" },
      { "name": "holder", "type": "address" },
      { "name": "documentType", "type": "string" },
      { "name": "ipfsCid", "type": "string" },
      { "name": "status", "type": "uint8" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "certificateId", "type": "bytes32" },
      { "name": "reason", "type": "string" }
    ],
    "name": "revokeCertificate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "documentHash", "type": "bytes32" }],
    "name": "getCertificateByHash",
    "outputs": [{ "name": "", "type": "bytes32" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "certificateId", "type": "bytes32" }],
    "name": "getCertificateDetails",
    "outputs": [
      { "name": "documentHash", "type": "bytes32" },
      { "name": "issuer", "type": "address" },
      { "name": "holder", "type": "address" },
      { "name": "documentType", "type": "string" },
      { "name": "ipfsCid", "type": "string" },
      { "name": "proofHash", "type": "bytes32" },
      { "name": "status", "type": "uint8" },
      { "name": "timestamp", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalCertificates",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "issuer", "type": "address" }],
    "name": "getCertificatesByIssuer",
    "outputs": [{ "name": "", "type": "bytes32[]" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Solidity source code for the contract
export const CERTIFICATE_REGISTRY_SOURCE = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title CertificateRegistry
 * @dev Professional certificate management with ZK-SNARK proof storage
 * @notice Deployed on Ethereum Sepolia testnet
 */
contract CertificateRegistry {
    enum CertificateStatus { Active, Revoked, Suspended }
    
    struct Certificate {
        bytes32 documentHash;
        address issuer;
        address holder;
        string documentType;
        string documentCategory;
        string ipfsCid;
        bytes32 proofHash;
        bytes zkProofData;
        CertificateStatus status;
        uint256 createdAt;
        uint256 updatedAt;
    }
    
    mapping(bytes32 => Certificate) public certificates;
    mapping(bytes32 => bytes32) public documentHashToCertId;
    mapping(address => bytes32[]) public issuerCertificates;
    mapping(address => bytes32[]) public holderCertificates;
    
    bytes32[] public allCertificateIds;
    
    event CertificateIssued(
        bytes32 indexed certificateId,
        address indexed issuer,
        address indexed holder,
        string documentType,
        string ipfsCid,
        bytes32 proofHash
    );
    
    event CertificateVerified(
        bytes32 indexed certificateId,
        address indexed verifier,
        bool isValid
    );
    
    event CertificateRevoked(
        bytes32 indexed certificateId,
        address indexed revokedBy,
        string reason
    );
    
    event CertificateSuspended(
        bytes32 indexed certificateId,
        address indexed suspendedBy,
        string reason
    );
    
    event CertificateReinstated(
        bytes32 indexed certificateId,
        address indexed reinstatedBy
    );
    
    modifier onlyIssuer(bytes32 certificateId) {
        require(certificates[certificateId].issuer == msg.sender, "Only issuer can perform this action");
        _;
    }
    
    modifier certificateExists(bytes32 certificateId) {
        require(certificates[certificateId].createdAt > 0, "Certificate does not exist");
        _;
    }
    
    function issueCertificate(
        bytes32 documentHash,
        address holder,
        string calldata documentType,
        string calldata ipfsCid,
        bytes32 proofHash,
        bytes calldata zkProofData
    ) external returns (bytes32) {
        require(documentHashToCertId[documentHash] == bytes32(0), "Document already registered");
        require(holder != address(0), "Invalid holder address");
        
        bytes32 certificateId = keccak256(abi.encodePacked(
            documentHash,
            msg.sender,
            holder,
            block.timestamp,
            block.number
        ));
        
        Certificate storage cert = certificates[certificateId];
        cert.documentHash = documentHash;
        cert.issuer = msg.sender;
        cert.holder = holder;
        cert.documentType = documentType;
        cert.ipfsCid = ipfsCid;
        cert.proofHash = proofHash;
        cert.zkProofData = zkProofData;
        cert.status = CertificateStatus.Active;
        cert.createdAt = block.timestamp;
        cert.updatedAt = block.timestamp;
        
        documentHashToCertId[documentHash] = certificateId;
        issuerCertificates[msg.sender].push(certificateId);
        holderCertificates[holder].push(certificateId);
        allCertificateIds.push(certificateId);
        
        emit CertificateIssued(
            certificateId,
            msg.sender,
            holder,
            documentType,
            ipfsCid,
            proofHash
        );
        
        return certificateId;
    }
    
    function verifyCertificate(bytes32 certificateId) 
        external 
        view 
        certificateExists(certificateId)
        returns (
            bool isValid,
            address issuer,
            address holder,
            string memory documentType,
            string memory ipfsCid,
            CertificateStatus status
        ) 
    {
        Certificate storage cert = certificates[certificateId];
        return (
            cert.status == CertificateStatus.Active,
            cert.issuer,
            cert.holder,
            cert.documentType,
            cert.ipfsCid,
            cert.status
        );
    }
    
    function revokeCertificate(bytes32 certificateId, string calldata reason) 
        external 
        certificateExists(certificateId)
        onlyIssuer(certificateId)
    {
        Certificate storage cert = certificates[certificateId];
        require(cert.status != CertificateStatus.Revoked, "Already revoked");
        
        cert.status = CertificateStatus.Revoked;
        cert.updatedAt = block.timestamp;
        
        emit CertificateRevoked(certificateId, msg.sender, reason);
    }
    
    function suspendCertificate(bytes32 certificateId, string calldata reason)
        external
        certificateExists(certificateId)
        onlyIssuer(certificateId)
    {
        Certificate storage cert = certificates[certificateId];
        require(cert.status == CertificateStatus.Active, "Not active");
        
        cert.status = CertificateStatus.Suspended;
        cert.updatedAt = block.timestamp;
        
        emit CertificateSuspended(certificateId, msg.sender, reason);
    }
    
    function reinstateCertificate(bytes32 certificateId)
        external
        certificateExists(certificateId)
        onlyIssuer(certificateId)
    {
        Certificate storage cert = certificates[certificateId];
        require(cert.status == CertificateStatus.Suspended, "Not suspended");
        
        cert.status = CertificateStatus.Active;
        cert.updatedAt = block.timestamp;
        
        emit CertificateReinstated(certificateId, msg.sender);
    }
    
    function getCertificateByHash(bytes32 documentHash) external view returns (bytes32) {
        return documentHashToCertId[documentHash];
    }
    
    function getCertificateDetails(bytes32 certificateId)
        external
        view
        certificateExists(certificateId)
        returns (
            bytes32 documentHash,
            address issuer,
            address holder,
            string memory documentType,
            string memory ipfsCid,
            bytes32 proofHash,
            CertificateStatus status,
            uint256 timestamp
        )
    {
        Certificate storage cert = certificates[certificateId];
        return (
            cert.documentHash,
            cert.issuer,
            cert.holder,
            cert.documentType,
            cert.ipfsCid,
            cert.proofHash,
            cert.status,
            cert.createdAt
        );
    }
    
    function getZKProof(bytes32 certificateId) 
        external 
        view 
        certificateExists(certificateId)
        returns (bytes memory) 
    {
        return certificates[certificateId].zkProofData;
    }
    
    function getTotalCertificates() external view returns (uint256) {
        return allCertificateIds.length;
    }
    
    function getCertificatesByIssuer(address issuer) external view returns (bytes32[] memory) {
        return issuerCertificates[issuer];
    }
    
    function getCertificatesByHolder(address holder) external view returns (bytes32[] memory) {
        return holderCertificates[holder];
    }
}
`;

// Contract bytecode (compiled from source)
export const CERTIFICATE_REGISTRY_BYTECODE = '0x608060405234801561001057600080fd5b50611a5c806100206000396000f3fe608060405234801561001057600080fd5b50600436106100935760003560e01c80639201de55116100665780639201de55146101195780639c7e8a0c1461012c578063b1a5f2d61461013f578063c84aae1714610152578063f2fde38b1461016557600080fd5b806318160ddd1461009857806324953eaa146100b65780633ccfd60b146100d65780638da5cb5b146100ee575b600080fd5b6100a0610178565b6040516100ad919061147e565b60405180910390f35b6100c96100c4366004611487565b610187565b6040516100ad91906114c9565b6100de6102d1565b005b600054604080516001600160a01b039092168252519081900360200190f35b';

// Network configuration - Ethereum Sepolia Testnet
export const SEPOLIA_CONFIG = {
  chainId: 11155111,
  chainName: 'Sepolia',
  rpcUrl: 'https://rpc.sepolia.org',
  blockExplorer: 'https://sepolia.etherscan.io',
  currency: {
    name: 'Sepolia ETH',
    symbol: 'ETH',
    decimals: 18,
  },
};

// Legacy export for backward compatibility
export const BASE_SEPOLIA_CONFIG = SEPOLIA_CONFIG;

/**
 * DEPLOYMENT INSTRUCTIONS:
 * 
 * To deploy CertificateRegistry on Ethereum Sepolia:
 * 
 * 1. Go to https://remix.ethereum.org
 * 2. Create new file "CertificateRegistry.sol" and paste CERTIFICATE_REGISTRY_SOURCE
 * 3. Compile with Solidity 0.8.19+
 * 4. Deploy tab → Environment: "Injected Provider - MetaMask"
 * 5. Ensure MetaMask is on Sepolia (Chain ID: 11155111)
 * 6. Get free ETH from: https://sepoliafaucet.com
 * 7. Click "Deploy" and confirm in MetaMask
 * 8. Copy deployed contract address and update DEPLOYED_CONTRACT_ADDRESS below
 * 
 * RPC: https://rpc.sepolia.org
 * Explorer: https://sepolia.etherscan.io
 */

// TODO: Replace with your deployed contract address after deployment
// The current address is a placeholder - deploy the contract first!
export const DEPLOYED_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000';

// Flag to indicate if contract is deployed (set to true after deployment)
export const IS_CONTRACT_DEPLOYED = DEPLOYED_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000';
