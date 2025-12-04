/**
 * Main Dashboard Page
 * 
 * Role-specific dashboard showing:
 * - Statistics overview
 * - Quick actions based on role
 * - Recent activity
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/lib/auth/AuthContext';
import { getBlockchainStats, getAllCertificates, getVerificationLogs } from '@/lib/simulation/blockchain';
import { Button } from '@/components/ui/button';
import {
  FileCheck,
  Upload,
  Search,
  Users,
  Activity,
  Shield,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Refresh data when component mounts or refreshKey changes
  const refreshData = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);
  
  // Auto-refresh on focus
  useEffect(() => {
    const handleFocus = () => refreshData();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshData]);
  
  const stats = getBlockchainStats();
  const certificates = getAllCertificates();
  const verificationLogs = getVerificationLogs();
  
  const recentCertificates = certificates.slice(-5).reverse();
  const recentVerifications = verificationLogs.slice(-5).reverse();
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'valid':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'revoked':
      case 'invalid':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'suspended':
      case 'not_found':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user?.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            {user?.role === 'issuer' && 'Issue and manage certificates with zero-knowledge proofs'}
            {user?.role === 'verifier' && 'Verify certificates using cryptographic proofs'}
            {user?.role === 'admin' && 'Full system overview and management'}
          </p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileCheck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalCertificates}</p>
                <p className="text-sm text-muted-foreground">Total Certificates</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.activeCertificates}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                <Search className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalVerifications}</p>
                <p className="text-sm text-muted-foreground">Verifications</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.revokedCertificates}</p>
                <p className="text-sm text-muted-foreground">Revoked</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="p-6 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
            <Button variant="ghost" size="sm" onClick={refreshData}>
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
          <div className="flex flex-wrap gap-3">
            {(user?.role === 'issuer' || user?.role === 'admin') && (
              <Link to="/issue">
                <Button variant="glow">
                  <Upload className="w-4 h-4" />
                  Issue Certificate
                </Button>
              </Link>
            )}
            {(user?.role === 'verifier' || user?.role === 'admin') && (
              <Link to="/verify">
                <Button variant="outline">
                  <Search className="w-4 h-4" />
                  Verify Certificate
                </Button>
              </Link>
            )}
            {user?.role === 'admin' && (
              <>
                <Link to="/certificates">
                  <Button variant="outline">
                    <FileCheck className="w-4 h-4" />
                    View All Certificates
                  </Button>
                </Link>
                <Link to="/users">
                  <Button variant="outline">
                    <Users className="w-4 h-4" />
                    Manage Users
                  </Button>
                </Link>
              </>
            )}
            <Link to="/results">
              <Button variant="outline">
                <TrendingUp className="w-4 h-4" />
                View Results
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Certificates */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Recent Certificates</h2>
              {user?.role === 'admin' && (
                <Link to="/certificates" className="text-sm text-primary hover:underline">
                  View all
                </Link>
              )}
            </div>
            {recentCertificates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No certificates issued yet</p>
                {(user?.role === 'issuer' || user?.role === 'admin') && (
                  <Link to="/issue">
                    <Button variant="outline" size="sm" className="mt-4">
                      Issue First Certificate
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {recentCertificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border"
                  >
                    {getStatusIcon(cert.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {cert.certificateType}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {cert.hash.substring(0, 20)}...
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(cert.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Recent Verifications */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Recent Verifications</h2>
              {user?.role === 'admin' && (
                <Link to="/activity" className="text-sm text-primary hover:underline">
                  View all
                </Link>
              )}
            </div>
            {recentVerifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No verifications yet</p>
                {(user?.role === 'verifier' || user?.role === 'admin') && (
                  <Link to="/verify">
                    <Button variant="outline" size="sm" className="mt-4">
                      Verify a Certificate
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {recentVerifications.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border"
                  >
                    {getStatusIcon(log.result)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground capitalize">
                        {log.result.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {log.certificateHash.substring(0, 20)}...
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* System Info */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                ZK-Vault Simulation
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                This is a research paper demonstration. All blockchain, IPFS, and zk-SNARK 
                functionality is simulated in-browser for educational purposes.
              </p>
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span>Block Height: <span className="text-primary font-mono">{stats.currentBlockNumber}</span></span>
                <span>Success Rate: <span className="text-success font-mono">
                  {stats.totalVerifications > 0 
                    ? Math.round((stats.successfulVerifications / stats.totalVerifications) * 100)
                    : 100}%
                </span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
