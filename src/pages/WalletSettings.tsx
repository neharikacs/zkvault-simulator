/**
 * Wallet Settings Page
 * 
 * Pre-configure wallet address for certificate issuance
 */

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Wallet, Save, Trash2, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { 
  getWalletSettings, 
  saveWalletSettings, 
  clearWalletSettings,
  isValidEthereumAddress 
} from '@/lib/services/walletSettingsService';
import { BASE_SEPOLIA_CONFIG } from '@/lib/ethereum/contracts';

export default function WalletSettings() {
  const [walletAddress, setWalletAddress] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    const settings = getWalletSettings();
    setWalletAddress(settings.walletAddress);
    setIsConfigured(settings.isConfigured);
    if (settings.walletAddress) {
      setIsValid(isValidEthereumAddress(settings.walletAddress));
    }
  }, []);

  const handleAddressChange = (value: string) => {
    setWalletAddress(value);
    if (value.trim()) {
      setIsValid(isValidEthereumAddress(value));
    } else {
      setIsValid(null);
    }
  };

  const handleSave = () => {
    if (!walletAddress.trim()) {
      toast.error('Please enter a wallet address');
      return;
    }

    if (!isValidEthereumAddress(walletAddress)) {
      toast.error('Invalid Ethereum address format');
      return;
    }

    saveWalletSettings(walletAddress);
    setIsConfigured(true);
    toast.success('Wallet settings saved successfully');
  };

  const handleClear = () => {
    clearWalletSettings();
    setWalletAddress('');
    setIsConfigured(false);
    setIsValid(null);
    toast.info('Wallet settings cleared');
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Wallet Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure your MetaMask wallet for certificate issuance on Base Sepolia (Coinbase L2)
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Ethereum Wallet Configuration
            </CardTitle>
            <CardDescription>
              Enter your MetaMask wallet address to use for blockchain transactions.
              This address will be used as the issuer address for certificates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="walletAddress">Wallet Address</Label>
              <Input
                id="walletAddress"
                placeholder="0x..."
                value={walletAddress}
                onChange={(e) => handleAddressChange(e.target.value)}
                className="font-mono"
              />
              {isValid !== null && (
                <div className={`flex items-center gap-2 text-sm ${isValid ? 'text-success' : 'text-destructive'}`}>
                  {isValid ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Valid Ethereum address
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      Invalid address format (must be 0x followed by 40 hex characters)
                    </>
                  )}
                </div>
              )}
            </div>

            <Alert>
              <AlertDescription className="space-y-2">
                <p><strong>Network:</strong> Base Sepolia (Chain ID: {BASE_SEPOLIA_CONFIG.chainId})</p>
                <p><strong>Note:</strong> Make sure your MetaMask wallet is connected to Base Sepolia and has some test ETH for gas fees.</p>
                <a 
                  href="https://www.coinbase.com/faucets/base-ethereum-goerli-faucet" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Get free Base Sepolia ETH from faucet
                  <ExternalLink className="w-3 h-3" />
                </a>
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={!isValid} className="gap-2">
                <Save className="w-4 h-4" />
                Save Settings
              </Button>
              {isConfigured && (
                <Button variant="outline" onClick={handleClear} className="gap-2">
                  <Trash2 className="w-4 h-4" />
                  Clear Settings
                </Button>
              )}
            </div>

            {isConfigured && isValid && (
              <Alert className="border-success bg-success/10">
                <CheckCircle className="w-4 h-4 text-success" />
                <AlertDescription>
                  Wallet configured successfully. Your address will be used for certificate issuance.
                  <a 
                    href={`${BASE_SEPOLIA_CONFIG.blockExplorer}/address/${walletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-2 text-primary hover:underline inline-flex items-center gap-1"
                  >
                    View on BaseScan
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              1. Enter your MetaMask wallet address (public address starting with 0x)
            </p>
            <p>
              2. When issuing certificates, the system will use this address as the issuer
            </p>
            <p>
              3. Certificate data will be stored on IPFS and the hash will be recorded on Base Sepolia blockchain
            </p>
            <p>
              4. MetaMask will still prompt you to approve transactions when issuing certificates
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
