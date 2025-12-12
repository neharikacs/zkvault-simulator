/**
 * Smart Contract Simulation Module
 * 
 * Implements realistic smart contract logic for certificate management.
 * Uses localStorage for persistence with proper state management.
 */

import { hashString } from '../simulation/hash';
import { ZKProof } from '../zksnark/prover';

// Storage keys
const STORAGE_KEYS = {
  CERTIFICATES: 'zkvault_certificates',
  BLOCKS: 'zkvault_blocks',
  TRANSACTIONS: 'zkvault_transactions',
  EVENTS: 'zkvault_events',
  BLOCK_NUMBER: 'zkvault_block_number',
} as const;

/**
 * Smart Contract Events (mimics Solidity events)
 */
export type ContractEvent = 
  | CertificateIssuedEvent
  | CertificateVerifiedEvent
  | CertificateRevokedEvent
  | CertificateSuspendedEvent
  | CertificateReinstatedEvent;

interface BaseEvent {
  eventName: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: string;
  logIndex: number;
}

export interface CertificateIssuedEvent extends BaseEvent {
  eventName: 'CertificateIssued';
  args: {
    certificateId: string;
    issuer: string;
    holder: string;
    documentType: string;
    documentHash: string;
    ipfsCid: string;
  };
}

export interface CertificateVerifiedEvent extends BaseEvent {
  eventName: 'CertificateVerified';
  args: {
    certificateId: string;
    verifier: string;
    result: boolean;
    proofValid: boolean;
  };
}

export interface CertificateRevokedEvent extends BaseEvent {
  eventName: 'CertificateRevoked';
  args: {
    certificateId: string;
    revokedBy: string;
    reason: string;
  };
}

export interface CertificateSuspendedEvent extends BaseEvent {
  eventName: 'CertificateSuspended';
  args: {
    certificateId: string;
    suspendedBy: string;
    reason: string;
  };
}

export interface CertificateReinstatedEvent extends BaseEvent {
  eventName: 'CertificateReinstated';
  args: {
    certificateId: string;
    reinstatedBy: string;
    reason: string;
  };
}

/**
 * Certificate structure stored on-chain
 */
export interface OnChainCertificate {
  id: string;
  documentHash: string;
  ipfsCid: string;
  proofHash: string;
  proof: ZKProof;
  issuer: string;
  holder: string;
  documentType: string;
  documentCategory: string;
  metadata: Record<string, unknown>;
  status: 'active' | 'revoked' | 'suspended';
  createdAt: string;
  updatedAt: string;
  blockNumber: number;
  transactionHash: string;
}

/**
 * Block structure
 */
export interface Block {
  number: number;
  hash: string;
  parentHash: string;
  timestamp: string;
  transactions: string[];
  gasUsed: number;
  gasLimit: number;
}

/**
 * Transaction structure
 */
export interface Transaction {
  hash: string;
  from: string;
  to: string;
  blockNumber: number;
  timestamp: string;
  method: string;
  args: Record<string, unknown>;
  status: 'success' | 'failed';
  gasUsed: number;
  events: string[];
}

// State management
function loadState<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveState<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function getNextBlockNumber(): number {
  const current = parseInt(localStorage.getItem(STORAGE_KEYS.BLOCK_NUMBER) || '1');
  localStorage.setItem(STORAGE_KEYS.BLOCK_NUMBER, String(current + 1));
  return current;
}

function generateTransactionHash(): string {
  const random = crypto.getRandomValues(new Uint8Array(32));
  const hex = Array.from(random, b => b.toString(16).padStart(2, '0')).join('');
  return '0x' + hex;
}

function generateBlockHash(blockNumber: number, transactions: string[]): string {
  return '0x' + hashString(`block_${blockNumber}_${transactions.join('_')}_${Date.now()}`);
}

function generateCertificateId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.getRandomValues(new Uint8Array(4));
  const hex = Array.from(random, b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  return `CERT_${timestamp}_${hex}`;
}

/**
 * Emit a contract event
 */
function emitEvent(event: ContractEvent): void {
  const events = loadState<ContractEvent[]>(STORAGE_KEYS.EVENTS, []);
  events.push(event);
  saveState(STORAGE_KEYS.EVENTS, events);
}

/**
 * Create a new block
 */
