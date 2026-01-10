/**
 * Wallet Connect Component
 * 
 * Professional MetaMask wallet connection for Ethereum Sepolia testnet.
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Wallet, ExternalLink, LogOut, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import {
  isMetaMaskInstalled,
  connectWallet,
  disconnectWallet,
  switchToSepolia,
  subscribeToWalletEvents,
  type WalletState,
} from '@/lib/ethereum/provider';
import { SEPOLIA_CONFIG, IS_CONTRACT_DEPLOYED, DEPLOYED_CONTRACT_ADDRESS } from '@/lib/ethereum/contracts';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WalletConnectProps {
  onWalletChange?: (wallet: WalletState) => void;
  className?: string;
}

export function WalletConnect({ onWalletChange, className }: WalletConnectProps) {
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: null,
    chainId: null,
    balance: null,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);

  const isCorrectNetwork = wallet.chainId === SEPOLIA_CONFIG.chainId;

  const updateWallet = useCallback((newState: WalletState) => {
    setWallet(newState);
    onWalletChange?.(newState);
  }, [onWalletChange]);

  useEffect(() => {
    // Subscribe to wallet events
    const unsubscribe = subscribeToWalletEvents(
      (accounts) => {
        if (accounts.length === 0) {
          updateWallet(disconnectWallet());
          toast.info('Wallet disconnected');
        } else {
          // Refresh wallet state
          handleConnect(true);
        }
      },
      (chainId) => {
        setWallet(prev => ({
          ...prev,
          chainId: parseInt(chainId as string, 16),
        }));
      }
    );

    return unsubscribe;
  }, [updateWallet]);

  const handleConnect = async (silent = false) => {
    if (!isMetaMaskInstalled()) {
      toast.error('MetaMask is not installed. Please install MetaMask to continue.', {
        action: {
          label: 'Install',
          onClick: () => window.open('https://metamask.io/download/', '_blank'),
        },
      });
      return;
    }

    setIsConnecting(true);
    try {
      const state = await connectWallet();
      updateWallet(state);
      
      if (state.chainId !== SEPOLIA_CONFIG.chainId) {
        toast.warning('Please switch to Sepolia testnet', {
          action: {
            label: 'Switch Network',
            onClick: handleSwitchNetwork,
          },
        });
      } else if (!silent) {
        toast.success('Wallet connected successfully');
      }
    } catch (error) {
      if (!silent) {
        toast.error(error instanceof Error ? error.message : 'Failed to connect wallet');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    updateWallet(disconnectWallet());
    toast.info('Wallet disconnected');
  };

  const handleSwitchNetwork = async () => {
    setIsSwitchingNetwork(true);
    try {
      await switchToSepolia();
      const state = await connectWallet();
      updateWallet(state);
      toast.success('Switched to Sepolia');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to switch network');
    } finally {
      setIsSwitchingNetwork(false);
    }
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!wallet.connected) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {!IS_CONTRACT_DEPLOYED && (
          <span className="text-xs text-warning bg-warning/10 px-2 py-1 rounded">
            Contract not deployed
          </span>
        )}
        <Button
          onClick={() => handleConnect()}
          disabled={isConnecting}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Wallet className="w-4 h-4" />
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2",
            !isCorrectNetwork && "border-warning text-warning",
            className
          )}
        >
          {isCorrectNetwork ? (
            <CheckCircle className="w-4 h-4 text-success" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-warning" />
          )}
          <span className="font-mono">{shortenAddress(wallet.address!)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Connected Wallet
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="px-2 py-2 space-y-2">
          <div className="text-xs text-muted-foreground">Address</div>
          <div className="font-mono text-sm break-all">{wallet.address}</div>
          
          <div className="text-xs text-muted-foreground mt-2">Balance</div>
          <div className="text-sm font-medium">{wallet.balance} ETH</div>
          
          <div className="text-xs text-muted-foreground mt-2">Network</div>
          <div className={cn(
            "text-sm font-medium flex items-center gap-1",
            isCorrectNetwork ? "text-success" : "text-warning"
          )}>
            {isCorrectNetwork ? (
              <>
                <CheckCircle className="w-3 h-3" />
                Sepolia
              </>
            ) : (
              <>
                <AlertTriangle className="w-3 h-3" />
                Wrong Network (ID: {wallet.chainId})
              </>
            )}
          </div>
        </div>

        <DropdownMenuSeparator />
        
        {!isCorrectNetwork && (
          <DropdownMenuItem onClick={handleSwitchNetwork} disabled={isSwitchingNetwork}>
            <RefreshCw className={cn("w-4 h-4 mr-2", isSwitchingNetwork && "animate-spin")} />
            Switch to Sepolia
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem
          onClick={() => window.open(`${SEPOLIA_CONFIG.blockExplorer}/address/${wallet.address}`, '_blank')}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          View on Etherscan
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleDisconnect} className="text-destructive">
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
