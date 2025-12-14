/**
 * Verify Certificate Page
 * 
 * Verifier workflow:
 * 1. Input certificate hash
 * 2. Input zk-SNARK proof (JSON)
 * 3. Submit for verification (on-chain + ZK proof)
 * 4. Display verification result with visual chain
 */

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/lib/auth/AuthContext';
import { verifyCertificateOnChain, getCertificateByHash } from '@/lib/blockchain';
import { verifyCertificateOnEthereum, isMetaMaskInstalled, callViewFunction } from '@/lib/ethereum/provider';
import { SEPOLIA_CONFIG, DEPLOYED_CONTRACT_ADDRESS } from '@/lib/ethereum/contracts';
import { verifyProof, getDisclosureDescriptions, DisclosedAttribute } from '@/lib/zksnark';
import { ZKProof, deserializeProof } from '@/lib/zksnark/prover';
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
  Blocks,
  ExternalLink,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerificationResult {
  valid: boolean;
  status: 'valid' | 'invalid' | 'revoked' | 'not_found' | 'suspended';
  message: string;
  certificate?: {
    id: string;
    type: string;
    category: string;
    issuedBy: string;
    issuedTo: string;
    issuedAt: string;
    blockNumber: number;
    transactionHash: string;
  };
  proofDetails?: {
    valid: boolean;
    commitmentValid: boolean;
    nullifierUnique: boolean;
    disclosuresVerified: boolean;
  };
  disclosedAttributes?: DisclosedAttribute[];
  blockchain?: {
    verified: boolean;
    network: string;
    contractAddress: string;
    explorerUrl: string;
    issuer?: string;
    holder?: string;
    status?: string;
  };
}

