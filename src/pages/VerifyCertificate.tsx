/**
 * Verify Certificate Page
 * 
 * Verifier workflow:
 * 1. Input certificate hash
 * 2. Input zk-SNARK proof (JSON)
 * 3. Submit for verification
 * 4. Display verification result with visual chain
 */

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/lib/auth/AuthContext';
import { verifyCertificate, getCertificateByHash } from '@/lib/simulation/blockchain';
import { verifyProof, getDisclosureDescription, ZKProof } from '@/lib/simulation/zksnark';
import { hashString } from '@/lib/simulation/hash';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  Hash,
  Database,
  ArrowRight,
  Loader2,
  FileText,
  Clock,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerificationResult {
  valid: boolean;
  status: 'valid' | 'invalid' | 'revoked' | 'not_found';
  message: string;
  certificate?: {
    id: string;
    type: string;
    issuedBy: string;
    issuedTo: string;
    issuedAt: string;
    blockNumber: number;
    transactionHash: string;
  };
  disclosedAttributes?: string[];
}

export default function VerifyCertificate() {
  const { user } = useAuth();
  const [certificateHash, setCertificateHash] = useState('');
  const [proofJson, setProofJson] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  
  const handleVerify = async () => {
    if (!certificateHash.trim()) {
      toast.error('Please enter a certificate hash');
      return;
    }
    
    setIsVerifying(true);
    setResult(null);
    
    // Simulate network delay
    await new Promise(r => setTimeout(r, 1500));
    
    try {
      // Parse proof if provided
      let proof: ZKProof | null = null;
      let proofHash = '';
      
      if (proofJson.trim()) {
        try {
          proof = JSON.parse(proofJson);
          proofHash = hashString(proofJson);
        } catch {
          toast.error('Invalid proof JSON format');
          setIsVerifying(false);
          return;
        }
      }
      
      // Verify against blockchain
      const blockchainResult = verifyCertificate(
        certificateHash.trim(),
        proofHash,
        user?.id || 'anonymous'
      );
      
      // Get certificate details
      const cert = getCertificateByHash(certificateHash.trim());
      
      // Verify zk-SNARK proof if provided
      let disclosedAttributes: string[] = [];
      if (proof && cert) {
        const zkResult = verifyProof(certificateHash.trim(), proof);
        if (zkResult.valid) {
          disclosedAttributes = getDisclosureDescription(proof.publicSignals.disclosedAttributes);
        }
      }
      
      const verificationResult: VerificationResult = {
        valid: blockchainResult.valid,
        status: blockchainResult.valid ? 'valid' : 
                cert?.status === 'revoked' ? 'revoked' :
                cert ? 'invalid' : 'not_found',
        message: blockchainResult.message,
        certificate: cert ? {
          id: cert.id,
          type: cert.certificateType,
          issuedBy: cert.issuer,
          issuedTo: cert.issuedTo,
          issuedAt: cert.timestamp,
          blockNumber: cert.blockNumber,
          transactionHash: cert.transactionHash,
        } : undefined,
        disclosedAttributes,
      };
      
      setResult(verificationResult);
      
      if (verificationResult.valid) {
        toast.success('Certificate verified successfully!');
      } else {
        toast.error(verificationResult.message);
      }
      
    } catch (error) {
      toast.error('Verification failed');
      console.error(error);
    } finally {
      setIsVerifying(false);
    }
  };
  
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'valid':
        return {
          icon: CheckCircle,
          color: 'text-success',
          bg: 'bg-success/10',
          border: 'border-success/30',
          label: 'Valid Certificate',
        };
      case 'revoked':
        return {
          icon: XCircle,
          color: 'text-destructive',
          bg: 'bg-destructive/10',
          border: 'border-destructive/30',
          label: 'Revoked Certificate',
        };
      case 'invalid':
        return {
          icon: AlertTriangle,
          color: 'text-warning',
          bg: 'bg-warning/10',
          border: 'border-warning/30',
          label: 'Invalid Certificate',
        };
      default:
        return {
          icon: XCircle,
          color: 'text-destructive',
          bg: 'bg-destructive/10',
          border: 'border-destructive/30',
          label: 'Certificate Not Found',
        };
    }
  };
  
  const resetForm = () => {
    setCertificateHash('');
    setProofJson('');
    setResult(null);
  };
  
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Verify Certificate</h1>
          <p className="text-muted-foreground mt-1">
            Enter certificate hash and proof to verify authenticity
          </p>
        </div>
        
        {/* Verification Form */}
        <div className="p-8 rounded-xl bg-card border border-border space-y-6">
          <div className="space-y-4">
            {/* Certificate Hash Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Hash className="w-4 h-4 text-warning" />
                Certificate SHA-256 Hash
              </label>
              <Input
                placeholder="Enter the certificate hash (64 character hex string)"
                value={certificateHash}
                onChange={(e) => setCertificateHash(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            
            {/* Proof Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Shield className="w-4 h-4 text-success" />
                zk-SNARK Proof (JSON)
              </label>
              <textarea
                placeholder='Paste the zk-SNARK proof JSON here...'
                value={proofJson}
                onChange={(e) => setProofJson(e.target.value)}
                className="w-full h-32 px-3 py-2 rounded-lg border border-border bg-input text-sm font-mono text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <p className="text-xs text-muted-foreground">
                Optional: Paste the full proof JSON to verify selective disclosures
              </p>
            </div>
          </div>
          
          <Button
            variant="glow"
            size="lg"
            className="w-full"
            onClick={handleVerify}
            disabled={isVerifying || !certificateHash.trim()}
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Verify Certificate
              </>
            )}
          </Button>
        </div>
        
        {/* Verification Chain Visualization */}
        {(isVerifying || result) && (
          <div className="p-8 rounded-xl bg-card border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-6">
              Verification Chain
            </h3>
            
            <div className="flex items-center justify-between mb-8">
              {[
                { label: 'Input', icon: FileText, active: true },
                { label: 'Hash Check', icon: Hash, active: !isVerifying },
                { label: 'Blockchain', icon: Database, active: !isVerifying && result !== null },
                { label: 'ZK Verify', icon: Shield, active: !isVerifying && result !== null },
                { label: 'Result', icon: result?.valid ? CheckCircle : XCircle, active: !isVerifying && result !== null },
              ].map((step, i, arr) => (
                <React.Fragment key={step.label}>
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                      step.active
                        ? i === arr.length - 1 && result
                          ? result.valid
                            ? "bg-success/20 text-success"
                            : "bg-destructive/20 text-destructive"
                          : "bg-primary/20 text-primary"
                        : "bg-secondary text-muted-foreground"
                    )}>
                      {isVerifying && i > 0 && !step.active ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <step.icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className="text-xs mt-2 text-muted-foreground">{step.label}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <ArrowRight className={cn(
                      "w-5 h-5",
                      step.active && arr[i + 1].active ? "text-primary" : "text-muted"
                    )} />
                  )}
                </React.Fragment>
              ))}
            </div>
            
            {/* Result Display */}
            {result && (
              <div className="space-y-6">
                {/* Status Banner */}
                <div className={cn(
                  "p-6 rounded-xl border",
                  getStatusConfig(result.status).bg,
                  getStatusConfig(result.status).border
                )}>
                  <div className="flex items-center gap-4">
                    {React.createElement(getStatusConfig(result.status).icon, {
                      className: cn("w-12 h-12", getStatusConfig(result.status).color)
                    })}
                    <div>
                      <h4 className={cn("text-xl font-semibold", getStatusConfig(result.status).color)}>
                        {getStatusConfig(result.status).label}
                      </h4>
                      <p className="text-sm text-muted-foreground">{result.message}</p>
                    </div>
                  </div>
                </div>
                
                {/* Certificate Details */}
                {result.certificate && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-secondary/50 space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="w-4 h-4" />
                        <span className="text-xs">Certificate Type</span>
                      </div>
                      <p className="font-medium text-foreground">{result.certificate.type}</p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-secondary/50 space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span className="text-xs">Issued To</span>
                      </div>
                      <p className="font-medium text-foreground">{result.certificate.issuedTo}</p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-secondary/50 space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs">Issued At</span>
                      </div>
                      <p className="font-medium text-foreground">
                        {new Date(result.certificate.issuedAt).toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-secondary/50 space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Database className="w-4 h-4" />
                        <span className="text-xs">Block Number</span>
                      </div>
                      <p className="font-medium text-foreground font-mono">
                        #{result.certificate.blockNumber}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Disclosed Attributes */}
                {result.disclosedAttributes && result.disclosedAttributes.length > 0 && (
                  <div className="p-4 rounded-lg bg-success/5 border border-success/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-4 h-4 text-success" />
                      <span className="text-sm font-medium text-foreground">
                        Verified Attributes (Zero-Knowledge Proof)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {result.disclosedAttributes.map((attr, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded-full bg-success/10 text-success text-xs font-medium"
                        >
                          ✓ {attr}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Actions */}
                <Button variant="outline" onClick={resetForm}>
                  Verify Another Certificate
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
