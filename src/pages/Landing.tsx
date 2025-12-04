/**
 * Landing Page
 * 
 * Welcome page for ZK-Vault showing:
 * - System overview
 * - Architecture diagram
 * - Login options for different roles
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArchitectureDiagram } from '@/components/ArchitectureDiagram';
import { Shield, Lock, FileCheck, Zap, Users, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function Landing() {
  const [selectedFeature, setSelectedFeature] = useState<{
    icon: React.ElementType;
    title: string;
    description: string;
    details: string;
  } | null>(null);

  const features = [
    {
      icon: FileCheck,
      title: 'Tamper-Proof Certificates',
      description: 'Certificates are hashed with SHA-256 and stored on an immutable blockchain ledger.',
      details: 'Our system uses SHA-256 cryptographic hashing to create a unique fingerprint of each certificate. This hash is then stored on a simulated blockchain ledger, ensuring immutability. Any modification to the original certificate would result in a different hash, immediately exposing tampering attempts.',
    },
    {
      icon: Lock,
      title: 'zk-SNARK Proofs',
      description: 'Generate zero-knowledge proofs for selective attribute disclosure without revealing sensitive data.',
      details: 'Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge (zk-SNARKs) allow certificate holders to prove specific attributes (like "age > 18" or "degree verified") without revealing the entire certificate. This preserves privacy while enabling verification.',
    },
    {
      icon: Shield,
      title: 'Decentralized Storage',
      description: 'IPFS integration for distributed, content-addressed file storage with unique CIDs.',
      details: 'The InterPlanetary File System (IPFS) provides content-addressed storage where each file receives a unique Content Identifier (CID). This ensures files are retrievable by their content hash, making them tamper-evident and distributed across the network.',
    },
    {
      icon: Users,
      title: 'Role-Based Access',
      description: 'RBAC system with Issuer, Verifier, and Admin roles with granular permissions.',
      details: 'Our Role-Based Access Control (RBAC) system defines three distinct roles: Issuers can create and manage certificates, Verifiers can validate certificates and proofs, and Admins have full system access including user management and certificate revocation.',
    },
    {
      icon: Eye,
      title: 'Selective Disclosure',
      description: 'Reveal only required attributes (age>18, degree verified) without exposing full certificate.',
      details: 'Selective disclosure allows certificate holders to choose which attributes to reveal during verification. For example, proving you have a valid degree without exposing your GPA, or confirming you are over 18 without revealing your exact birth date.',
    },
    {
      icon: Zap,
      title: 'Instant Verification',
      description: 'Verify certificate authenticity in seconds using cryptographic proofs.',
      details: 'Verification is performed by checking the cryptographic proof against the blockchain ledger. The process takes seconds and provides mathematical certainty about the certificate\'s authenticity without requiring access to the original document.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          {/* Navigation */}
          <nav className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">ZK-Vault</span>
            </div>
            <Link to="/login">
              <Button variant="glow" size="lg">
                Get Started
              </Button>
            </Link>
          </nav>
          
          {/* Hero Content */}
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              <span className="gradient-text">Zero-Knowledge</span> Certificate
              <br />Verification System
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              A tamper-proof certificate issuance and verification system using 
              zk-SNARKs for selective attribute disclosure and blockchain-based 
              immutable storage.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link to="/login">
                <Button variant="glow" size="xl">
                  <Lock className="w-5 h-5" />
                  Login to Dashboard
                </Button>
              </Link>
              <a href="#architecture">
                <Button variant="outline" size="xl">
                  View Architecture
                </Button>
              </a>
            </div>
          </div>
        </div>
      </header>
      
      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Key Features
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Based on the research paper "ZK-Vault: A Verification and Issuance System 
              for Tamper-Proof Certificates using Zero-Knowledge Proofs"
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <button
                key={index}
                onClick={() => setSelectedFeature(feature)}
                className="p-6 rounded-xl bg-card border border-border card-hover animate-slide-in text-left transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
                style={{ animationDelay: `${index * 100}ms`, opacity: 0 }}
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>
      
      {/* Feature Detail Dialog */}
      <Dialog open={!!selectedFeature} onOpenChange={(open) => !open && setSelectedFeature(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              {selectedFeature && (
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <selectedFeature.icon className="w-5 h-5 text-primary" />
                </div>
              )}
              <DialogTitle>{selectedFeature?.title}</DialogTitle>
            </div>
            <DialogDescription className="text-left">
              {selectedFeature?.details}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-4">
            <Link to="/login">
              <Button variant="glow" size="sm">
                Try It Now
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Architecture Section */}
      <section id="architecture" className="py-20 px-4 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <ArchitectureDiagram />
        </div>
      </section>
      
      {/* Demo Credentials Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Try the Demo
            </h2>
            <p className="text-muted-foreground">
              Use these demo credentials to explore different roles
            </p>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                role: 'Issuer',
                email: 'issuer@university.edu',
                description: 'Upload certificates, generate proofs',
                color: 'primary',
              },
              {
                role: 'Verifier',
                email: 'verifier@company.com',
                description: 'Verify certificates and proofs',
                color: 'success',
              },
              {
                role: 'Admin',
                email: 'admin@zkvault.io',
                description: 'Full system access and management',
                color: 'destructive',
              },
            ].map((cred, index) => (
              <div
                key={index}
                className="p-6 rounded-xl bg-card border border-border text-center"
              >
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-4 bg-${cred.color}/20 text-${cred.color} border border-${cred.color}/30`}>
                  {cred.role}
                </div>
                <p className="font-mono text-sm text-foreground mb-2">{cred.email}</p>
                <p className="text-xs text-muted-foreground mb-4">{cred.description}</p>
                <p className="text-xs text-muted-foreground">
                  Password: <span className="font-mono">password</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            ZK-Vault Research Paper Simulation • Built for demonstration purposes
          </p>
        </div>
      </footer>
    </div>
  );
}
