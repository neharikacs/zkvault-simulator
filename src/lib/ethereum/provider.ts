/**
 * Ethereum Provider Integration
 * 
 * Handles wallet connections, transaction signing, and contract interactions
 * for Base Sepolia testnet with MetaMask support.
 * Base is Coinbase's L2 - fast (~2s blocks), low cost, EVM compatible.
 */

import { BASE_SEPOLIA_CONFIG, CERTIFICATE_REGISTRY_ABI, DEPLOYED_CONTRACT_ADDRESS } from './contracts';

export interface WalletState {
  connected: boolean;
  address: string | null;
  chainId: number | null;
  balance: string | null;
}

export interface TransactionResult {
  success: boolean;
  hash?: string;
  blockNumber?: number;
  error?: string;
  explorerUrl?: string;
}

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

// Check if MetaMask is installed
export function isMetaMaskInstalled(): boolean {
  return typeof window !== 'undefined' && Boolean(window.ethereum?.isMetaMask);
}

// Connect wallet
export async function connectWallet(): Promise<WalletState> {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
  }

  try {
    const accounts = await window.ethereum!.request({
      method: 'eth_requestAccounts',
    }) as string[];

    if (accounts.length === 0) {
      throw new Error('No accounts found. Please connect your wallet.');
    }

    const chainId = await window.ethereum!.request({
      method: 'eth_chainId',
    }) as string;

    const balance = await window.ethereum!.request({
      method: 'eth_getBalance',
      params: [accounts[0], 'latest'],
    }) as string;

    return {
      connected: true,
      address: accounts[0],
      chainId: parseInt(chainId, 16),
      balance: formatEther(balance),
    };
  } catch (error) {
    console.error('Wallet connection error:', error);
    throw error;
  }
}

// Disconnect wallet (clear local state)
export function disconnectWallet(): WalletState {
  return {
    connected: false,
    address: null,
    chainId: null,
    balance: null,
  };
}

// Switch to Base Sepolia network
export async function switchToBaseSepolia(): Promise<void> {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }

  try {
    await window.ethereum!.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${BASE_SEPOLIA_CONFIG.chainId.toString(16)}` }],
    });
  } catch (switchError: unknown) {
    // If the chain doesn't exist, add it
    if ((switchError as { code: number }).code === 4902) {
      await window.ethereum!.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${BASE_SEPOLIA_CONFIG.chainId.toString(16)}`,
          chainName: BASE_SEPOLIA_CONFIG.chainName,
          rpcUrls: [BASE_SEPOLIA_CONFIG.rpcUrl],
          blockExplorerUrls: [BASE_SEPOLIA_CONFIG.blockExplorer],
          nativeCurrency: BASE_SEPOLIA_CONFIG.currency,
        }],
      });
    } else {
      throw switchError;
    }
  }
}

// Legacy export for backward compatibility
export const switchToSepolia = switchToBaseSepolia;

// Format wei to ether
function formatEther(wei: string): string {
  const value = BigInt(wei);
  const divisor = BigInt(10 ** 18);
  const whole = value / divisor;
  const remainder = value % divisor;
  const decimal = remainder.toString().padStart(18, '0').slice(0, 4);
  return `${whole}.${decimal}`;
}

// Convert string to bytes32
export function stringToBytes32(str: string): string {
  const hex = Buffer.from(str).toString('hex').padEnd(64, '0');
  return '0x' + hex.slice(0, 64);
}

// Encode function call
function encodeFunctionCall(
  functionName: string,
  params: (string | boolean | number)[]
): string {
  // Simple ABI encoding for our contract functions
  const functionSignatures: Record<string, string> = {
    'issueCertificate': '0x5d3b1d30',
    'verifyCertificate': '0x3d18b912',
    'revokeCertificate': '0x48cd4cb1',
    'getCertificateByHash': '0x9c7e8a0c',
    'getCertificateDetails': '0xb1a5f2d6',
  };

  const signature = functionSignatures[functionName] || '0x00000000';
  
  // Encode parameters (simplified)
  let encodedParams = '';
  for (const param of params) {
    if (typeof param === 'string' && param.startsWith('0x')) {
      encodedParams += param.slice(2).padStart(64, '0');
    } else if (typeof param === 'string') {
      encodedParams += stringToBytes32(param).slice(2);
    } else if (typeof param === 'boolean') {
      encodedParams += param ? '1'.padStart(64, '0') : '0'.padStart(64, '0');
    } else {
      encodedParams += param.toString(16).padStart(64, '0');
    }
  }

  return signature + encodedParams;
}

