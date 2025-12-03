/**
 * Architecture Diagram Component
 * 
 * Visual representation of the ZK-Vault system architecture
 * Based on Figure 1 from the research paper (page 4)
 * 
 * Shows the flow:
 * 1. Certificate Creation
 * 2. IPFS Storage
 * 3. SHA-256 Hashing
 * 4. zk-SNARK Proof Generation
 * 5. Blockchain Storage
 * 6. Verification Process
 */

import React from 'react';
import { 
  FileText, 
  Database, 
  Shield, 
  Lock, 
  CheckCircle, 
  ArrowRight,
  Cloud,
  Hash,
  Key,
  Search
} from 'lucide-react';

export function ArchitectureDiagram() {
  return (
    <div className="w-full py-8">
      <div className="max-w-5xl mx-auto">
        {/* Title */}
        <div className="text-center mb-8">
          <h3 className="text-xl font-semibold text-foreground mb-2">
            System Architecture
          </h3>
          <p className="text-muted-foreground text-sm">
            Zero-Knowledge Proof Certificate Verification Flow
          </p>
        </div>
        
        {/* Diagram */}
        <div className="relative">
          {/* Top Row - Issuance Flow */}
          <div className="flex items-center justify-between mb-12">
            {/* Certificate Upload */}
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center mb-3 animate-pulse-glow">
                <FileText className="w-10 h-10 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">Certificate</span>
              <span className="text-xs text-muted-foreground">Upload</span>
            </div>
            
            <ArrowRight className="w-6 h-6 text-primary/50" />
            
            {/* IPFS Storage */}
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/30 to-accent/10 border border-accent-foreground/30 flex items-center justify-center mb-3">
                <Cloud className="w-10 h-10 text-accent-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground">IPFS</span>
              <span className="text-xs text-muted-foreground">Storage</span>
            </div>
            
            <ArrowRight className="w-6 h-6 text-primary/50" />
            
            {/* SHA-256 Hash */}
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-warning/20 to-warning/5 border border-warning/30 flex items-center justify-center mb-3">
                <Hash className="w-10 h-10 text-warning" />
              </div>
              <span className="text-sm font-medium text-foreground">SHA-256</span>
              <span className="text-xs text-muted-foreground">Hash</span>
            </div>
            
            <ArrowRight className="w-6 h-6 text-primary/50" />
            
            {/* zk-SNARK */}
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-success/20 to-success/5 border border-success/30 flex items-center justify-center mb-3">
                <Key className="w-10 h-10 text-success" />
              </div>
              <span className="text-sm font-medium text-foreground">zk-SNARK</span>
              <span className="text-xs text-muted-foreground">Proof Gen</span>
            </div>
            
            <ArrowRight className="w-6 h-6 text-primary/50" />
            
            {/* Blockchain */}
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/40 flex items-center justify-center mb-3 shadow-lg shadow-primary/20">
                <Database className="w-10 h-10 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">Blockchain</span>
              <span className="text-xs text-muted-foreground">Ledger</span>
            </div>
          </div>
          
          {/* Connector Line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-12 w-px bg-gradient-to-b from-primary/50 to-transparent" style={{ top: '140px' }}></div>
          
          {/* Bottom Row - Verification Flow */}
          <div className="flex items-center justify-center gap-8 pt-4">
            {/* Verifier Input */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-xl bg-secondary border border-border flex items-center justify-center mb-2">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <span className="text-xs font-medium text-foreground">Verifier</span>
              <span className="text-xs text-muted-foreground">Input</span>
            </div>
            
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
            
            {/* Proof Verification */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-success/20 to-success/5 border border-success/30 flex items-center justify-center mb-2">
                <Shield className="w-8 h-8 text-success" />
              </div>
              <span className="text-xs font-medium text-foreground">Verify</span>
              <span className="text-xs text-muted-foreground">Proof</span>
            </div>
            
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
            
            {/* Result */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center mb-2">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <span className="text-xs font-medium text-foreground">Valid</span>
              <span className="text-xs text-muted-foreground">Result</span>
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex justify-center gap-6 mt-10 pt-6 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <span className="text-xs text-muted-foreground">Core Process</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success"></div>
            <span className="text-xs text-muted-foreground">Zero-Knowledge</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning"></div>
            <span className="text-xs text-muted-foreground">Cryptographic</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent-foreground"></div>
            <span className="text-xs text-muted-foreground">Storage</span>
          </div>
        </div>
      </div>
    </div>
  );
}
