/**
 * Wallet Settings Service
 * 
 * Manages pre-configured wallet settings stored in localStorage
 */

export interface WalletSettings {
  walletAddress: string;
  isConfigured: boolean;
}

const WALLET_SETTINGS_KEY = 'wallet_settings';

export function getWalletSettings(): WalletSettings {
  try {
    const stored = localStorage.getItem(WALLET_SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load wallet settings:', error);
  }
  return { walletAddress: '', isConfigured: false };
}

export function saveWalletSettings(walletAddress: string): void {
  const settings: WalletSettings = {
    walletAddress: walletAddress.trim(),
    isConfigured: walletAddress.trim().length > 0,
  };
  localStorage.setItem(WALLET_SETTINGS_KEY, JSON.stringify(settings));
}

export function clearWalletSettings(): void {
  localStorage.removeItem(WALLET_SETTINGS_KEY);
}

export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
