/**
 * Revoke Certificate Page (Admin Only)
 * 
 * Admin workflow to:
 * - Search for certificates
 * - Revoke or suspend certificates
 * - View revocation history
 */

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/lib/auth/AuthContext';
import { 
  getAllCertificates, 
  revokeCertificate, 
  suspendCertificate,
  reinstateCertificate,
  CertificateRecord 
} from '@/lib/simulation/blockchain';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  FileX,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Hash,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RevokeCertificate() {
  const { user } = useAuth();
  const [searchHash, setSearchHash] = useState('');
  const [foundCert, setFoundCert] = useState<CertificateRecord | null>(null);
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [, forceUpdate] = useState({});
  
  const handleSearch = () => {
    const certificates = getAllCertificates();
    const cert = certificates.find(c => 
      c.hash.toLowerCase() === searchHash.trim().toLowerCase()
    );
    
    if (cert) {
      setFoundCert(cert);
    } else {
      toast.error('Certificate not found');
      setFoundCert(null);
    }
  };
  
  const handleRevoke = async () => {
    if (!foundCert || !user || !reason.trim()) {
      toast.error('Please provide a reason for revocation');
      return;
    }
    
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 1000));
    
    const result = revokeCertificate(foundCert.hash, user.id, reason);
    
    if (result.success) {
      toast.success('Certificate revoked successfully');
      // Refresh the certificate data
      const certificates = getAllCertificates();
      const updatedCert = certificates.find(c => c.hash === foundCert.hash);
      setFoundCert(updatedCert || null);
      setReason('');
    } else {
      toast.error(result.message);
    }
    
    setIsProcessing(false);
  };
  
  const handleSuspend = async () => {
    if (!foundCert || !user || !reason.trim()) {
      toast.error('Please provide a reason for suspension');
      return;
    }
    
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 1000));
    
    const result = suspendCertificate(foundCert.hash, user.id, reason);
    
    if (result.success) {
      toast.success('Certificate suspended successfully');
      const certificates = getAllCertificates();
      const updatedCert = certificates.find(c => c.hash === foundCert.hash);
      setFoundCert(updatedCert || null);
      setReason('');
    } else {
      toast.error(result.message);
    }
    
    setIsProcessing(false);
  };
  
  const handleReinstate = async () => {
    if (!foundCert || !user) return;
    
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 1000));
    
    const result = reinstateCertificate(foundCert.hash, user.id, 'Reinstated by admin');
    
    if (result.success) {
      toast.success('Certificate reinstated successfully');
      const certificates = getAllCertificates();
      const updatedCert = certificates.find(c => c.hash === foundCert.hash);
      setFoundCert(updatedCert || null);
    } else {
      toast.error(result.message);
    }
    
    setIsProcessing(false);
  };
  
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', label: 'Active' };
      case 'revoked':
        return { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Revoked' };
      case 'suspended':
        return { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', label: 'Suspended' };
      default:
        return { icon: AlertTriangle, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Unknown' };
    }
  };
  
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Revoke Certificate</h1>
          <p className="text-muted-foreground mt-1">
            Search for a certificate and manage its status
          </p>
        </div>
        
        {/* Search */}
        <div className="p-6 rounded-xl bg-card border border-border space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Search className="w-4 h-4" />
            Search Certificate
          </h2>
          
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Enter certificate SHA-256 hash"
                value={searchHash}
                onChange={(e) => setSearchHash(e.target.value)}
                className="pl-10 font-mono text-sm"
              />
            </div>
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4" />
              Search
            </Button>
          </div>
        </div>
        
        {/* Certificate Details */}
        {foundCert && (
          <div className="p-6 rounded-xl bg-card border border-border space-y-6">
            {/* Status Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-3 rounded-lg",
                  getStatusConfig(foundCert.status).bg
                )}>
                  {React.createElement(getStatusConfig(foundCert.status).icon, {
                    className: cn("w-8 h-8", getStatusConfig(foundCert.status).color)
                  })}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {foundCert.certificateType}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Issued to: {foundCert.issuedTo}
                  </p>
                </div>
              </div>
              <span className={cn(
                "px-3 py-1 rounded-full text-sm font-medium",
                getStatusConfig(foundCert.status).bg,
                getStatusConfig(foundCert.status).color
              )}>
                {getStatusConfig(foundCert.status).label}
              </span>
            </div>
            
            {/* Certificate Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Hash</label>
                <code className="block text-xs font-mono bg-secondary p-2 rounded overflow-x-auto">
                  {foundCert.hash}
                </code>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">IPFS CID</label>
                <code className="block text-xs font-mono bg-secondary p-2 rounded overflow-x-auto">
                  {foundCert.cid}
                </code>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Issued At</label>
                <p className="text-sm text-foreground">
                  {new Date(foundCert.timestamp).toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Block Number</label>
                <p className="text-sm font-mono text-foreground">#{foundCert.blockNumber}</p>
              </div>
            </div>
            
            {/* Actions */}
            {foundCert.status === 'active' && (
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Reason for Action
                  </label>
                  <Input
                    placeholder="Enter reason for revocation or suspension..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="destructive"
                    onClick={handleRevoke}
                    disabled={isProcessing || !reason.trim()}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileX className="w-4 h-4" />
                    )}
                    Revoke Certificate
                  </Button>
                  <Button
                    variant="warning"
                    onClick={handleSuspend}
                    disabled={isProcessing || !reason.trim()}
                    className="bg-warning text-warning-foreground hover:bg-warning/90"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                    Suspend Certificate
                  </Button>
                </div>
              </div>
            )}
            
            {foundCert.status === 'suspended' && (
              <div className="pt-4 border-t border-border">
                <Button
                  variant="success"
                  onClick={handleReinstate}
                  disabled={isProcessing}
                  className="bg-success text-success-foreground hover:bg-success/90"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Reinstate Certificate
                </Button>
              </div>
            )}
            
            {foundCert.status === 'revoked' && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                <p className="text-sm text-destructive">
                  This certificate has been permanently revoked and cannot be reinstated.
                </p>
              </div>
            )}
            
            {/* Status History */}
            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-medium text-foreground mb-3">Status History</h4>
              <div className="space-y-2">
                {foundCert.statusHistory.map((change, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 text-xs p-3 rounded-lg bg-secondary/50"
                  >
                    <span className="text-muted-foreground">
                      {new Date(change.timestamp).toLocaleString()}
                    </span>
                    <span className="font-medium text-foreground capitalize">
                      {change.from} → {change.to}
                    </span>
                    <span className="text-muted-foreground flex-1">
                      {change.reason}
                    </span>
                    <code className="text-xs text-muted-foreground">
                      {change.transactionHash.substring(0, 16)}...
                    </code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
