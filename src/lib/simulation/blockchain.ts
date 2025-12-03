/**
 * SIMULATED BLOCKCHAIN SMART CONTRACT MODULE
 * 
 * This module simulates a blockchain-based certificate registry
 * for the ZK-Vault system.
 * 
 * In a real implementation, this would:
 * - Deploy to Ethereum/Polygon/Solana
 * - Use Solidity smart contracts
 * - Require gas fees for transactions
 * - Provide immutable, distributed storage
 * 
 * Our simulation:
 * - Uses an in-memory array as the "ledger"
 * - Implements immutability by design (no editing, only appending)
 * - Simulates transaction hashes and block numbers
 * - Provides all core smart contract functions
 * 
 * Key concepts demonstrated:
 * 1. Immutability: Once stored, records cannot be modified
 * 2. Transparency: All records are viewable
 * 3. Traceability: Full audit trail with timestamps
 * 4. Revocation: Soft-delete pattern for certificates
 */

import { hashString } from './hash';
import { ZKProof } from './zksnark';

/**
 * Certificate record stored on the "blockchain"
 */
export interface CertificateRecord {
  // Unique identifier
  id: string;
  
  // Certificate data
  hash: string;           // SHA-256 hash of certificate
  cid: string;           // IPFS content identifier
  proof: ZKProof;        // zk-SNARK proof
  
  // Issuance info
  issuer: string;        // Issuer's address/ID
  issuedTo: string;      // Holder's address/ID
  certificateType: string;
  metadata: Record<string, unknown>;
  
  // Blockchain metadata
  transactionHash: string;
  blockNumber: number;
  timestamp: Date;
  
  // Status (revocation uses append-only pattern)
  status: 'active' | 'revoked' | 'suspended';
  statusHistory: StatusChange[];
}

interface StatusChange {
  from: string;
  to: string;
  changedBy: string;
  reason: string;
  timestamp: Date;
  transactionHash: string;
}

/**
 * Verification attempt log
 */
export interface VerificationLog {
  id: string;
  certificateHash: string;
  verifier: string;
  timestamp: Date;
  result: 'valid' | 'invalid' | 'revoked' | 'not_found';
  details: string;
}

// Simulated blockchain state
let blockchain: CertificateRecord[] = [];
let verificationLogs: VerificationLog[] = [];
let currentBlockNumber = 1;

/**
 * Generate a fake transaction hash
 */
function generateTransactionHash(): string {
  const random = Math.random().toString(36).substring(2);
  return '0x' + hashString(random + Date.now()).substring(0, 64);
}

/**
 * Generate unique record ID
 */