function mineBlock(transactions: string[]): Block {
  const blocks = loadState<Block[]>(STORAGE_KEYS.BLOCKS, []);
  const blockNumber = getNextBlockNumber();
  const parentHash = blocks.length > 0 ? blocks[blocks.length - 1].hash : '0x' + '0'.repeat(64);

  const block: Block = {
    number: blockNumber,
    hash: generateBlockHash(blockNumber, transactions),
    parentHash,
    timestamp: new Date().toISOString(),
    transactions,
    gasUsed: Math.floor(Math.random() * 50000) + 21000,
    gasLimit: 15000000,
  };

  blocks.push(block);
  saveState(STORAGE_KEYS.BLOCKS, blocks);

  return block;
}

/**
 * Record a transaction
 */
function recordTransaction(
  from: string,
  to: string,
  method: string,
  args: Record<string, unknown>,
  blockNumber: number,
  eventIds: string[]
): Transaction {
  const transactions = loadState<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);

  const tx: Transaction = {
    hash: generateTransactionHash(),
    from,
    to: to || 'CertificateRegistry',
    blockNumber,
    timestamp: new Date().toISOString(),
    method,
    args,
    status: 'success',
    gasUsed: Math.floor(Math.random() * 50000) + 21000,
    events: eventIds,
  };

  transactions.push(tx);
  saveState(STORAGE_KEYS.TRANSACTIONS, transactions);

  return tx;
}

/**
 * SMART CONTRACT: Issue a new certificate
 */
export async function issueCertificate(params: {
  documentHash: string;
  ipfsCid: string;
  proof: ZKProof;
  issuer: string;
  holder: string;
  documentType: string;
  documentCategory: string;
  metadata?: Record<string, unknown>;
}): Promise<{
  success: boolean;
  certificate: OnChainCertificate;
  transaction: Transaction;
  block: Block;
  events: ContractEvent[];
}> {
  const certificates = loadState<OnChainCertificate[]>(STORAGE_KEYS.CERTIFICATES, []);

  // Check for duplicate hash
  const existing = certificates.find(c => c.documentHash === params.documentHash && c.status === 'active');
  if (existing) {
    throw new Error('REVERT: Certificate with this hash already exists');
  }

  const certificateId = generateCertificateId();
  const proofHash = hashString(JSON.stringify(params.proof));
  const timestamp = new Date().toISOString();

  // Create certificate
  const certificate: OnChainCertificate = {
    id: certificateId,
    documentHash: params.documentHash,
    ipfsCid: params.ipfsCid,
    proofHash,
    proof: params.proof,
    issuer: params.issuer,
    holder: params.holder,
    documentType: params.documentType,
    documentCategory: params.documentCategory,
    metadata: params.metadata || {},
    status: 'active',
    createdAt: timestamp,
    updatedAt: timestamp,
    blockNumber: 0, // Will be set after mining
    transactionHash: '', // Will be set after transaction
  };

  // Mine block and record transaction
  const tx = recordTransaction(
    params.issuer,
    'CertificateRegistry',
    'issueCertificate',
    {
      documentHash: params.documentHash,
      ipfsCid: params.ipfsCid,
      holder: params.holder,
      documentType: params.documentType,
    },
    0,
    []
  );

  const block = mineBlock([tx.hash]);
  certificate.blockNumber = block.number;
  certificate.transactionHash = tx.hash;

  // Emit event
  const event: CertificateIssuedEvent = {
    eventName: 'CertificateIssued',
    transactionHash: tx.hash,
    blockNumber: block.number,
    timestamp,
    logIndex: 0,
    args: {
      certificateId,
      issuer: params.issuer,
      holder: params.holder,
      documentType: params.documentType,
      documentHash: params.documentHash,
      ipfsCid: params.ipfsCid,
    },
  };
  emitEvent(event);

  // Save certificate
  certificates.push(certificate);
  saveState(STORAGE_KEYS.CERTIFICATES, certificates);

  // Simulate blockchain delay
  await new Promise(resolve => setTimeout(resolve, 300));

  return {
    success: true,
    certificate,
    transaction: tx,
    block,
    events: [event],
  };
}

/**
 * SMART CONTRACT: Verify a certificate
 */