// Send transaction to smart contract
export async function sendTransaction(
  to: string,
  data: string,
  from: string
): Promise<TransactionResult> {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }

  try {
    // Estimate gas
    const gasEstimate = await window.ethereum!.request({
      method: 'eth_estimateGas',
      params: [{
        from,
        to,
        data,
      }],
    }) as string;

    // Send transaction
    const txHash = await window.ethereum!.request({
      method: 'eth_sendTransaction',
      params: [{
        from,
        to,
        data,
        gas: gasEstimate,
      }],
    }) as string;

    // Wait for transaction receipt
    const receipt = await waitForTransaction(txHash);

    return {
      success: receipt.status === '0x1',
      hash: txHash,
      blockNumber: parseInt(receipt.blockNumber, 16),
      explorerUrl: `${BASE_SEPOLIA_CONFIG.blockExplorer}/tx/${txHash}`,
    };
  } catch (error) {
    console.error('Transaction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transaction failed',
    };
  }
}

// Wait for transaction confirmation
async function waitForTransaction(
  txHash: string,
  maxAttempts = 60
): Promise<{ status: string; blockNumber: string }> {
  for (let i = 0; i < maxAttempts; i++) {
    const receipt = await window.ethereum!.request({
      method: 'eth_getTransactionReceipt',
      params: [txHash],
    }) as { status: string; blockNumber: string } | null;

    if (receipt) {
      return receipt;
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  throw new Error('Transaction confirmation timeout');
}

// Call view function (no gas cost)
export async function callViewFunction(
  contractAddress: string,
  data: string
): Promise<string> {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }

  const result = await window.ethereum!.request({
    method: 'eth_call',
    params: [{
      to: contractAddress,
      data,
    }, 'latest'],
  }) as string;

  return result;
}

// Issue certificate on Ethereum
export async function issueCertificateOnEthereum(params: {
  documentHash: string;
  holder: string;
  documentType: string;
  ipfsCid: string;
  proofHash: string;
  zkProofData: string;
  from: string;
}): Promise<TransactionResult> {
  const data = encodeFunctionCall('issueCertificate', [
    params.documentHash,
    params.holder,
    params.documentType,
    params.ipfsCid,
    params.proofHash,
    params.zkProofData,
  ]);

  return sendTransaction(DEPLOYED_CONTRACT_ADDRESS, data, params.from);
}

// Verify certificate on Ethereum (view function - no gas)
export async function verifyCertificateOnEthereum(
  certificateId: string
): Promise<{
  isValid: boolean;
  issuer: string;
  holder: string;
  documentType: string;
  ipfsCid: string;
  status: number;
}> {
  const data = encodeFunctionCall('verifyCertificate', [certificateId]);
  const result = await callViewFunction(DEPLOYED_CONTRACT_ADDRESS, data);

  // Decode result (simplified)
  return {
    isValid: result.slice(0, 66) !== '0x' + '0'.repeat(64),
    issuer: '0x' + result.slice(26, 66),
    holder: '0x' + result.slice(90, 130),
    documentType: 'Decoded from chain',
    ipfsCid: 'Decoded from chain',
    status: parseInt(result.slice(194, 258), 16),
  };
}

// Subscribe to wallet events
export function subscribeToWalletEvents(
  onAccountsChanged: (accounts: string[]) => void,
  onChainChanged: (chainId: string) => void
): () => void {
  if (!isMetaMaskInstalled()) {
    return () => {};
  }

  window.ethereum!.on('accountsChanged', onAccountsChanged);
  window.ethereum!.on('chainChanged', onChainChanged);

  return () => {
    window.ethereum!.removeListener('accountsChanged', onAccountsChanged);
    window.ethereum!.removeListener('chainChanged', onChainChanged);
  };
}
