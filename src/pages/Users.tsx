/**
 * Manage Users Page (Admin Only)
 * 
 * Admin functionality to:
 * - View all users
 * - Update user roles
 */

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth, User, UserRole } from '@/lib/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  User as UserIcon,
  Shield,
  CheckCircle,
  Clock,
  Mail,
  Building,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function UsersPage() {
  const { getAllUsers, updateUserRole, user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingRoles, setUpdatingRoles] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    const fetchedUsers = await getAllUsers();
    setUsers(fetchedUsers);
    setIsLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (userId === currentUser?.id) {
      toast.error("You cannot change your own role");
      return;
    }

    setUpdatingRoles(prev => ({ ...prev, [userId]: true }));
    
    const result = await updateUserRole(userId, newRole);
    
    setUpdatingRoles(prev => ({ ...prev, [userId]: false }));

    if (result.success) {
      toast.success(`Role updated to ${newRole}`);
      // Reload users to get updated data
      await loadUsers();
    } else {
      toast.error(result.message);
    }
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

  const activeUsers = users.filter(u => u.isActive);
  const suspendedUsers = users.filter(u => !u.isActive);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manage Users</h1>
          <p className="text-muted-foreground mt-1">
            View and manage user accounts and roles
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
                <p className="text-2xl font-bold text-foreground">
                  {isLoading ? '-' : users.length}
                </p>
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
                  {isLoading ? '-' : activeUsers.length}
                </p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Shield className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {isLoading ? '-' : users.filter(u => u.role === 'admin').length}
                </p>
                <p className="text-xs text-muted-foreground">Admins</p>
              </div>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="p-6 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">All Users</h2>
            <Button variant="outline" size="sm" onClick={loadUsers} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Refresh'
              )}
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No users found
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => {
                const roleConfig = getRoleBadgeConfig(user.role);
                const isUpdating = updatingRoles[user.id];

                return (
                  <div
                    key={user.id}
                    className="p-4 rounded-lg border bg-secondary/30 border-border"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-secondary">
                          <UserIcon className="w-6 h-6 text-foreground" />
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
                              Joined: {new Date(user.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {user.id !== currentUser?.id && (
                        <div className="flex items-center gap-2">
                          <Select
                            value={user.role}
                            onValueChange={(value: UserRole) => handleRoleChange(user.id, value)}
                            disabled={isUpdating}
                          >
                            <SelectTrigger className="w-32">
                              {isUpdating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <SelectValue />
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="verifier">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-success" />
                                  Verifier
                                </div>
                              </SelectItem>
                              <SelectItem value="issuer">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-primary" />
                                  Issuer
                                </div>
                              </SelectItem>
                              <SelectItem value="admin">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-destructive" />
                                  Admin
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
