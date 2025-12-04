/**
 * SIMULATED IPFS MODULE
 * 
 * This module simulates IPFS (InterPlanetary File System) functionality
 * for the ZK-Vault research paper demonstration.
 * 
 * In a real implementation, this would:
 * - Connect to an IPFS node
 * - Store files in a distributed network
 * - Return content-addressed identifiers (CIDs)
 * 
 * Our simulation:
 * - Stores file metadata in localStorage for persistence
 * - Generates fake but realistic CID strings
 * - File content is stored as base64 in localStorage
 */

const STORAGE_KEY = 'zkvault_ipfs_storage';

export interface IPFSMetadata {
  filename: string;
  size: number;
  type: string;
  uploadedAt: string;
  uploadedBy: string;
  dataUrl?: string; // Store file content as base64
}

export interface IPFSResponse {
  cid: string;
  metadata: IPFSMetadata;
}

interface StoredIPFS {
  [cid: string]: IPFSMetadata;
}

/**
 * Load IPFS storage from localStorage
 */
function loadStorage(): StoredIPFS {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Save IPFS storage to localStorage
 */
function saveStorage(storage: StoredIPFS): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
}

/**
 * Generates a fake but realistic-looking IPFS CID
 * Real CIDs are content-addressed hashes, typically starting with "Qm" (CIDv0) or "bafy" (CIDv1)
 * 
 * @param content - Content to generate CID from (used for determinism)
 * @returns Fake CID string
 */
function generateFakeCID(content: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz234567';
  let hash = '';
  
  let seed = 0;
  for (let i = 0; i < content.length; i++) {
    seed = ((seed << 5) - seed + content.charCodeAt(i)) | 0;
  }
  
  const prefix = 'bafybeig';
  for (let i = 0; i < 44; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    hash += chars[seed % chars.length];
  }
  
  return prefix + hash;
}

/**
 * SIMULATED: Store a file in IPFS
 * 
 * @param file - File to store
 * @param uploadedBy - User ID who uploaded
 * @returns Promise with CID and metadata
 */
export async function storeFile(file: File, uploadedBy: string): Promise<IPFSResponse> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const content = reader.result as string;
      const cid = generateFakeCID(content + file.name + Date.now());
      
      const metadata: IPFSMetadata = {
        filename: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        uploadedBy,
        dataUrl: content, // Store the file content
      };
      
      // Save to localStorage
      const storage = loadStorage();
      storage[cid] = metadata;
      saveStorage(storage);
      
      // Simulate network delay
      setTimeout(() => {
        resolve({ cid, metadata });
      }, 500);
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * SIMULATED: Retrieve file metadata from IPFS
 * 
 * @param cid - Content identifier
 * @returns Metadata if found
 */
export function getFile(cid: string): IPFSMetadata | null {
  const storage = loadStorage();
  return storage[cid] || null;
}

/**
 * SIMULATED: Check if a CID exists
 * 
 * @param cid - Content identifier
 * @returns Boolean indicating existence
 */
export function cidExists(cid: string): boolean {
  const storage = loadStorage();
  return cid in storage;
}

/**
 * Get all stored files (for admin view)
 */
export function getAllFiles(): Array<{ cid: string; metadata: IPFSMetadata }> {
  const storage = loadStorage();
  return Object.entries(storage).map(([cid, metadata]) => ({ cid, metadata }));
}

/**
 * Clear IPFS storage (for testing)
 */
export function clearIPFS(): void {
  localStorage.removeItem(STORAGE_KEY);
}
