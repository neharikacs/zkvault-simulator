/**
 * Pinata IPFS Edge Function
 * 
 * Secure server-side Pinata API integration.
 * Handles file uploads, JSON pinning, and connection testing.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PINATA_API_URL = 'https://api.pinata.cloud';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get('PINATA_API_KEY');
  const secretKey = Deno.env.get('PINATA_SECRET_KEY');

  if (!apiKey || !secretKey) {
    console.error('Pinata API keys not configured');
    return new Response(
      JSON.stringify({ success: false, error: 'Pinata API keys not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    console.log(`Pinata IPFS action: ${action}`);

    // Test connection
    if (action === 'test') {
      const response = await fetch(`${PINATA_API_URL}/data/testAuthentication`, {
        method: 'GET',
        headers: {
          'pinata_api_key': apiKey,
          'pinata_secret_api_key': secretKey,
        },
      });

      if (!response.ok) {
        throw new Error('Invalid API credentials');
      }

      console.log('Pinata connection test successful');
      return new Response(
        JSON.stringify({ success: true, message: 'Connected to Pinata' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Pin JSON to IPFS
    if (action === 'pinJSON') {
      const body = await req.json();
      const { content, metadata } = body;

      const pinataBody = {
        pinataContent: content,
        pinataMetadata: metadata ? {
          name: metadata.name || 'json-data',
          keyvalues: metadata.keyvalues || {},
        } : undefined,
      };

      const response = await fetch(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': apiKey,
          'pinata_secret_api_key': secretKey,
        },
        body: JSON.stringify(pinataBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log(`Pinned JSON to IPFS: ${data.IpfsHash}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          cid: data.IpfsHash,
          url: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Pin file to IPFS (base64 encoded)
    if (action === 'pinFile') {
      const body = await req.json();
      const { fileData, fileName, mimeType, metadata } = body;

      // Decode base64
      const binaryString = atob(fileData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: mimeType });
      const formData = new FormData();
      formData.append('file', blob, fileName);

      if (metadata) {
        formData.append('pinataMetadata', JSON.stringify({
          name: metadata.name || fileName,
          keyvalues: metadata.keyvalues || {},
        }));
      }

      const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers: {
          'pinata_api_key': apiKey,
          'pinata_secret_api_key': secretKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log(`Pinned file to IPFS: ${data.IpfsHash}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          cid: data.IpfsHash,
          url: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Unpin from IPFS
    if (action === 'unpin') {
      const body = await req.json();
      const { cid } = body;

      const response = await fetch(`${PINATA_API_URL}/pinning/unpin/${cid}`, {
        method: 'DELETE',
        headers: {
          'pinata_api_key': apiKey,
          'pinata_secret_api_key': secretKey,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      console.log(`Unpinned from IPFS: ${cid}`);
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Pinata IPFS error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
