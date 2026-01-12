/**
 * Pinata IPFS Service
 * 
 * Real IPFS integration using Pinata's pinning service.
 * Falls back to localStorage simulation if API keys are not configured.
 */

const PINATA_API_URL = 'https://api.pinata.cloud';
const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs';

interface PinataConfig {
  apiKey: string;
  secretKey: string;
}

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

interface PinataMetadata {
  name: string;
  keyvalues: Record<string, string>;
}

// Store config in memory (loaded from environment or user input)
let pinataConfig: PinataConfig | null = null;

/**
 * Configure Pinata with API credentials
 */
export function configurePinata(apiKey: string, secretKey: string): void {
  pinataConfig = { apiKey, secretKey };
  // Also save to localStorage for persistence
  localStorage.setItem('pinata_config', JSON.stringify({ apiKey, secretKey }));
}

/**
 * Load Pinata config from localStorage
 */
export function loadPinataConfig(): PinataConfig | null {
  if (pinataConfig) return pinataConfig;
  
  const stored = localStorage.getItem('pinata_config');
  if (stored) {
    try {
      pinataConfig = JSON.parse(stored);
      return pinataConfig;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Check if Pinata is configured
 */
export function isPinataConfigured(): boolean {
  return loadPinataConfig() !== null;
}

/**
 * Clear Pinata configuration
 */
export function clearPinataConfig(): void {
  pinataConfig = null;
  localStorage.removeItem('pinata_config');
}

/**
 * Pin a file to IPFS via Pinata
 */
export async function pinFileToIPFS(
  file: File,
  metadata?: { name?: string; keyvalues?: Record<string, string> }
): Promise<{ success: boolean; cid?: string; error?: string }> {
  const config = loadPinataConfig();
  
  if (!config) {
    return { success: false, error: 'Pinata not configured. Please add your API keys.' };
  }

  try {
    const formData = new FormData();
    formData.append('file', file);

    if (metadata) {
      const pinataMetadata: PinataMetadata = {
        name: metadata.name || file.name,
        keyvalues: metadata.keyvalues || {},
      };
      formData.append('pinataMetadata', JSON.stringify(pinataMetadata));
    }

    const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: {
        'pinata_api_key': config.apiKey,
        'pinata_secret_api_key': config.secretKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data: PinataResponse = await response.json();
    
    return {
      success: true,
      cid: data.IpfsHash,
    };
  } catch (error) {
    console.error('Pinata upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload to IPFS',
    };
  }
}

/**
 * Pin JSON data to IPFS via Pinata
 */
export async function pinJSONToIPFS(
  jsonData: object,
  metadata?: { name?: string; keyvalues?: Record<string, string> }
): Promise<{ success: boolean; cid?: string; error?: string }> {
  const config = loadPinataConfig();
  
  if (!config) {
    return { success: false, error: 'Pinata not configured' };
  }

  try {
    const body = {
      pinataContent: jsonData,
      pinataMetadata: metadata ? {
        name: metadata.name || 'json-data',
        keyvalues: metadata.keyvalues || {},
      } : undefined,
    };

    const response = await fetch(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': config.apiKey,
        'pinata_secret_api_key': config.secretKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data: PinataResponse = await response.json();
    
    return {
      success: true,
      cid: data.IpfsHash,
    };
  } catch (error) {
    console.error('Pinata JSON upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload JSON to IPFS',
    };
  }
}

/**
 * Get the gateway URL for a CID
 */
export function getIPFSUrl(cid: string): string {
  return `${PINATA_GATEWAY}/${cid}`;
}

/**
 * Unpin a file from Pinata
 */
export async function unpinFromIPFS(cid: string): Promise<{ success: boolean; error?: string }> {
  const config = loadPinataConfig();
  
  if (!config) {
    return { success: false, error: 'Pinata not configured' };
  }

  try {
    const response = await fetch(`${PINATA_API_URL}/pinning/unpin/${cid}`, {
      method: 'DELETE',
      headers: {
        'pinata_api_key': config.apiKey,
        'pinata_secret_api_key': config.secretKey,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to unpin',
    };
  }
}

/**
 * Test Pinata connection
 */
export async function testPinataConnection(): Promise<{ success: boolean; error?: string }> {
  const config = loadPinataConfig();
  
  if (!config) {
    return { success: false, error: 'Pinata not configured' };
  }

  try {
    const response = await fetch(`${PINATA_API_URL}/data/testAuthentication`, {
      method: 'GET',
      headers: {
        'pinata_api_key': config.apiKey,
        'pinata_secret_api_key': config.secretKey,
      },
    });

    if (!response.ok) {
      throw new Error('Invalid API credentials');
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}
