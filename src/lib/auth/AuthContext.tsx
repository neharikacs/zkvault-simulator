/**
 * RBAC (Role-Based Access Control) AUTHENTICATION CONTEXT
 * 
 * This module implements role-based access control using Supabase Auth.
 * 
 * Roles:
 * - ISSUER: Can upload certificates, generate CID, hash, ZKP proof
 * - VERIFIER: Can verify certificates using hash + ZKP proof + CID
 * - ADMIN: Full system access - view all certificates, revoke, suspend, manage users
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

/**
 * User roles as defined in the RBAC specification
 */
export type UserRole = 'issuer' | 'verifier' | 'admin';

/**
 * User account structure
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organization?: string;
  createdAt: Date;
  lastLogin: Date;
  isActive: boolean;
}

/**
 * Role permissions matrix
 */
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  issuer: [
    'certificate:create',
    'certificate:view_own',
    'proof:generate',
    'ipfs:store',
  ],
  verifier: [
    'certificate:verify',
    'verification:create',
    'verification:view_own',
  ],
  admin: [
    'certificate:create',
    'certificate:view_all',
    'certificate:revoke',
    'certificate:suspend',
    'certificate:reinstate',
    'proof:generate',
    'proof:verify',
    'ipfs:store',
    'ipfs:view_all',
    'verification:view_all',
    'user:manage',
    'system:view_stats',
  ],
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signup: (email: string, password: string, name: string, organization?: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  getAllUsers: () => Promise<User[]>;
  updateUserRole: (userId: string, role: UserRole) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetch user profile and role from database
   */
  const fetchUserProfile = useCallback(async (supabaseUser: SupabaseUser): Promise<User | null> => {
    try {
      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', supabaseUser.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return null;
      }

      // Fetch role using the database function
      const { data: roleData, error: roleError } = await supabase
        .rpc('get_user_role', { _user_id: supabaseUser.id });

      if (roleError) {
        console.error('Error fetching role:', roleError);
        return null;
      }

      const role = (roleData as UserRole) || 'verifier';

      return {
        id: supabaseUser.id,
        email: profile.email,
        name: profile.name,
        role,
        organization: profile.organization,
        createdAt: new Date(profile.created_at),
        lastLogin: new Date(),
        isActive: true,
      };
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  }, []);

  /**
   * Initialize auth state and listen for changes
   */
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event);
        
        if (session?.user) {
          // Use setTimeout to avoid potential race conditions
          setTimeout(async () => {
            const userProfile = await fetchUserProfile(session.user);
            setUser(userProfile);
            setIsLoading(false);
          }, 0);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const userProfile = await fetchUserProfile(session.user);
        setUser(userProfile);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  /**
   * Login with email and password
   */
  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, message: error.message };
      }

      if (data.user) {
        const userProfile = await fetchUserProfile(data.user);
        if (userProfile) {
          setUser(userProfile);
          return { success: true, message: `Welcome, ${userProfile.name}` };
        }
      }

      return { success: false, message: 'Failed to load user profile' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'An unexpected error occurred' };
    }
  }, [fetchUserProfile]);

  /**
   * Sign up with email and password
   */
  const signup = useCallback(async (
    email: string, 
    password: string, 
    name: string, 
    organization?: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            name,
            organization,
          },
        },
      });

      if (error) {
        return { success: false, message: error.message };
      }

      if (data.user) {
        // Update profile with organization if provided
        if (organization) {
          await supabase
            .from('profiles')
            .update({ organization, name })
            .eq('user_id', data.user.id);
        }

        return { success: true, message: 'Account created successfully! You can now sign in.' };
      }

      return { success: false, message: 'Failed to create account' };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, message: 'An unexpected error occurred' };
    }
  }, []);

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  /**
   * Check if current user has a specific permission
   */
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    return ROLE_PERMISSIONS[user.role].includes(permission);
  }, [user]);

  /**
   * Get all users (admin only)
   */
  const getAllUsers = useCallback(async (): Promise<User[]> => {
    if (!user || user.role !== 'admin') {
      return [];
    }

    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.error('Error fetching users:', error);
        return [];
      }

      // Fetch roles for all users
      const users: User[] = await Promise.all(
        profiles.map(async (profile) => {
          const { data: roleData } = await supabase
            .rpc('get_user_role', { _user_id: profile.user_id });

          return {
            id: profile.user_id,
            email: profile.email,
            name: profile.name,
            role: (roleData as UserRole) || 'verifier',
            organization: profile.organization,
            createdAt: new Date(profile.created_at),
            lastLogin: new Date(profile.updated_at),
            isActive: true,
          };
        })
      );

      return users;
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      return [];
    }
  }, [user]);

  /**
   * Update user role (admin only)
   */
  const updateUserRole = useCallback(async (
    userId: string, 
    role: UserRole
  ): Promise<{ success: boolean; message: string }> => {
    if (!user || user.role !== 'admin') {
      return { success: false, message: 'Unauthorized' };
    }

    try {
      // Delete existing roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (error) {
        return { success: false, message: error.message };
      }

      return { success: true, message: 'Role updated successfully' };
    } catch (error) {
      console.error('Error updating role:', error);
      return { success: false, message: 'Failed to update role' };
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      signup,
      logout,
      hasPermission,
      getAllUsers,
      updateUserRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Higher-order component for role-based route protection
 */
export function RequireRole({ children, roles }: { children: ReactNode; roles: UserRole[] }) {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated || !user) {
    return null;
  }
  
  if (!roles.includes(user.role)) {
    return null;
  }
  
  return <>{children}</>;
}
