/**
 * Login Page
 * 
 * RBAC authentication page for:
 * - Issuer
 * - Verifier  
 * - Admin
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Mail, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const result = await login(email, password);
    
    setIsLoading(false);
    
    if (result.success) {
      toast.success(result.message);
      navigate('/dashboard');
    } else {
      toast.error(result.message);
    }
  };
  
  const quickLogin = async (role: 'issuer' | 'verifier' | 'admin') => {
    const credentials = {
      issuer: 'issuer@university.edu',
      verifier: 'verifier@company.com',
      admin: 'admin@zkvault.io',
    };
    
    setEmail(credentials[role]);
    setPassword('password');
    setIsLoading(true);
    
    const result = await login(credentials[role], 'password');
    
    setIsLoading(false);
    
    if (result.success) {
      toast.success(result.message);
      navigate('/dashboard');
    } else {
      toast.error(result.message);
    }
  };
  
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 xl:px-24">
        <div className="max-w-md w-full mx-auto">
          {/* Back Link */}
          <Link 
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Shield className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">ZK-Vault</h1>
              <p className="text-sm text-muted-foreground">Certificate System</p>
            </div>
          </div>
          
          {/* Form */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Sign in to your account
            </h2>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access the dashboard
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              variant="glow" 
              className="w-full" 
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
          
          {/* Quick Login */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Quick demo login
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => quickLogin('issuer')}
                disabled={isLoading}
              >
                Issuer
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => quickLogin('verifier')}
                disabled={isLoading}
              >
                Verifier
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => quickLogin('admin')}
                disabled={isLoading}
              >
                Admin
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Side - Visual */}
      <div className="hidden lg:flex flex-1 bg-card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent-foreground/20 rounded-full blur-3xl"></div>
        
        <div className="relative flex flex-col items-center justify-center p-12 text-center">
          <div className="w-24 h-24 rounded-2xl bg-gradient-primary flex items-center justify-center mb-8 shadow-lg shadow-primary/30">
            <Shield className="w-14 h-14 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Secure Certificate Verification
          </h2>
          <p className="text-muted-foreground max-w-md">
            Using zero-knowledge proofs to verify credentials while maintaining 
            privacy through selective attribute disclosure.
          </p>
          
          {/* Feature List */}
          <div className="mt-12 space-y-4 text-left">
            {[
              'SHA-256 hash integrity',
              'zk-SNARK selective disclosure',
              'IPFS distributed storage',
              'Blockchain immutability',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span className="text-sm text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
