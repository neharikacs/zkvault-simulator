/**
 * SHA-256 HASHING MODULE
 * 
 * This module provides REAL SHA-256 hashing functionality
 * for the ZK-Vault system.
 * 
 * SHA-256 is used to:
 * - Create a unique fingerprint of certificate content
 * - Ensure data integrity
 * - Enable tamper detection
 * 
 * This is NOT simulated - we use actual SHA-256 via crypto-js
 */

import SHA256 from 'crypto-js/sha256';
import Hex from 'crypto-js/enc-hex';

/**
 * Generate SHA-256 hash from a file
 * 
 * @param file - File to hash
 * @returns Promise with hex-encoded hash string
 */
export async function hashFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      try {
        const content = reader.result as string;
        // Generate real SHA-256 hash
        const hash = SHA256(content).toString(Hex);
        resolve(hash);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Generate SHA-256 hash from string data
 * 
 * @param data - String to hash
 * @returns Hex-encoded hash string
 */
export function hashString(data: string): string {
  return SHA256(data).toString(Hex);
}

/**
 * Generate SHA-256 hash from an object (JSON serialized)
 * 
 * @param obj - Object to hash
 * @returns Hex-encoded hash string
 */
export function hashObject(obj: object): string {
  const jsonString = JSON.stringify(obj, Object.keys(obj).sort());
  return hashString(jsonString);
}

/**
 * Verify that a hash matches content
 * 
 * @param content - Content to verify
 * @param expectedHash - Expected hash value
 * @returns Boolean indicating match
 */
export function verifyHash(content: string, expectedHash: string): boolean {
  const actualHash = hashString(content);
  return actualHash.toLowerCase() === expectedHash.toLowerCase();
}

/**
 * Generate a combined hash for certificate metadata
 * 
 * @param metadata - Certificate metadata
 * @returns Combined hash
 */
export function hashCertificateMetadata(metadata: {
  issuedTo: string;
  issuedBy: string;
  certificateType: string;
  issuedAt: Date;
  expiresAt?: Date;
  attributes?: Record<string, unknown>;
}): string {
  const normalizedMetadata = {
    ...metadata,
    issuedAt: metadata.issuedAt.toISOString(),
    expiresAt: metadata.expiresAt?.toISOString(),
  };
  return hashObject(normalizedMetadata);
}
