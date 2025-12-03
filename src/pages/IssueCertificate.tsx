/**
 * Issue Certificate Page
 * 
 * Full certificate issuance workflow:
 * 1. Upload certificate file
 * 2. Enter certificate metadata
 * 3. Store in simulated IPFS (get CID)
 * 4. Generate SHA-256 hash
 * 5. Generate zk-SNARK proof with selective disclosure
 * 6. Store in simulated blockchain
 * 7. Display all credentials for holder
 */

import React, { useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/lib/auth/AuthContext';
import { storeFile } from '@/lib/simulation/ipfs';
import { hashFile } from '@/lib/simulation/hash';
import { generateZKProof, SelectableAttributes } from '@/lib/simulation/zksnark';
import { storeCertificate } from '@/lib/simulation/blockchain';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = 'upload' | 'metadata' | 'processing' | 'complete';

interface CertificateMetadata {
  holderName: string;
  holderEmail: string;
  certificateType: string;
  attributes: {
    citizenship: string;
    graduationYear: number;
    ageOver18: boolean;
    degreeVerified: boolean;
  };
}

interface IssuanceResult {
  cid: string;
  hash: string;
  proof: string;
  transactionHash: string;
  blockNumber: number;
}

export default function IssueCertificate() {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<CertificateMetadata>({
    holderName: '',
    holderEmail: '',
    certificateType: 'Degree Certificate',
    attributes: {
      citizenship: 'United States',
      graduationYear: 2024,
      ageOver18: true,
      degreeVerified: true,
    },
  });
  const [selectedDisclosures, setSelectedDisclosures] = useState<(keyof SelectableAttributes)[]>([
    'ageOver18',
    'degreeVerified',
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [result, setResult] = useState<IssuanceResult | null>(null);
  
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
  
  const toggleDisclosure = (attr: keyof SelectableAttributes) => {
    setSelectedDisclosures(prev =>
      prev.includes(attr)
        ? prev.filter(a => a !== attr)
        : [...prev, attr]
    );
  };
  
  const processIssuance = async () => {
    if (!file || !user) return;
    
    setIsProcessing(true);
    setStep('processing');
    
    try {
      // Step 1: Store in IPFS
      setProcessingStep('Storing in IPFS...');
      await new Promise(r => setTimeout(r, 800));
      const ipfsResult = await storeFile(file, user.id);
      
      // Step 2: Generate SHA-256 hash
      setProcessingStep('Generating SHA-256 hash...');
      await new Promise(r => setTimeout(r, 600));
      const fileHash = await hashFile(file);
      
      // Step 3: Generate zk-SNARK proof
      setProcessingStep('Generating zk-SNARK proof...');
      await new Promise(r => setTimeout(r, 1000));
      const proof = generateZKProof({
        certificateHash: fileHash,
        certificateData: {
          holderName: metadata.holderName,
          certificateType: metadata.certificateType,
          issuer: user.name,
          attributes: metadata.attributes,
        },
        selectedDisclosures,
      });
      
      // Step 4: Store in blockchain
      setProcessingStep('Recording on blockchain...');
      await new Promise(r => setTimeout(r, 800));
      const blockchainResult = storeCertificate({
        hash: fileHash,
        cid: ipfsResult.cid,
        proof,
        issuer: user.id,
        issuedTo: metadata.holderEmail,
        certificateType: metadata.certificateType,
        metadata: {
          holderName: metadata.holderName,
          ...metadata.attributes,
        },
      });
      
      setResult({
        cid: ipfsResult.cid,
        hash: fileHash,
        proof: JSON.stringify(proof),
        transactionHash: blockchainResult.transactionHash,
        blockNumber: blockchainResult.record.blockNumber,
      });
      
      setStep('complete');
      toast.success('Certificate issued successfully!');
      
    } catch (error) {
      toast.error('Failed to issue certificate');
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
    if (!result) return;
    
    const credentials = {
      cid: result.cid,
      hash: result.hash,
      proof: JSON.parse(result.proof),
      blockchain: {
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
      },
      metadata: {
        holderName: metadata.holderName,
        certificateType: metadata.certificateType,
        issuedBy: user?.name,
        issuedAt: new Date().toISOString(),
      },
    };
    
    const blob = new Blob([JSON.stringify(credentials, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificate_${metadata.holderName.replace(/\s/g, '_')}_credentials.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const resetForm = () => {
    setStep('upload');
    setFile(null);
    setMetadata({
      holderName: '',
      holderEmail: '',
      certificateType: 'Degree Certificate',
      attributes: {
        citizenship: 'United States',
        graduationYear: 2024,
        ageOver18: true,
        degreeVerified: true,
      },
    });
    setResult(null);
  };
  
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Issue Certificate</h1>
          <p className="text-muted-foreground mt-1">
            Upload a certificate, generate proofs, and store on the blockchain
          </p>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[
            { id: 'upload', label: 'Upload', icon: Upload },
            { id: 'metadata', label: 'Metadata', icon: FileText },
            { id: 'processing', label: 'Processing', icon: Key },
            { id: 'complete', label: 'Complete', icon: CheckCircle },
          ].map((s, i, arr) => (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                  step === s.id
                    ? "bg-primary text-primary-foreground"
                    : arr.findIndex(x => x.id === step) > i
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
                  arr.findIndex(x => x.id === step) > i
                    ? "bg-success"
                    : "bg-border"
                )} />
              )}
            </React.Fragment>
          ))}
        </div>
        
        {/* Step Content */}
        <div className="p-8 rounded-xl bg-card border border-border">
          {/* Upload Step */}
          {step === 'upload' && (
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
                Drop your certificate file here
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                or click to browse (PDF, JPG, PNG)
              </p>
              <Button variant="outline">Select File</Button>
            </div>
          )}
          
          {/* Metadata Step */}
          {step === 'metadata' && (
            <div className="space-y-6">
              {/* File Preview */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
                <FileText className="w-10 h-10 text-primary" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">{file?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {file && (file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep('upload')}>
                  Change
                </Button>
              </div>
              
              {/* Form Fields */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Holder Name</label>
                  <Input
                    placeholder="John Doe"
                    value={metadata.holderName}
                    onChange={(e) => setMetadata(m => ({ ...m, holderName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Holder Email</label>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    value={metadata.holderEmail}
                    onChange={(e) => setMetadata(m => ({ ...m, holderEmail: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Certificate Type</label>
                  <Input
                    placeholder="Degree Certificate"
                    value={metadata.certificateType}
                    onChange={(e) => setMetadata(m => ({ ...m, certificateType: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Graduation Year</label>
                  <Input
                    type="number"
                    value={metadata.attributes.graduationYear}
                    onChange={(e) => setMetadata(m => ({
                      ...m,
                      attributes: { ...m.attributes, graduationYear: parseInt(e.target.value) }
                    }))}
                  />
                </div>
              </div>
              
              {/* Selective Disclosure Options */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  Selective Disclosure Attributes (zk-SNARK)
                </label>
                <p className="text-xs text-muted-foreground">
                  Choose which attributes can be verified without revealing full certificate data
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { key: 'ageOver18', label: 'Age > 18' },
                    { key: 'degreeVerified', label: 'Degree Verified' },
                    { key: 'citizenship', label: 'Citizenship' },
                    { key: 'graduationYear', label: 'Graduation Year' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleDisclosure(key as keyof SelectableAttributes)}
                      className={cn(
                        "p-3 rounded-lg border text-sm transition-all",
                        selectedDisclosures.includes(key as keyof SelectableAttributes)
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-secondary border-border text-muted-foreground hover:border-primary/50"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              
              <Button
                variant="glow"
                size="lg"
                className="w-full"
                onClick={processIssuance}
                disabled={!metadata.holderName || !metadata.holderEmail}
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
                Processing Certificate
              </h3>
              <p className="text-muted-foreground">{processingStep}</p>
              
              {/* Processing Steps Visualization */}
              <div className="mt-8 space-y-3 text-left max-w-md mx-auto">
                {[
                  { label: 'Storing in IPFS', icon: Cloud, done: processingStep !== 'Storing in IPFS...' },
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
                  Certificate Issued Successfully!
                </h3>
                <p className="text-muted-foreground">
                  The certificate has been stored and all credentials are ready for the holder
                </p>
              </div>
              
              {/* Credentials Display */}
              <div className="space-y-4">
                {/* CID */}
                <div className="p-4 rounded-lg bg-secondary/50 space-y-2">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-accent-foreground" />
                    <span className="text-sm font-medium text-foreground">IPFS CID</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono bg-background p-2 rounded overflow-x-auto">
                      {result.cid}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(result.cid, 'CID')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(result.hash, 'Hash')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Transaction */}
                <div className="p-4 rounded-lg bg-secondary/50 space-y-2">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Transaction Hash</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono bg-background p-2 rounded overflow-x-auto">
                      {result.transactionHash}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(result.transactionHash, 'Transaction')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Block #{result.blockNumber}</p>
                </div>
                
                {/* Proof */}
                <div className="p-4 rounded-lg bg-secondary/50 space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-success" />
                    <span className="text-sm font-medium text-foreground">zk-SNARK Proof</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono bg-background p-2 rounded max-h-20 overflow-y-auto">
                      {result.proof.substring(0, 200)}...
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(result.proof, 'Proof')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
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
