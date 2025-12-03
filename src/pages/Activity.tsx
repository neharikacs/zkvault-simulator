/**
 * System Activity Page (Admin Only)
 * 
 * View all system activity:
 * - Verification attempts
 * - Certificate issuances
 * - Status changes
 */

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { getVerificationLogs, getAllCertificates } from '@/lib/simulation/blockchain';
import {
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  FileCheck,
  Clock,
  Hash,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ActivityPage() {
  const verificationLogs = getVerificationLogs();
  const certificates = getAllCertificates();
  
  // Combine and sort activities
  const activities = [
    ...verificationLogs.map(log => ({
      type: 'verification' as const,
      id: log.id,
      timestamp: log.timestamp,
      data: log,
    })),
    ...certificates.map(cert => ({
      type: 'issuance' as const,
      id: cert.id,
      timestamp: cert.timestamp,
      data: cert,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  const getVerificationConfig = (result: string) => {
    switch (result) {
      case 'valid':
        return { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', label: 'Valid' };
      case 'invalid':
        return { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Invalid' };
      case 'revoked':
        return { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Revoked' };
      case 'not_found':
        return { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', label: 'Not Found' };
      default:
        return { icon: AlertTriangle, color: 'text-muted-foreground', bg: 'bg-muted', label: result };
    }
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">System Activity</h1>
          <p className="text-muted-foreground mt-1">
            Monitor all system events and verification attempts
          </p>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{activities.length}</p>
                <p className="text-xs text-muted-foreground">Total Events</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/20">
                <Search className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{verificationLogs.length}</p>
                <p className="text-xs text-muted-foreground">Verifications</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {verificationLogs.filter(l => l.result === 'valid').length}
                </p>
                <p className="text-xs text-muted-foreground">Successful</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <XCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {verificationLogs.filter(l => l.result !== 'valid').length}
                </p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Activity Feed */}
        <div className="p-6 rounded-xl bg-card border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">Activity Feed</h2>
          
          {activities.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No activity yet</h3>
              <p className="text-muted-foreground">
                System events will appear here as they occur
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => {
                if (activity.type === 'verification') {
                  const log = activity.data as typeof verificationLogs[0];
                  const config = getVerificationConfig(log.result);
                  const ConfigIcon = config.icon;
                  
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30 border border-border"
                    >
                      <div className={cn("p-2 rounded-lg", config.bg)}>
                        <Search className={cn("w-5 h-5", config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground">Verification Attempt</span>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            config.bg, config.color
                          )}>
                            {config.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            <code className="text-xs">{log.certificateHash.substring(0, 16)}...</code>
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {log.verifier}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {new Date(activity.timestamp).toLocaleString()}
                      </div>
                    </div>
                  );
                } else {
                  const cert = activity.data as typeof certificates[0];
                  
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30 border border-border"
                    >
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileCheck className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground">Certificate Issued</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {cert.certificateType}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            <code className="text-xs">{cert.hash.substring(0, 16)}...</code>
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {cert.issuedTo}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {new Date(activity.timestamp).toLocaleString()}
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