function generateRecordId(): string {
  return 'CERT_' + Date.now().toString(36).toUpperCase() + '_' + 
         Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * SMART CONTRACT FUNCTION: Store a new certificate
 * 
 * Simulates: CertificateRegistry.storeCertificate(hash, cid, proof, issuer)
 * 
 * @param params - Certificate parameters
 * @returns Transaction result
 */
export function storeCertificate(params: {
  hash: string;
  cid: string;
  proof: ZKProof;
  issuer: string;
  issuedTo: string;
  certificateType: string;
  metadata?: Record<string, unknown>;
}): { success: boolean; record: CertificateRecord; transactionHash: string } {
  const { hash, cid, proof, issuer, issuedTo, certificateType, metadata = {} } = params;
  
  // Check for duplicate hash (immutability enforcement)
  const existing = blockchain.find(r => r.hash === hash && r.status === 'active');
  if (existing) {
    throw new Error('Certificate with this hash already exists');
  }
  
  const transactionHash = generateTransactionHash();
  const record: CertificateRecord = {
    id: generateRecordId(),
    hash,
    cid,
    proof,
    issuer,
    issuedTo,
    certificateType,
    metadata,
    transactionHash,
    blockNumber: currentBlockNumber++,
    timestamp: new Date(),
    status: 'active',
    statusHistory: [{
      from: 'none',
      to: 'active',
      changedBy: issuer,
      reason: 'Initial issuance',
      timestamp: new Date(),
      transactionHash,
    }],
  };
  
  // Append to blockchain (immutable operation)
  blockchain = [...blockchain, record];
  
  return { success: true, record, transactionHash };
}

/**
 * SMART CONTRACT FUNCTION: Verify a certificate
 * 
 * Simulates: CertificateRegistry.verifyCertificate(hash, proof)
 * 
 * @param hash - Certificate hash
 * @param proofHash - Hash of the proof for verification
 * @param verifier - ID of entity performing verification
 * @returns Verification result
 */
export function verifyCertificate(
  hash: string,
  proofHash: string,
  verifier: string
): { 
  valid: boolean; 
  record: CertificateRecord | null; 
  message: string;
} {
  // Find certificate by hash
  const record = blockchain.find(r => r.hash === hash);
  
  let result: 'valid' | 'invalid' | 'revoked' | 'not_found';
  let message: string;
  let valid = false;
  
  if (!record) {
    result = 'not_found';
    message = 'Certificate not found in registry';
  } else if (record.status === 'revoked') {
    result = 'revoked';
    message = 'Certificate has been revoked';
  } else if (record.status === 'suspended') {
    result = 'invalid';
    message = 'Certificate is currently suspended';
  } else {
    // Verify proof hash matches stored proof
    const storedProofHash = hashString(JSON.stringify(record.proof));
    if (storedProofHash === proofHash) {
      result = 'valid';
      message = 'Certificate is valid and active';
      valid = true;
    } else {
      result = 'invalid';
      message = 'Proof does not match stored certificate';
    }
  }
  
  // Log verification attempt
  const log: VerificationLog = {
    id: 'VER_' + Date.now().toString(36).toUpperCase(),
    certificateHash: hash,
    verifier,
    timestamp: new Date(),
    result,
    details: message,
  };
  verificationLogs = [...verificationLogs, log];
  
  return { valid, record: record || null, message };
}

/**
 * SMART CONTRACT FUNCTION: Revoke a certificate
 * 
 * Simulates: CertificateRegistry.revokeCertificate(hash)
 * 
 * @param hash - Certificate hash to revoke
 * @param revokedBy - Admin/issuer revoking
 * @param reason - Reason for revocation
 * @returns Revocation result
 */
export function revokeCertificate(
  hash: string,
  revokedBy: string,
  reason: string
): { success: boolean; transactionHash: string; message: string } {
  const recordIndex = blockchain.findIndex(r => r.hash === hash);
  
  if (recordIndex === -1) {
    return { success: false, transactionHash: '', message: 'Certificate not found' };
  }
  
  const record = blockchain[recordIndex];
  
  if (record.status === 'revoked') {
    return { success: false, transactionHash: '', message: 'Certificate already revoked' };
  }
  
  const transactionHash = generateTransactionHash();
  
  // Create new record with updated status (append-only pattern)
  const updatedRecord: CertificateRecord = {
    ...record,
    status: 'revoked',
    statusHistory: [
      ...record.statusHistory,
      {
        from: record.status,
        to: 'revoked',
        changedBy: revokedBy,
        reason,
        timestamp: new Date(),
        transactionHash,
      },
    ],
  };
  
  // Update in place (in a real blockchain, this would be a new transaction)
  blockchain = blockchain.map((r, i) => i === recordIndex ? updatedRecord : r);
  
  return { success: true, transactionHash, message: 'Certificate revoked successfully' };
}

/**
 * SMART CONTRACT FUNCTION: Suspend a certificate
 * 
 * @param hash - Certificate hash
 * @param suspendedBy - Admin suspending
 * @param reason - Reason for suspension
 */
export function suspendCertificate(
  hash: string,
  suspendedBy: string,
  reason: string
): { success: boolean; transactionHash: string; message: string } {
  const recordIndex = blockchain.findIndex(r => r.hash === hash);
  
  if (recordIndex === -1) {
    return { success: false, transactionHash: '', message: 'Certificate not found' };
  }
  
  const record = blockchain[recordIndex];
  
  if (record.status !== 'active') {
    return { success: false, transactionHash: '', message: `Cannot suspend certificate with status: ${record.status}` };
  }
  
  const transactionHash = generateTransactionHash();
  
  const updatedRecord: CertificateRecord = {
    ...record,
    status: 'suspended',
    statusHistory: [
      ...record.statusHistory,
      {
        from: record.status,
        to: 'suspended',
        changedBy: suspendedBy,
        reason,
        timestamp: new Date(),
        transactionHash,
      },
    ],
  };
  
  blockchain = blockchain.map((r, i) => i === recordIndex ? updatedRecord : r);
  
  return { success: true, transactionHash, message: 'Certificate suspended successfully' };
}

/**
 * SMART CONTRACT FUNCTION: Reinstate a suspended certificate
 */
export function reinstateCertificate(
  hash: string,
  reinstatedBy: string,
  reason: string
): { success: boolean; transactionHash: string; message: string } {
  const recordIndex = blockchain.findIndex(r => r.hash === hash);
  
  if (recordIndex === -1) {
    return { success: false, transactionHash: '', message: 'Certificate not found' };
  }
  
  const record = blockchain[recordIndex];
  
  if (record.status !== 'suspended') {
    return { success: false, transactionHash: '', message: 'Can only reinstate suspended certificates' };
  }
  
  const transactionHash = generateTransactionHash();
  
  const updatedRecord: CertificateRecord = {
    ...record,
    status: 'active',
    statusHistory: [
      ...record.statusHistory,
      {
        from: record.status,
        to: 'active',
        changedBy: reinstatedBy,
        reason,
        timestamp: new Date(),
        transactionHash,
      },
    ],
  };
  
  blockchain = blockchain.map((r, i) => i === recordIndex ? updatedRecord : r);
  
  return { success: true, transactionHash, message: 'Certificate reinstated successfully' };
}

/**
 * Query functions for reading blockchain state
 */
export function getAllCertificates(): CertificateRecord[] {
  return [...blockchain];
}

export function getCertificateByHash(hash: string): CertificateRecord | undefined {
  return blockchain.find(r => r.hash === hash);
}

export function getCertificatesByCID(cid: string): CertificateRecord[] {
  return blockchain.filter(r => r.cid === cid);
}

export function getCertificatesByIssuer(issuer: string): CertificateRecord[] {
  return blockchain.filter(r => r.issuer === issuer);
}

export function getCertificatesByHolder(holder: string): CertificateRecord[] {
  return blockchain.filter(r => r.issuedTo === holder);
}

export function getVerificationLogs(): VerificationLog[] {
  return [...verificationLogs];
}

export function getVerificationLogsByVerifier(verifier: string): VerificationLog[] {
  return verificationLogs.filter(l => l.verifier === verifier);
}

/**
 * Statistics for dashboard
 */
export function getBlockchainStats(): {
  totalCertificates: number;
  activeCertificates: number;
  revokedCertificates: number;
  suspendedCertificates: number;
  totalVerifications: number;
  successfulVerifications: number;
  currentBlockNumber: number;
} {
  return {
    totalCertificates: blockchain.length,
    activeCertificates: blockchain.filter(r => r.status === 'active').length,
    revokedCertificates: blockchain.filter(r => r.status === 'revoked').length,
    suspendedCertificates: blockchain.filter(r => r.status === 'suspended').length,
    totalVerifications: verificationLogs.length,
    successfulVerifications: verificationLogs.filter(l => l.result === 'valid').length,
    currentBlockNumber,
  };
}

/**
 * Reset blockchain (for testing)
 */
export function resetBlockchain(): void {
  blockchain = [];
  verificationLogs = [];
  currentBlockNumber = 1;
}

/**
 * Initialize with demo data
 */
export function initializeDemoData(): void {
  // This will be called to populate some initial demo certificates
}
