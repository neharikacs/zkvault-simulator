/**
 * SIMULATED BLOCKCHAIN SMART CONTRACT MODULE
 * 
 * This module simulates a blockchain-based certificate registry
 * for the ZK-Vault system with localStorage persistence.
 * 
 * Key features:
 * 1. Persistence: Data survives page refreshes
 * 2. Immutability: Once stored, records cannot be modified (only status changes)
 * 3. Transparency: All records are viewable
 * 4. Traceability: Full audit trail with timestamps
 * 5. Revocation: Soft-delete pattern for certificates
 */

import { hashString } from './hash';
import { ZKProof } from './zksnark';

const BLOCKCHAIN_KEY = 'zkvault_blockchain';
const VERIFICATION_LOGS_KEY = 'zkvault_verification_logs';
const BLOCK_NUMBER_KEY = 'zkvault_block_number';

/**
 * Certificate record stored on the "blockchain"
 */
export interface CertificateRecord {
  id: string;
  hash: string;
  cid: string;
  proof: ZKProof;
  proofHash: string; // Store the hash of the proof for verification
  issuer: string;
  issuedTo: string;
  certificateType: string;
  metadata: Record<string, unknown>;
  transactionHash: string;
  blockNumber: number;
  timestamp: string;
  status: 'active' | 'revoked' | 'suspended';
  statusHistory: StatusChange[];
}

interface StatusChange {
  from: string;
  to: string;
  changedBy: string;
  reason: string;
  timestamp: string;
  transactionHash: string;
}

export interface VerificationLog {
  id: string;
  certificateHash: string;
  verifier: string;
  timestamp: string;
  result: 'valid' | 'invalid' | 'revoked' | 'not_found';
  details: string;
}

/**
 * Load blockchain from localStorage
 */
