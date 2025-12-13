/**
 * IPFS Service - Edge Function Based
 * 
 * Secure server-side Pinata integration via edge functions.
 * API keys are stored securely in Lovable Cloud secrets.
 */

import { supabase } from '@/integrations/supabase/client';

const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs';

interface PinResult {
  success: boolean;
  cid?: string;
  url?: string;
  error?: string;
}

/**
 * Test Pinata connection via edge function
 */
export async function testPinataConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('pinata-ipfs', {
      body: {},
      headers: { 'Content-Type': 'application/json' },
    });

    // Check if the function was invoked with the test action
    const response = await supabase.functions.invoke('pinata-ipfs?action=test', {
      body: {},
    });

    if (error || !response.data?.success) {
      return { success: false, error: error?.message || response.data?.error || 'Connection failed' };
    }

    return { success: true };
  } catch (err) {
    console.error('Pinata connection test error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Connection failed' };
  }
}

/**
 * Pin file to IPFS via edge function
 */
export async function pinFileToIPFS(
  file: File,
  metadata?: { name?: string; keyvalues?: Record<string, string> }
): Promise<PinResult> {
  try {
    // Convert file to base64
    const buffer = await file.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    const { data, error } = await supabase.functions.invoke('pinata-ipfs?action=pinFile', {
      body: {
        fileData: base64,
        fileName: file.name,
        mimeType: file.type,
        metadata,
      },
    });

    if (error) {
      console.error('Pin file error:', error);
      return { success: false, error: error.message };
    }

    if (!data?.success) {
      return { success: false, error: data?.error || 'Upload failed' };
    }

    return {
      success: true,
      cid: data.cid,
      url: data.url,
    };
  } catch (err) {
    console.error('Pin file error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Upload failed' };
  }
}

/**
 * Pin JSON to IPFS via edge function
 */
export async function pinJSONToIPFS(
  content: object,
  metadata?: { name?: string; keyvalues?: Record<string, string> }
): Promise<PinResult> {
  try {
    const { data, error } = await supabase.functions.invoke('pinata-ipfs?action=pinJSON', {
      body: { content, metadata },
    });

    if (error) {
      console.error('Pin JSON error:', error);
      return { success: false, error: error.message };
    }

    if (!data?.success) {
      return { success: false, error: data?.error || 'Upload failed' };
    }

    return {
      success: true,
      cid: data.cid,
      url: data.url,
    };
  } catch (err) {
    console.error('Pin JSON error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Upload failed' };
  }
}

/**
 * Unpin from IPFS via edge function
 */
export async function unpinFromIPFS(cid: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('pinata-ipfs?action=unpin', {
      body: { cid },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: data?.success || false, error: data?.error };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unpin failed' };
  }
}

/**
 * Get IPFS gateway URL
 */
export function getIPFSUrl(cid: string): string {
  return `${PINATA_GATEWAY}/${cid}`;
}

/**
 * Check if IPFS service is available
 */
export async function isIPFSAvailable(): Promise<boolean> {
  const result = await testPinataConnection();
  return result.success;
}
