/**
 * ZK-SNARK Circuit Definitions
 * 
 * This module defines the circuit structure for ZK proofs.
 * In production, these would be compiled Circom circuits.
 * Here we define the structure used by snarkjs.
 */

export interface CircuitInput {
  // Private inputs (witness)
  documentHash: string;
  holderName: string;
  holderDOB: string;
  documentData: Record<string, unknown>;
  salt: string;
  
  // Public inputs
  publicCommitment: string;
  disclosures: number[];
}

export interface CircuitOutput {
  commitment: string;
  nullifier: string;
  disclosedValues: string[];
}

/**
 * Circuit types for different document categories
 */
export type CircuitType = 
  | 'document_verification'
  | 'age_verification'
  | 'identity_verification'
  | 'credential_verification';

/**
 * Circuit configuration for each type
 */
export const CIRCUIT_CONFIGS: Record<CircuitType, {
  name: string;
  description: string;
  supportedDisclosures: string[];
}> = {
  document_verification: {
    name: 'Document Verification Circuit',
    description: 'Proves document authenticity without revealing content',
    supportedDisclosures: ['documentAuthentic', 'issuerVerified', 'notExpired'],
  },
  age_verification: {
    name: 'Age Verification Circuit',
    description: 'Proves age requirements without revealing birth date',
    supportedDisclosures: ['ageOver18', 'ageOver21', 'ageOver65'],
  },
  identity_verification: {
    name: 'Identity Verification Circuit',
    description: 'Proves identity claims without revealing PII',
    supportedDisclosures: ['identityVerified', 'citizenship', 'residency'],
  },
  credential_verification: {
    name: 'Credential Verification Circuit',
    description: 'Proves qualifications without revealing specifics',
    supportedDisclosures: ['degreeVerified', 'licenseActive', 'certificationValid'],
  },
};

/**
 * Get the appropriate circuit type for a document category
 */
export function getCircuitForCategory(category: string): CircuitType {
  switch (category) {
    case 'educational':
    case 'professional':
      return 'credential_verification';
    case 'identity':
      return 'identity_verification';
    case 'medical':
      return 'document_verification';
    default:
      return 'document_verification';
  }
}
