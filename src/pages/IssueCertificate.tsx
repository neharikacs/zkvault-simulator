/**
 * Issue Certificate Page
 * 
 * Full certificate issuance workflow with multiple document types:
 * 1. Select document type
 * 2. Upload certificate file
 * 3. Enter document-specific metadata
 * 4. Store in IPFS (Pinata via edge function)
 * 5. Generate SHA-256 hash
 * 6. Generate real zk-SNARK proof with selective disclosure
 * 7. Store on Ethereum Sepolia blockchain (zero gas testnet)
 * 8. Display all credentials for holder
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/lib/auth/AuthContext';
import { storeFile } from '@/lib/simulation/ipfs';
import { hashFile } from '@/lib/simulation/hash';
import { generateProof, ZKProof } from '@/lib/zksnark';
import { issueCertificate, OnChainCertificate } from '@/lib/blockchain';
import { pinFileToIPFS, isIPFSAvailable, getIPFSUrl } from '@/lib/services/ipfsService';
import { getWalletSettings, isValidEthereumAddress } from '@/lib/services/walletSettingsService';
import { 
  isMetaMaskInstalled,
  issueCertificateOnEthereum,
  type WalletState,
} from '@/lib/ethereum/provider';
import { SEPOLIA_CONFIG, IS_CONTRACT_DEPLOYED, DEPLOYED_CONTRACT_ADDRESS } from '@/lib/ethereum/contracts';
import { 
  DOCUMENT_TYPES, 
  getDocumentTypeById, 
  CATEGORY_INFO,
  type DocumentType,
  type DocumentCategory 
} from '@/lib/types/documentTypes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Upload,
  FileText,
  Hash,
  Key,
  Database,
  CheckCircle,
  Copy,
  Download,
  Loader2,
  Cloud,
  Shield,
  ArrowLeft,
  Blocks,
  Wallet,
  ExternalLink,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Step = 'select-type' | 'upload' | 'metadata' | 'processing' | 'complete';

interface IssuanceResult {
  cid: string;
  hash: string;
  proof: ZKProof;
  transactionHash: string;
  blockNumber: number;
  certificateId: string;
  ipfsUrl?: string;
  ethereumTxHash?: string;
  ethereumExplorerUrl?: string;
  ethereumBlockNumber?: number;
  network: 'ethereum' | 'simulation' | 'both';
}

export default function IssueCertificate() {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('select-type');
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<Record<string, string | number | boolean>>({});
  const [holderName, setHolderName] = useState('');
  const [holderEmail, setHolderEmail] = useState('');
  const [selectedDisclosures, setSelectedDisclosures] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [result, setResult] = useState<IssuanceResult | null>(null);
  const [ipfsConnected, setIpfsConnected] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | 'all'>('all');
  const [walletSettings, setWalletSettings] = useState<{ walletAddress: string; isConfigured: boolean }>({
    walletAddress: '',
    isConfigured: false,
  });

  useEffect(() => {
    // Check IPFS availability and load wallet settings on mount
    isIPFSAvailable().then(setIpfsConnected);
    setWalletSettings(getWalletSettings());
  }, []);

  const handleDocTypeSelect = (docType: DocumentType) => {
    setSelectedDocType(docType);
    setSelectedDisclosures(docType.disclosureOptions.slice(0, 2).map(d => d.key));
    setFormData({});
    setStep('upload');
  };
  
  const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setStep('metadata');
    }
  }, []);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStep('metadata');
    }
  };
  
  const toggleDisclosure = (key: string) => {
    setSelectedDisclosures(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const updateFormField = (key: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };
  
  const processIssuance = async () => {
    if (!file || !user || !selectedDocType) return;
    
    setIsProcessing(true);
    setStep('processing');
    
    try {
      let cid: string;
      let ipfsUrl: string | undefined;

      // Step 1: Store in IPFS (Pinata or localStorage fallback)
      setProcessingStep('Storing in IPFS...');
      
      if (ipfsConnected) {
        const pinataResult = await pinFileToIPFS(file, {
          name: `${selectedDocType.name}_${holderName}`,
          keyvalues: {
            documentType: selectedDocType.id,
            holderEmail: holderEmail,
            issuedBy: user.name,
          },
        });
        
        if (!pinataResult.success || !pinataResult.cid) {
          throw new Error(pinataResult.error || 'Failed to upload to Pinata');
        }
        
        cid = pinataResult.cid;
        ipfsUrl = getIPFSUrl(cid);
        toast.success('Uploaded to real IPFS via Pinata!');
      } else {
        const ipfsResult = await storeFile(file, user.id);
        cid = ipfsResult.cid;
      }
      
      // Step 2: Generate SHA-256 hash
      setProcessingStep('Generating SHA-256 hash...');
      const fileHash = await hashFile(file);
      
      // Step 3: Generate real zk-SNARK proof
      setProcessingStep('Generating zk-SNARK proof (Groth16)...');
      
      const proof = await generateProof({
        documentHash: fileHash,
        documentType: selectedDocType.id,
        documentCategory: selectedDocType.category,
        documentData: formData,
        holderName,
        holderDOB: formData.dateOfBirth as string,
        selectedDisclosures,
      });
      
      // Step 4: Store in local blockchain simulation
      setProcessingStep('Recording on local blockchain...');
      
      const blockchainResult = await issueCertificate({
        documentHash: fileHash,
        ipfsCid: cid,
        proof,
        issuer: user.id,
        holder: holderEmail,
        documentType: selectedDocType.id,
        documentCategory: selectedDocType.category,
        metadata: {
          holderName,
          documentTypeName: selectedDocType.name,
          category: selectedDocType.category,
          ...formData,
        },
      });
      
      // Step 5: Issue on real Ethereum Sepolia blockchain if wallet is connected and contract is deployed
      let ethereumTxHash: string | undefined;
      let ethereumExplorerUrl: string | undefined;
      let ethereumBlockNumber: number | undefined;
      let networkUsed: 'ethereum' | 'simulation' | 'both' = 'simulation';
      
      if (IS_CONTRACT_DEPLOYED && isMetaMaskInstalled() && walletSettings.isConfigured) {
        setProcessingStep('Issuing on Ethereum Sepolia blockchain...');
        
        try {
          // Create proof hash from the zk-SNARK proof
          const proofHash = '0x' + fileHash.slice(0, 64);
          
          // Encode zk-SNARK proof data as bytes
          const zkProofDataStr = JSON.stringify(proof.proof).slice(0, 256);
          const zkProofData = '0x' + Array.from(new TextEncoder().encode(zkProofDataStr))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
          
          // Ensure document hash is exactly 32 bytes (64 hex chars)
          const documentHash = '0x' + fileHash.slice(0, 64).padEnd(64, '0');
          
          const ethereumResult = await issueCertificateOnEthereum({
            documentHash,
            holder: walletSettings.walletAddress,
            documentType: selectedDocType.id,
            ipfsCid: cid,
            proofHash,
            zkProofData,
            from: walletSettings.walletAddress,
          });
          
          if (ethereumResult.success && ethereumResult.hash) {
            ethereumTxHash = ethereumResult.hash;
            ethereumExplorerUrl = ethereumResult.explorerUrl;
            ethereumBlockNumber = ethereumResult.blockNumber;
            networkUsed = 'both';
            toast.success('Certificate issued on Ethereum Sepolia blockchain!');
          } else {
            console.error('Ethereum issuance failed:', ethereumResult.error);
            toast.warning('Local issuance succeeded, but blockchain issuance failed: ' + (ethereumResult.error || 'Unknown error'));
          }
        } catch (ethError) {
          console.error('Ethereum issuance error:', ethError);
          toast.warning('Local issuance succeeded, but blockchain issuance failed');
        }
      } else if (!IS_CONTRACT_DEPLOYED) {
        toast.info('Contract not deployed - using local simulation only');
      } else if (!walletSettings.isConfigured) {
        toast.info('Wallet not configured - using local simulation only');
      }
      
      setResult({
        cid,
        hash: fileHash,
        proof,
        transactionHash: blockchainResult.transaction.hash,
        blockNumber: blockchainResult.block.number,
        certificateId: blockchainResult.certificate.id,
        ipfsUrl,
        ethereumTxHash,
        ethereumExplorerUrl,
        ethereumBlockNumber,
        network: networkUsed,
      });
      
      setStep('complete');
      
      if (networkUsed === 'both') {
        toast.success('Certificate issued on both local and Ethereum Sepolia blockchain!');
      } else {
        toast.success('Certificate issued successfully (local simulation)');
      }
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to issue certificate');
      console.error(error);
      setStep('metadata');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };
  
  const downloadCredentials = () => {
    if (!result || !selectedDocType) return;
    
    const credentials = {
      certificateId: result.certificateId,
      cid: result.cid,
      ipfsUrl: result.ipfsUrl,
      hash: result.hash,
      proof: {
        ...result.proof,
        metadata: {
          ...result.proof.metadata,
          disclosures: result.proof.metadata.disclosures.map(d => ({
            key: d.key,
            label: d.label,
            value: d.value,
          })),
        },
      },
      blockchain: {
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
        network: 'ZK-Vault Chain (Simulation)',
      },
      metadata: {
        holderName,
        documentType: selectedDocType.name,
        category: selectedDocType.category,
        issuedBy: user?.name,
        issuedAt: new Date().toISOString(),
        fields: formData,
      },
    };
    
    const blob = new Blob([JSON.stringify(credentials, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedDocType.id}_${holderName.replace(/\s/g, '_')}_credentials.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const resetForm = () => {
    setStep('select-type');
    setSelectedDocType(null);
    setFile(null);
    setFormData({});
    setHolderName('');
    setHolderEmail('');
    setSelectedDisclosures([]);
    setResult(null);
  };

  const filteredDocTypes = selectedCategory === 'all' 
    ? DOCUMENT_TYPES 
    : DOCUMENT_TYPES.filter(d => d.category === selectedCategory);

  const getStepIndex = (s: Step): number => {
    const steps: Step[] = ['select-type', 'upload', 'metadata', 'processing', 'complete'];
    return steps.indexOf(s);
  };
  
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Issue Certificate</h1>
            <p className="text-muted-foreground mt-1">
              Upload a document, generate proofs, and store on the blockchain
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm",
              ipfsConnected ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
            )}>
              <Cloud className="w-4 h-4" />
              {ipfsConnected ? 'IPFS Connected' : 'IPFS Checking...'}
            </div>
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm",
              walletSettings.isConfigured ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
            )}>
              <Wallet className="w-4 h-4" />
              {walletSettings.isConfigured 
                ? `${walletSettings.walletAddress.slice(0, 6)}...${walletSettings.walletAddress.slice(-4)}`
                : 'Wallet Not Configured'}
            </div>
          </div>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[
            { id: 'select-type', label: 'Type', icon: FileText },
            { id: 'upload', label: 'Upload', icon: Upload },
            { id: 'metadata', label: 'Details', icon: Hash },
            { id: 'processing', label: 'Process', icon: Key },
            { id: 'complete', label: 'Complete', icon: CheckCircle },
          ].map((s, i, arr) => (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                  step === s.id
                    ? "bg-primary text-primary-foreground"
                    : getStepIndex(step) > i
                    ? "bg-success text-success-foreground"
                    : "bg-secondary text-muted-foreground"
                )}>
                  <s.icon className="w-5 h-5" />
                </div>
                <span className="text-xs mt-2 text-muted-foreground">{s.label}</span>
              </div>
              {i < arr.length - 1 && (
                <div className={cn(
                  "flex-1 h-px mx-4",
                  getStepIndex(step) > i ? "bg-success" : "bg-border"
                )} />
              )}
            </React.Fragment>
          ))}
        </div>
        
        {/* Step Content */}
        <div className="p-8 rounded-xl bg-card border border-border">
          {/* Wallet Configuration Alert */}
          {!walletSettings.isConfigured && step !== 'processing' && step !== 'complete' && (
            <Alert className="mb-6 border-warning bg-warning/10">
              <Settings className="w-4 h-4 text-warning" />
              <AlertDescription className="flex items-center justify-between">
                <span>Configure your wallet address in settings to issue certificates on blockchain.</span>
                <Link to="/wallet-settings">
                  <Button variant="outline" size="sm" className="gap-1">
                    <Settings className="w-3 h-3" />
                    Configure Wallet
                  </Button>
                </Link>
              </AlertDescription>
            </Alert>
          )}
          {/* Document Type Selection Step */}
          {step === 'select-type' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Select Document Type</h3>
                <p className="text-sm text-muted-foreground">
                  Choose the type of document you want to issue
                </p>
              </div>

              {/* Category Filter */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                >
                  All Types
                </Button>
                {(Object.entries(CATEGORY_INFO) as [DocumentCategory, typeof CATEGORY_INFO[DocumentCategory]][]).map(([cat, info]) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                    className="gap-1"
                  >
                    <span>{info.icon}</span>
                    {info.label}
                  </Button>
                ))}
              </div>

              {/* Document Type Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDocTypes.map((docType) => (
                  <button
                    key={docType.id}
                    onClick={() => handleDocTypeSelect(docType)}
                    className={cn(
                      "p-4 rounded-lg border text-left transition-all hover:border-primary hover:bg-primary/5",
                      "bg-secondary/30 border-border"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{docType.icon}</span>
                      <div>
                        <p className="font-medium text-foreground">{docType.name}</p>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          CATEGORY_INFO[docType.category].color
                        )}>
                          {CATEGORY_INFO[docType.category].label}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {docType.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Upload Step */}
          {step === 'upload' && selectedDocType && (
            <div className="space-y-6">
              <Button variant="ghost" size="sm" onClick={() => setStep('select-type')} className="gap-1">
                <ArrowLeft className="w-4 h-4" /> Back to type selection
              </Button>
              
              <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10">
                <span className="text-3xl">{selectedDocType.icon}</span>
                <div>
                  <p className="font-medium text-foreground">{selectedDocType.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedDocType.description}</p>
                </div>
              </div>

              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer",
                  "hover:border-primary/50 hover:bg-primary/5",
                  file ? "border-success bg-success/5" : "border-border"
                )}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                />
                <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Drop your {selectedDocType.name.toLowerCase()} here
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to browse (PDF, JPG, PNG)
                </p>
                <Button variant="outline">Select File</Button>
              </div>
            </div>
          )}
          
          {/* Metadata Step */}
          {step === 'metadata' && selectedDocType && (
            <div className="space-y-6">
              <Button variant="ghost" size="sm" onClick={() => setStep('upload')} className="gap-1">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>

              {/* File Preview */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
                <span className="text-3xl">{selectedDocType.icon}</span>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{file?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {file && (file.size / 1024).toFixed(1)} KB • {selectedDocType.name}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep('upload')}>
                  Change
                </Button>
              </div>
              
              {/* Holder Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground">Holder Information</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Holder Name *</label>
                    <Input
                      placeholder="John Doe"
                      value={holderName}
                      onChange={(e) => setHolderName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Holder Email *</label>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      value={holderEmail}
                      onChange={(e) => setHolderEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Document-Specific Fields */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground">{selectedDocType.name} Details</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {selectedDocType.fields.map((field) => (
                    <div key={field.key} className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        {field.label} {field.required && '*'}
                      </label>
                      {field.type === 'select' && field.options ? (
                        <Select
                          value={String(formData[field.key] || '')}
                          onValueChange={(value) => updateFormField(field.key, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options.map((opt) => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : field.type === 'boolean' ? (
                        <Select
                          value={formData[field.key] === true ? 'yes' : formData[field.key] === false ? 'no' : ''}
                          onValueChange={(value) => updateFormField(field.key, value === 'yes')}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
                          placeholder={field.placeholder}
                          value={String(formData[field.key] || '')}
                          onChange={(e) => updateFormField(
                            field.key, 
                            field.type === 'number' ? Number(e.target.value) : e.target.value
                          )}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Selective Disclosure Options */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  Selective Disclosure Attributes (zk-SNARK)
                </label>
                <p className="text-xs text-muted-foreground">
                  Choose which attributes can be verified without revealing full document data
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {selectedDocType.disclosureOptions.map(({ key, label, description }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleDisclosure(key)}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-all",
                        selectedDisclosures.includes(key)
                          ? "bg-primary/10 border-primary"
                          : "bg-secondary border-border hover:border-primary/50"
                      )}
                    >
                      <p className={cn(
                        "text-sm font-medium",
                        selectedDisclosures.includes(key) ? "text-primary" : "text-foreground"
                      )}>
                        {label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{description}</p>
                    </button>
                  ))}
                </div>
              </div>
              
              <Button
                variant="glow"
                size="lg"
                className="w-full"
                onClick={processIssuance}
                disabled={!holderName || !holderEmail}
              >
                <Key className="w-4 h-4" />
                Generate Proof & Issue
              </Button>
            </div>
          )}
          
          {/* Processing Step */}
          {step === 'processing' && (
            <div className="text-center py-12">
              <Loader2 className="w-16 h-16 mx-auto mb-6 text-primary animate-spin" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Processing {selectedDocType?.name}
              </h3>
              <p className="text-muted-foreground">{processingStep}</p>
              
              <div className="mt-8 space-y-3 text-left max-w-md mx-auto">
                {[
                  { label: `Storing in IPFS${ipfsConnected ? ' (Pinata)' : ''}`, icon: Cloud, done: processingStep !== 'Storing in IPFS...' },
                  { label: 'Generating SHA-256 hash', icon: Hash, done: processingStep !== 'Generating SHA-256 hash...' && processingStep !== 'Storing in IPFS...' },
                  { label: 'Creating zk-SNARK proof', icon: Key, done: processingStep !== 'Generating zk-SNARK proof...' && !['Storing in IPFS...', 'Generating SHA-256 hash...'].includes(processingStep) },
                  { label: 'Recording on blockchain', icon: Database, done: processingStep === '' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <item.icon className={cn("w-5 h-5", item.done ? "text-success" : "text-muted-foreground")} />
                    <span className={cn("text-sm", item.done ? "text-foreground" : "text-muted-foreground")}>
                      {item.label}
                    </span>
                    {item.done && <CheckCircle className="w-4 h-4 text-success ml-auto" />}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Complete Step */}
          {step === 'complete' && result && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-success" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {selectedDocType?.name} Issued Successfully!
                </h3>
                <p className="text-muted-foreground">
                  The document has been stored and all credentials are ready for the holder
                </p>
              </div>
              
              <div className="space-y-4">
                {/* CID */}
                <div className="p-4 rounded-lg bg-secondary/50 space-y-2">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-accent-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      IPFS CID {result.ipfsUrl && '(Pinata)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono bg-background p-2 rounded overflow-x-auto">
                      {result.cid}
                    </code>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(result.cid, 'CID')}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  {result.ipfsUrl && (
                    <a 
                      href={result.ipfsUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      View on IPFS Gateway →
                    </a>
                  )}
                </div>
                
                {/* Hash */}
                <div className="p-4 rounded-lg bg-secondary/50 space-y-2">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-warning" />
                    <span className="text-sm font-medium text-foreground">SHA-256 Hash</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono bg-background p-2 rounded overflow-x-auto">
                      {result.hash}
                    </code>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(result.hash, 'Hash')}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Local Transaction */}
                <div className="p-4 rounded-lg bg-secondary/50 space-y-2">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Local Transaction Hash</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono bg-background p-2 rounded overflow-x-auto">
                      {result.transactionHash}
                    </code>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(result.transactionHash, 'Transaction')}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Local Block #{result.blockNumber}</p>
                </div>

                {/* Ethereum Transaction (if issued on chain) */}
                {result.ethereumTxHash && (
                  <div className="p-4 rounded-lg bg-success/10 border border-success/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Blocks className="w-4 h-4 text-success" />
                        <span className="text-sm font-medium text-success">Base Sepolia Transaction</span>
                      </div>
                      {result.ethereumExplorerUrl && (
                        <a
                          href={result.ethereumExplorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-success hover:underline flex items-center gap-1"
                        >
                          View on BaseScan <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs font-mono bg-background p-2 rounded overflow-x-auto">
                        {result.ethereumTxHash}
                      </code>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(result.ethereumTxHash!, 'Ethereum TX')}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    {result.ethereumBlockNumber && (
                      <p className="text-xs text-success">Block #{result.ethereumBlockNumber} on Base Sepolia</p>
                    )}
                  </div>
                )}

                {/* Certificate ID */}
                <div className="p-4 rounded-lg bg-secondary/50 space-y-2">
                  <div className="flex items-center gap-2">
                    <Blocks className="w-4 h-4 text-accent-foreground" />
                    <span className="text-sm font-medium text-foreground">Certificate ID</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono bg-background p-2 rounded overflow-x-auto">
                      {result.certificateId}
                    </code>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(result.certificateId, 'Certificate ID')}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Proof */}
                <div className="p-4 rounded-lg bg-secondary/50 space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-success" />
                    <span className="text-sm font-medium text-foreground">zk-SNARK Proof (Groth16)</span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">
                      Protocol: {result.proof.proof.protocol} | Curve: {result.proof.proof.curve}
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs font-mono bg-background p-2 rounded max-h-20 overflow-y-auto">
                        {JSON.stringify(result.proof.proof, null, 2).substring(0, 200)}...
                      </code>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(JSON.stringify(result.proof), 'Proof')}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Disclosed Attributes */}
                  {result.proof.metadata.disclosures.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs font-medium text-foreground mb-2">Disclosed Attributes:</p>
                      <div className="flex flex-wrap gap-2">
                        {result.proof.metadata.disclosures.map((d, i) => (
                          <span key={i} className="text-xs px-2 py-1 rounded-full bg-success/10 text-success">
                            {d.label}: {typeof d.value === 'boolean' ? '✓' : d.value}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button variant="glow" className="flex-1" onClick={downloadCredentials}>
                  <Download className="w-4 h-4" />
                  Download Credentials
                </Button>
                <Button variant="outline" className="flex-1" onClick={resetForm}>
                  Issue Another
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

    </DashboardLayout>
  );
}