export async function verifyCertificateOnChain(
  documentHash: string,
  proofJson: string,
  verifier: string
): Promise<{
  valid: boolean;
  certificate: OnChainCertificate | null;
  message: string;
  transaction: Transaction;
  events: ContractEvent[];
}> {
  const certificates = loadState<OnChainCertificate[]>(STORAGE_KEYS.CERTIFICATES, []);
  const certificate = certificates.find(c => c.documentHash === documentHash);

  let valid = false;
  let message = '';
  let proofValid = false;

  if (!certificate) {
    message = 'Certificate not found in registry';
  } else if (certificate.status === 'revoked') {
    message = 'Certificate has been revoked';
  } else if (certificate.status === 'suspended') {
    message = 'Certificate is currently suspended';
  } else {
    // Verify proof hash
    if (proofJson) {
      const providedProofHash = hashString(proofJson);
      proofValid = providedProofHash === certificate.proofHash;
      
      if (proofValid) {
        valid = true;
        message = 'Certificate verified successfully';
      } else {
        message = 'Proof verification failed';
      }
    } else {
      valid = true;
      message = 'Certificate exists and is active (no proof provided)';
    }
  }

  // Record transaction
  const tx = recordTransaction(
    verifier,
    'CertificateRegistry',
    'verifyCertificate',
    { documentHash, hasProof: !!proofJson },
    0,
    []
  );

  const block = mineBlock([tx.hash]);

  // Emit event
  const event: CertificateVerifiedEvent = {
    eventName: 'CertificateVerified',
    transactionHash: tx.hash,
    blockNumber: block.number,
    timestamp: new Date().toISOString(),
    logIndex: 0,
    args: {
      certificateId: certificate?.id || 'NOT_FOUND',
      verifier,
      result: valid,
      proofValid,
    },
  };
  emitEvent(event);

  await new Promise(resolve => setTimeout(resolve, 200));

  return {
    valid,
    certificate: certificate || null,
    message,
    transaction: tx,
    events: [event],
  };
}

/**
 * SMART CONTRACT: Revoke a certificate
 */
export async function revokeCertificateOnChain(
  documentHash: string,
  revokedBy: string,
  reason: string
): Promise<{
  success: boolean;
  transaction: Transaction;
  message: string;
  events: ContractEvent[];
}> {
  const certificates = loadState<OnChainCertificate[]>(STORAGE_KEYS.CERTIFICATES, []);
  const index = certificates.findIndex(c => c.documentHash === documentHash);

  if (index === -1) {
    throw new Error('REVERT: Certificate not found');
  }

  const certificate = certificates[index];
  if (certificate.status === 'revoked') {
    throw new Error('REVERT: Certificate already revoked');
  }

  // Update certificate
  certificates[index] = {
    ...certificate,
    status: 'revoked',
    updatedAt: new Date().toISOString(),
  };
  saveState(STORAGE_KEYS.CERTIFICATES, certificates);

  // Record transaction
  const tx = recordTransaction(
    revokedBy,
    'CertificateRegistry',
    'revokeCertificate',
    { documentHash, reason },
    0,
    []
  );

  const block = mineBlock([tx.hash]);

  // Emit event
  const event: CertificateRevokedEvent = {
    eventName: 'CertificateRevoked',
    transactionHash: tx.hash,
    blockNumber: block.number,
    timestamp: new Date().toISOString(),
    logIndex: 0,
    args: {
      certificateId: certificate.id,
      revokedBy,
      reason,
    },
  };
  emitEvent(event);

  await new Promise(resolve => setTimeout(resolve, 200));

  return {
    success: true,
    transaction: tx,
    message: 'Certificate revoked successfully',
    events: [event],
  };
}

/**
 * SMART CONTRACT: Suspend a certificate
 */
export async function suspendCertificateOnChain(
  documentHash: string,
  suspendedBy: string,
  reason: string
): Promise<{
  success: boolean;
  transaction: Transaction;
  message: string;
  events: ContractEvent[];
}> {
  const certificates = loadState<OnChainCertificate[]>(STORAGE_KEYS.CERTIFICATES, []);
  const index = certificates.findIndex(c => c.documentHash === documentHash);

  if (index === -1) {
    throw new Error('REVERT: Certificate not found');
  }

  const certificate = certificates[index];
  if (certificate.status !== 'active') {
    throw new Error(`REVERT: Cannot suspend certificate with status: ${certificate.status}`);
  }

  // Update certificate
  certificates[index] = {
    ...certificate,
    status: 'suspended',
    updatedAt: new Date().toISOString(),
  };
  saveState(STORAGE_KEYS.CERTIFICATES, certificates);

  // Record transaction
  const tx = recordTransaction(
    suspendedBy,
    'CertificateRegistry',
    'suspendCertificate',
    { documentHash, reason },
    0,
    []
  );

  const block = mineBlock([tx.hash]);

  // Emit event
  const event: CertificateSuspendedEvent = {
    eventName: 'CertificateSuspended',
    transactionHash: tx.hash,
    blockNumber: block.number,
    timestamp: new Date().toISOString(),
    logIndex: 0,
    args: {
      certificateId: certificate.id,
      suspendedBy,
      reason,
    },
  };
  emitEvent(event);

  await new Promise(resolve => setTimeout(resolve, 200));

  return {
    success: true,
    transaction: tx,
    message: 'Certificate suspended successfully',
    events: [event],
  };
}

