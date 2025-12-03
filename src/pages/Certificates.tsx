/**
 * All Certificates Page (Admin Only)
 * 
 * View all certificates in the system with:
 * - Status filtering
 * - Certificate details
 * - Quick actions (revoke, suspend)
 */

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { getAllCertificates, CertificateRecord } from '@/lib/simulation/blockchain';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileCheck,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Hash,
  Clock,
  Database,
  User,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Certificates() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'revoked' | 'suspended'>('all');
  const [selectedCert, setSelectedCert] = useState<CertificateRecord | null>(null);
  
  const certificates = getAllCertificates();
  
  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = 
      cert.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.certificateType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.issuedTo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || cert.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', label: 'Active' };
      case 'revoked':
        return { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Revoked' };
      case 'suspended':
        return { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', label: 'Suspended' };
      default:
        return { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Unknown' };
    }
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">All Certificates</h1>
            <p className="text-muted-foreground mt-1">
              {certificates.length} certificates in the registry
            </p>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by hash, type, or holder..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'revoked', 'suspended'] as const).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className="capitalize"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Certificates Grid */}
        <div className="grid gap-4">
          {filteredCertificates.length === 0 ? (
            <div className="p-12 rounded-xl bg-card border border-border text-center">
              <FileCheck className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No certificates found
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No certificates have been issued yet'}
              </p>
            </div>
          ) : (
            filteredCertificates.map((cert) => {
              const statusConfig = getStatusConfig(cert.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <div
                  key={cert.id}
                  className={cn(
                    "p-6 rounded-xl bg-card border border-border transition-all cursor-pointer",
                    selectedCert?.id === cert.id ? "ring-2 ring-primary" : "hover:border-primary/30"
                  )}
                  onClick={() => setSelectedCert(selectedCert?.id === cert.id ? null : cert)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={cn("p-3 rounded-lg", statusConfig.bg)}>
                        <StatusIcon className={cn("w-6 h-6", statusConfig.color)} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-foreground">{cert.certificateType}</h3>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            statusConfig.bg, statusConfig.color
                          )}>
                            {statusConfig.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {cert.issuedTo}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(cert.timestamp).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Database className="w-3 h-3" />
                            Block #{cert.blockNumber}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Details */}
                  {selectedCert?.id === cert.id && (
                    <div className="mt-6 pt-6 border-t border-border space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground flex items-center gap-1">
                            <Hash className="w-3 h-3" /> SHA-256 Hash
                          </label>
                          <code className="block text-xs font-mono bg-secondary p-2 rounded overflow-x-auto">
                            {cert.hash}
                          </code>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">IPFS CID</label>
                          <code className="block text-xs font-mono bg-secondary p-2 rounded overflow-x-auto">
                            {cert.cid}
                          </code>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Transaction Hash</label>
                          <code className="block text-xs font-mono bg-secondary p-2 rounded overflow-x-auto">
                            {cert.transactionHash}
                          </code>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Issuer ID</label>
                          <code className="block text-xs font-mono bg-secondary p-2 rounded">
                            {cert.issuer}
                          </code>
                        </div>
                      </div>
                      
                      {/* Status History */}
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground">Status History</label>
                        <div className="space-y-2">
                          {cert.statusHistory.map((change, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-3 text-xs p-2 rounded bg-secondary/50"
                            >
                              <span className="text-muted-foreground">
                                {new Date(change.timestamp).toLocaleString()}
                              </span>
                              <span className="text-foreground">
                                {change.from} → {change.to}
                              </span>
                              <span className="text-muted-foreground">
                                ({change.reason})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