function loadBlockchain(): CertificateRecord[] {
  try {
    const stored = localStorage.getItem(BLOCKCHAIN_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save blockchain to localStorage
 */
function saveBlockchain(blockchain: CertificateRecord[]): void {
  localStorage.setItem(BLOCKCHAIN_KEY, JSON.stringify(blockchain));
}

/**
 * Load verification logs from localStorage
 */
function loadVerificationLogs(): VerificationLog[] {
  try {
    const stored = localStorage.getItem(VERIFICATION_LOGS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save verification logs to localStorage
 */
function saveVerificationLogs(logs: VerificationLog[]): void {
  localStorage.setItem(VERIFICATION_LOGS_KEY, JSON.stringify(logs));
}

/**
 * Get and increment block number
 */
function getNextBlockNumber(): number {
  const current = parseInt(localStorage.getItem(BLOCK_NUMBER_KEY) || '1');
  localStorage.setItem(BLOCK_NUMBER_KEY, String(current + 1));
  return current;
}

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
  
  const blockchain = loadBlockchain();
  
  // Check for duplicate hash
  const existing = blockchain.find(r => r.hash === hash && r.status === 'active');
  if (existing) {
    throw new Error('Certificate with this hash already exists');
  }
  
  const transactionHash = generateTransactionHash();
  const proofHash = hashString(JSON.stringify(proof));
  
  const record: CertificateRecord = {
    id: generateRecordId(),
    hash,
    cid,
    proof,
    proofHash, // Store the proof hash for verification
    issuer,
    issuedTo,
    certificateType,
    metadata,
    transactionHash,
    blockNumber: getNextBlockNumber(),
    timestamp: new Date().toISOString(),
    status: 'active',
    statusHistory: [{
      from: 'none',
      to: 'active',
      changedBy: issuer,
      reason: 'Initial issuance',
      timestamp: new Date().toISOString(),
      transactionHash,
    }],
  };
  
  blockchain.push(record);
  saveBlockchain(blockchain);
  
  return { success: true, record, transactionHash };
}

/**
 * SMART CONTRACT FUNCTION: Verify a certificate
 */
export function verifyCertificate(
  hash: string,
  proofJson: string,
  verifier: string
): { 
  valid: boolean; 
  record: CertificateRecord | null; 
  message: string;
} {
  const blockchain = loadBlockchain();
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
    // Verify proof - compare with stored proof hash
    if (proofJson) {
      try {
        const providedProofHash = hashString(proofJson);
        if (providedProofHash === record.proofHash) {
          result = 'valid';
          message = 'Certificate is valid and active';
          valid = true;
        } else {
          result = 'invalid';
          message = 'Proof does not match stored certificate';
        }
      } catch {
        result = 'invalid';
        message = 'Invalid proof format';
      }
    } else {
      // No proof provided, just verify hash exists
      result = 'valid';
      message = 'Certificate hash found and active (no proof provided)';
      valid = true;
    }
  }
  
  // Log verification attempt
  const logs = loadVerificationLogs();
  const log: VerificationLog = {
    id: 'VER_' + Date.now().toString(36).toUpperCase(),
    certificateHash: hash,
    verifier,
    timestamp: new Date().toISOString(),
    result,
    details: message,
  };
  logs.push(log);
  saveVerificationLogs(logs);
  
  return { valid, record: record || null, message };
}

/**
 * SMART CONTRACT FUNCTION: Revoke a certificate
 */
export function revokeCertificate(
  hash: string,
  revokedBy: string,
  reason: string
): { success: boolean; transactionHash: string; message: string } {
  const blockchain = loadBlockchain();
  const recordIndex = blockchain.findIndex(r => r.hash === hash);
  
  if (recordIndex === -1) {
    return { success: false, transactionHash: '', message: 'Certificate not found' };
  }
  
  const record = blockchain[recordIndex];
  
  if (record.status === 'revoked') {
    return { success: false, transactionHash: '', message: 'Certificate already revoked' };
  }
  
  const transactionHash = generateTransactionHash();
  
  blockchain[recordIndex] = {
    ...record,
    status: 'revoked',
    statusHistory: [
      ...record.statusHistory,
      {
        from: record.status,
        to: 'revoked',
        changedBy: revokedBy,
        reason,
        timestamp: new Date().toISOString(),
        transactionHash,
      },
    ],
  };
  
  saveBlockchain(blockchain);
  
  return { success: true, transactionHash, message: 'Certificate revoked successfully' };
}

/**
 * SMART CONTRACT FUNCTION: Suspend a certificate
 */
export function suspendCertificate(
  hash: string,
  suspendedBy: string,
  reason: string
): { success: boolean; transactionHash: string; message: string } {
  const blockchain = loadBlockchain();
  const recordIndex = blockchain.findIndex(r => r.hash === hash);
  
  if (recordIndex === -1) {
    return { success: false, transactionHash: '', message: 'Certificate not found' };
  }
  
  const record = blockchain[recordIndex];
  
  if (record.status !== 'active') {
    return { success: false, transactionHash: '', message: `Cannot suspend certificate with status: ${record.status}` };
  }
  
  const transactionHash = generateTransactionHash();
  
  blockchain[recordIndex] = {
    ...record,
    status: 'suspended',
    statusHistory: [
      ...record.statusHistory,
      {
        from: record.status,
        to: 'suspended',
        changedBy: suspendedBy,
        reason,
        timestamp: new Date().toISOString(),
        transactionHash,
      },
    ],
  };
  
  saveBlockchain(blockchain);
  
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
  const blockchain = loadBlockchain();
  const recordIndex = blockchain.findIndex(r => r.hash === hash);
  
  if (recordIndex === -1) {
    return { success: false, transactionHash: '', message: 'Certificate not found' };
  }
  
  const record = blockchain[recordIndex];
  
  if (record.status !== 'suspended') {
    return { success: false, transactionHash: '', message: 'Can only reinstate suspended certificates' };
  }
  
  const transactionHash = generateTransactionHash();
  
  blockchain[recordIndex] = {
    ...record,
    status: 'active',
    statusHistory: [
      ...record.statusHistory,
      {
        from: record.status,
        to: 'active',
        changedBy: reinstatedBy,
        reason,
        timestamp: new Date().toISOString(),
        transactionHash,
      },
    ],
  };
  
  saveBlockchain(blockchain);
  
  return { success: true, transactionHash, message: 'Certificate reinstated successfully' };
}

/**
 * Query functions for reading blockchain state
 */
export function getAllCertificates(): CertificateRecord[] {
  return loadBlockchain();
}

export function getCertificateByHash(hash: string): CertificateRecord | undefined {
  return loadBlockchain().find(r => r.hash === hash);
}

export function getCertificatesByCID(cid: string): CertificateRecord[] {
  return loadBlockchain().filter(r => r.cid === cid);
}

export function getCertificatesByIssuer(issuer: string): CertificateRecord[] {
  return loadBlockchain().filter(r => r.issuer === issuer);
}

export function getCertificatesByHolder(holder: string): CertificateRecord[] {
  return loadBlockchain().filter(r => r.issuedTo === holder);
}

export function getVerificationLogs(): VerificationLog[] {
  return loadVerificationLogs();
}

export function getVerificationLogsByVerifier(verifier: string): VerificationLog[] {
  return loadVerificationLogs().filter(l => l.verifier === verifier);
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
  const blockchain = loadBlockchain();
  const logs = loadVerificationLogs();
  const currentBlockNumber = parseInt(localStorage.getItem(BLOCK_NUMBER_KEY) || '1');
  
  return {
    totalCertificates: blockchain.length,
    activeCertificates: blockchain.filter(r => r.status === 'active').length,
    revokedCertificates: blockchain.filter(r => r.status === 'revoked').length,
    suspendedCertificates: blockchain.filter(r => r.status === 'suspended').length,
    totalVerifications: logs.length,
    successfulVerifications: logs.filter(l => l.result === 'valid').length,
    currentBlockNumber,
  };
}

/**
 * Reset blockchain (for testing)
 */
export function resetBlockchain(): void {
  localStorage.removeItem(BLOCKCHAIN_KEY);
  localStorage.removeItem(VERIFICATION_LOGS_KEY);
  localStorage.removeItem(BLOCK_NUMBER_KEY);
}

/**
 * Initialize with demo data
 */
export function initializeDemoData(): void {
  // This will be called to populate some initial demo certificates
}