export default function VerifyCertificate() {
  const { user } = useAuth();
  const [certificateHash, setCertificateHash] = useState('');
  const [proofJson, setProofJson] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [verificationStep, setVerificationStep] = useState(0);
  
  const handleVerify = async () => {
    if (!certificateHash.trim()) {
      toast.error('Please enter a certificate hash');
      return;
    }
    
    setIsVerifying(true);
    setResult(null);
    setVerificationStep(1);
    
    try {
      // Parse proof if provided
      let proof: ZKProof | null = null;
      
      if (proofJson.trim()) {
        try {
          proof = deserializeProof(proofJson);
        } catch {
          toast.error('Invalid proof JSON format');
          setIsVerifying(false);
          return;
        }
      }
      
      setVerificationStep(2);
      
      // Verify against simulation blockchain first
      const blockchainResult = await verifyCertificateOnChain(
        certificateHash.trim(),
        proofJson.trim(),
        user?.id || 'anonymous'
      );
      
      // Get certificate details from local store
      const cert = getCertificateByHash(certificateHash.trim());
      
      setVerificationStep(3);
      
      // Verify on Ethereum Sepolia if MetaMask is available
      let ethereumVerification = null;
      if (isMetaMaskInstalled()) {
        try {
          const ethResult = await verifyCertificateOnEthereum(certificateHash.trim());
          ethereumVerification = {
            verified: ethResult.isValid,
            network: 'Sepolia Testnet',
            contractAddress: DEPLOYED_CONTRACT_ADDRESS,
            explorerUrl: `${SEPOLIA_CONFIG.blockExplorer}/address/${DEPLOYED_CONTRACT_ADDRESS}`,
            issuer: ethResult.issuer,
            holder: ethResult.holder,
            status: ethResult.status === 0 ? 'Pending' : 
                   ethResult.status === 1 ? 'Active' : 
                   ethResult.status === 2 ? 'Revoked' : 
                   ethResult.status === 3 ? 'Suspended' : 'Unknown',
          };
        } catch (ethError) {
          console.log('Ethereum verification skipped:', ethError);
          // Fallback to simulation-only verification
          ethereumVerification = {
            verified: false,
            network: 'Sepolia Testnet',
            contractAddress: DEPLOYED_CONTRACT_ADDRESS,
            explorerUrl: `${SEPOLIA_CONFIG.blockExplorer}/address/${DEPLOYED_CONTRACT_ADDRESS}`,
            status: 'Not found on chain',
          };
        }
      }
      
      setVerificationStep(4);
      
      // Verify zk-SNARK proof if provided
      let disclosedAttributes: DisclosedAttribute[] = [];
      let proofDetails = undefined;
      
      if (proof && cert) {
        const zkResult = await verifyProof(proof, certificateHash.trim(), false);
        proofDetails = zkResult.details;
        
        if (zkResult.valid && zkResult.disclosedAttributes) {
          disclosedAttributes = zkResult.disclosedAttributes;
        }
      }
      
      setVerificationStep(5);
      
      const isValid = blockchainResult.valid || (ethereumVerification?.verified ?? false);
      
      const verificationResult: VerificationResult = {
        valid: isValid,
        status: isValid ? 'valid' : 
                cert?.status === 'revoked' ? 'revoked' :
                cert?.status === 'suspended' ? 'suspended' :
                cert ? 'invalid' : 'not_found',
        message: isValid 
          ? 'Certificate verified successfully on blockchain!' 
          : blockchainResult.message,
        certificate: cert ? {
          id: cert.id,
          type: cert.documentType,
          category: cert.documentCategory,
          issuedBy: cert.issuer,
          issuedTo: cert.holder,
          issuedAt: cert.createdAt,
          blockNumber: cert.blockNumber,
          transactionHash: cert.transactionHash,
        } : undefined,
        proofDetails,
        disclosedAttributes,
        blockchain: ethereumVerification || undefined,
      };
      
      setResult(verificationResult);
      
      if (verificationResult.valid) {
        toast.success('Certificate verified successfully on blockchain!');
      } else {
        toast.error(verificationResult.message);
      }
      
    } catch (error) {
      toast.error('Verification failed');
      console.error(error);
    } finally {
      setIsVerifying(false);
      setVerificationStep(0);
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
      case 'suspended':
        return {
          icon: AlertTriangle,
          color: 'text-warning',
          bg: 'bg-warning/10',
          border: 'border-warning/30',
          label: 'Suspended Certificate',
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
  
  const steps = [
    { label: 'Input', icon: FileText },
    { label: 'Hash Check', icon: Hash },
    { label: 'Simulation', icon: Database },
    { label: 'Ethereum', icon: Wallet },
    { label: 'ZK Verify', icon: Shield },
    { label: 'Result', icon: result?.valid ? CheckCircle : XCircle },
  ];
  
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Verify Certificate</h1>
          <p className="text-muted-foreground mt-1">
            Enter certificate hash and proof to verify authenticity on Ethereum Sepolia
          </p>
        </div>
        
        {/* MetaMask Status */}
        <div className={cn(
          "p-4 rounded-lg border flex items-center gap-3",
          isMetaMaskInstalled() 
            ? "bg-success/10 border-success/30" 
            : "bg-warning/10 border-warning/30"
        )}>
          <Wallet className={cn(
            "w-5 h-5",
            isMetaMaskInstalled() ? "text-success" : "text-warning"
          )} />
          <div>
            <p className={cn(
              "text-sm font-medium",
              isMetaMaskInstalled() ? "text-success" : "text-warning"
            )}>
              {isMetaMaskInstalled() 
                ? "MetaMask detected - Blockchain verification enabled" 
                : "MetaMask not detected - Using simulation only"}
            </p>
            <p className="text-xs text-muted-foreground">
              Network: Sepolia Testnet • Contract: {DEPLOYED_CONTRACT_ADDRESS.slice(0, 10)}...
            </p>
          </div>
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
                Verifying on Blockchain...
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
            
            <div className="flex items-center justify-between mb-8 overflow-x-auto">
              {steps.map((step, i, arr) => (
                <React.Fragment key={step.label}>
                  <div className="flex flex-col items-center min-w-[60px]">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                      isVerifying && verificationStep === i + 1
                        ? "bg-primary/20 text-primary animate-pulse"
                        : isVerifying && verificationStep > i + 1
                        ? "bg-success/20 text-success"
                        : !isVerifying && result
                        ? i === arr.length - 1
                          ? result.valid
                            ? "bg-success/20 text-success"
                            : "bg-destructive/20 text-destructive"
                          : "bg-success/20 text-success"
                        : "bg-secondary text-muted-foreground"
                    )}>
                      {isVerifying && verificationStep === i + 1 ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <step.icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className="text-xs mt-2 text-muted-foreground text-center">{step.label}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <ArrowRight className={cn(
                      "w-5 h-5 flex-shrink-0",
                      (!isVerifying && result) || (isVerifying && verificationStep > i + 1)
                        ? "text-success" 
                        : "text-muted"
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
                
                {/* Ethereum Blockchain Verification */}
                {result.blockchain && (
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">
                          Ethereum Blockchain Verification
                        </span>
                      </div>
                      <a
                        href={result.blockchain.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        View on Etherscan <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Network</p>
                        <p className="font-medium text-foreground">{result.blockchain.network}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Status</p>
                        <p className={cn(
                          "font-medium",
                          result.blockchain.verified ? "text-success" : "text-warning"
                        )}>
                          {result.blockchain.verified ? 'Verified' : result.blockchain.status}
                        </p>
                      </div>
                      {result.blockchain.issuer && (
                        <div>
                          <p className="text-xs text-muted-foreground">Issuer</p>
                          <p className="font-mono text-xs text-foreground truncate">
                            {result.blockchain.issuer.slice(0, 10)}...
                          </p>
                        </div>
                      )}
                      {result.blockchain.holder && (
                        <div>
                          <p className="text-xs text-muted-foreground">Holder</p>
                          <p className="font-mono text-xs text-foreground truncate">
                            {result.blockchain.holder.slice(0, 10)}...
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
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
                        <Blocks className="w-4 h-4" />
                        <span className="text-xs">Category</span>
                      </div>
                      <p className="font-medium text-foreground capitalize">{result.certificate.category}</p>
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

                {/* ZK Proof Verification Details */}
                {result.proofDetails && (
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        ZK-SNARK Proof Verification (Groth16)
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        { label: 'Proof Valid', valid: result.proofDetails.commitmentValid },
                        { label: 'Commitment Valid', valid: result.proofDetails.commitmentValid },
                        { label: 'Nullifier Unique', valid: result.proofDetails.nullifierUnique },
                        { label: 'Disclosures Verified', valid: result.proofDetails.disclosuresVerified },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          {item.valid ? (
                            <CheckCircle className="w-3 h-3 text-success" />
                          ) : (
                            <XCircle className="w-3 h-3 text-destructive" />
                          )}
                          <span className="text-muted-foreground">{item.label}</span>
                        </div>
                      ))}
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
                          ✓ {attr.label}: {typeof attr.value === 'boolean' ? 'Verified' : attr.value}
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