/**
 * SMART CONTRACT: Reinstate a suspended certificate
 */
export async function reinstateCertificateOnChain(
  documentHash: string,
  reinstatedBy: string,
  reason: string
): Promise<{
  success: boolean;
  transaction: Transaction;
  message: string;
  events: ContractEvent[];
}> {
  const certificates = loadState<OnChainCertificate[]>(STORAGE_KEYS.CERTIFICATES, []);
  const index = certificates.findIndex(c => c.documentHash === documentHash);

  if (index === -1) {
    throw new Error('REVERT: Certificate not found');
  }

  const certificate = certificates[index];
  if (certificate.status !== 'suspended') {
    throw new Error('REVERT: Can only reinstate suspended certificates');
  }

  // Update certificate
  certificates[index] = {
    ...certificate,
    status: 'active',
    updatedAt: new Date().toISOString(),
  };
  saveState(STORAGE_KEYS.CERTIFICATES, certificates);

  // Record transaction
  const tx = recordTransaction(
    reinstatedBy,
    'CertificateRegistry',
    'reinstateCertificate',
    { documentHash, reason },
    0,
    []
  );

  const block = mineBlock([tx.hash]);

  // Emit event
  const event: CertificateReinstatedEvent = {
    eventName: 'CertificateReinstated',
    transactionHash: tx.hash,
    blockNumber: block.number,
    timestamp: new Date().toISOString(),
    logIndex: 0,
    args: {
      certificateId: certificate.id,
      reinstatedBy,
      reason,
    },
  };
  emitEvent(event);

  await new Promise(resolve => setTimeout(resolve, 200));

  return {
    success: true,
    transaction: tx,
    message: 'Certificate reinstated successfully',
    events: [event],
  };
}

// Query functions
export function getAllCertificates(): OnChainCertificate[] {
  return loadState<OnChainCertificate[]>(STORAGE_KEYS.CERTIFICATES, []);
}

export function getCertificateByHash(hash: string): OnChainCertificate | undefined {
  return getAllCertificates().find(c => c.documentHash === hash);
}

export function getCertificateById(id: string): OnChainCertificate | undefined {
  return getAllCertificates().find(c => c.id === id);
}

export function getCertificatesByIssuer(issuer: string): OnChainCertificate[] {
  return getAllCertificates().filter(c => c.issuer === issuer);
}

export function getCertificatesByHolder(holder: string): OnChainCertificate[] {
  return getAllCertificates().filter(c => c.holder === holder);
}

export function getCertificatesByCategory(category: string): OnChainCertificate[] {
  return getAllCertificates().filter(c => c.documentCategory === category);
}

export function getAllBlocks(): Block[] {
  return loadState<Block[]>(STORAGE_KEYS.BLOCKS, []);
}

export function getAllTransactions(): Transaction[] {
  return loadState<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
}

export function getAllEvents(): ContractEvent[] {
  return loadState<ContractEvent[]>(STORAGE_KEYS.EVENTS, []);
}

export function getBlockchainStats(): {
  totalCertificates: number;
  activeCertificates: number;
  revokedCertificates: number;
  suspendedCertificates: number;
  totalBlocks: number;
  totalTransactions: number;
  totalEvents: number;
  currentBlockNumber: number;
} {
  const certificates = getAllCertificates();
  const blocks = getAllBlocks();
  const transactions = getAllTransactions();
  const events = getAllEvents();
  const currentBlockNumber = parseInt(localStorage.getItem(STORAGE_KEYS.BLOCK_NUMBER) || '1');

  return {
    totalCertificates: certificates.length,
    activeCertificates: certificates.filter(c => c.status === 'active').length,
    revokedCertificates: certificates.filter(c => c.status === 'revoked').length,
    suspendedCertificates: certificates.filter(c => c.status === 'suspended').length,
    totalBlocks: blocks.length,
    totalTransactions: transactions.length,
    totalEvents: events.length,
    currentBlockNumber,
  };
}

/**
 * Reset blockchain state (for testing)
 */
export function resetBlockchainState(): void {
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
}
