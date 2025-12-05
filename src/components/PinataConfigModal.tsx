/**
 * Pinata Configuration Modal
 * 
 * Allows users to enter their Pinata API credentials
 * for real IPFS integration.
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Cloud, CheckCircle, Loader2, ExternalLink } from 'lucide-react';
import {
  configurePinata,
  testPinataConnection,
  isPinataConfigured,
  loadPinataConfig,
  clearPinataConfig,
} from '@/lib/services/pinataService';

interface PinataConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigured?: () => void;
}

export function PinataConfigModal({ open, onOpenChange, onConfigured }: PinataConfigModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    if (open) {
      const configured = isPinataConfigured();
      setIsConfigured(configured);
      if (configured) {
        const config = loadPinataConfig();
        if (config) {
          setApiKey(config.apiKey);
          setSecretKey('••••••••••••••••');
        }
      }
    }
  }, [open]);

  const handleTest = async () => {
    if (!apiKey || !secretKey || secretKey === '••••••••••••••••') {
      toast.error('Please enter both API key and secret key');
      return;
    }

    setIsTesting(true);
    configurePinata(apiKey, secretKey);
    
    const result = await testPinataConnection();
    setIsTesting(false);

    if (result.success) {
      toast.success('Pinata connected successfully!');
      setIsConfigured(true);
      onConfigured?.();
      onOpenChange(false);
    } else {
      clearPinataConfig();
      toast.error(`Connection failed: ${result.error}`);
    }
  };

  const handleClear = () => {
    clearPinataConfig();
    setApiKey('');
    setSecretKey('');
    setIsConfigured(false);
    toast.success('Pinata configuration cleared');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-primary" />
            Pinata IPFS Configuration
          </DialogTitle>
          <DialogDescription>
            Connect to Pinata for real IPFS storage. Get your API keys from{' '}
            <a
              href="https://app.pinata.cloud/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              pinata.cloud <ExternalLink className="w-3 h-3" />
            </a>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isConfigured && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 text-success">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Pinata is configured and connected</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">API Key</label>
            <Input
              placeholder="Enter your Pinata API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Secret Key</label>
            <Input
              type="password"
              placeholder="Enter your Pinata secret key"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2">
          {isConfigured && (
            <Button variant="outline" onClick={handleClear}>
              Clear Config
            </Button>
          )}
          <Button onClick={handleTest} disabled={isTesting} className="flex-1">
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              'Test & Save'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
