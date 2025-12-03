/**
 * Manage Users Page (Admin Only)
 * 
 * Admin functionality to:
 * - View all users
 * - Suspend/activate users
 * - View user activity
 */

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth, User } from '@/lib/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Users,
  User as UserIcon,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Building,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function UsersPage() {
  const { getAllUsers, suspendUser, activateUser, user: currentUser } = useAuth();
  const [, forceUpdate] = React.useState({});
  
  const users = getAllUsers();
  
  const handleToggleStatus = (userId: string, isActive: boolean) => {
    if (userId === currentUser?.id) {
      toast.error("You cannot suspend your own account");
      return;
    }
    
    if (isActive) {
      suspendUser(userId);
      toast.success('User suspended');
    } else {
      activateUser(userId);
      toast.success('User activated');
    }
    forceUpdate({});
  };
  
  const getRoleBadgeConfig = (role: string) => {
    switch (role) {
      case 'admin':
        return { bg: 'bg-destructive/10', color: 'text-destructive', label: 'Admin' };
      case 'issuer':
        return { bg: 'bg-primary/10', color: 'text-primary', label: 'Issuer' };
      case 'verifier':
        return { bg: 'bg-success/10', color: 'text-success', label: 'Verifier' };
      default:
        return { bg: 'bg-muted', color: 'text-muted-foreground', label: role };
    }
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manage Users</h1>
          <p className="text-muted-foreground mt-1">
            View and manage user accounts
          </p>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{users.length}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
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
                  {users.filter(u => u.isActive).length}
                </p>
                <p className="text-xs text-muted-foreground">Active</p>
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
                  {users.filter(u => !u.isActive).length}
                </p>
                <p className="text-xs text-muted-foreground">Suspended</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Users List */}
        <div className="p-6 rounded-xl bg-card border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">All Users</h2>
          
          <div className="space-y-3">
            {users.map((user) => {
              const roleConfig = getRoleBadgeConfig(user.role);
              
              return (
                <div
                  key={user.id}
                  className={cn(
                    "p-4 rounded-lg border transition-all",
                    user.isActive
                      ? "bg-secondary/30 border-border"
                      : "bg-destructive/5 border-destructive/20"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center",
                        user.isActive ? "bg-secondary" : "bg-destructive/10"
                      )}>
                        <UserIcon className={cn(
                          "w-6 h-6",
                          user.isActive ? "text-foreground" : "text-destructive"
                        )} />
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium text-foreground">{user.name}</h3>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            roleConfig.bg, roleConfig.color
                          )}>
                            {roleConfig.label}
                          </span>
                          {!user.isActive && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                              Suspended
                            </span>
                          )}
                          {user.id === currentUser?.id && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              You
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </span>
                          {user.organization && (
                            <span className="flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              {user.organization}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Last login: {new Date(user.lastLogin).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {user.id !== currentUser?.id && (
                        <Button
                          variant={user.isActive ? "destructive" : "success"}
                          size="sm"
                          onClick={() => handleToggleStatus(user.id, user.isActive)}
                          className={user.isActive ? "" : "bg-success text-success-foreground hover:bg-success/90"}
                        >
                          {user.isActive ? (
                            <>
                              <XCircle className="w-4 h-4" />
                              Suspend
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Activate
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* RBAC Info */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/20">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Role-Based Access Control (RBAC)
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium text-primary mb-1">Issuer</p>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Upload certificates</li>
                    <li>• Generate proofs</li>
                    <li>• View own certificates</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-success mb-1">Verifier</p>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Verify certificates</li>
                    <li>• Check proofs</li>
                    <li>• View verification history</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-destructive mb-1">Admin</p>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• All permissions</li>
                    <li>• Manage users</li>
                    <li>• Revoke certificates</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
