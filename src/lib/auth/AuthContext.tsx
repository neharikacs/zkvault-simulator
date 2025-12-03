/**
 * RBAC (Role-Based Access Control) AUTHENTICATION CONTEXT
 * 
 * This module implements the role-based access control system
 * for ZK-Vault as described in the research paper.
 * 
 * Roles:
 * - ISSUER: Can upload certificates, generate CID, hash, ZKP proof
 * - VERIFIER: Can verify certificates using hash + ZKP proof + CID
 * - ADMIN: Full system access - view all certificates, revoke, suspend, manage users
 * 
 * This is a simulated authentication system for demonstration purposes.
 * In production, this would integrate with proper authentication services.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

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

/**
 * Demo users for the simulation
 */
const DEMO_USERS: User[] = [
  {
    id: 'issuer_001',
    email: 'issuer@university.edu',
    name: 'Dr. Sarah Johnson',
    role: 'issuer',
    organization: 'State University',
    createdAt: new Date('2024-01-15'),
    lastLogin: new Date(),
    isActive: true,
  },
  {
    id: 'verifier_001',
    email: 'verifier@company.com',
    name: 'Mike Chen',
    role: 'verifier',
    organization: 'TechCorp HR',
    createdAt: new Date('2024-02-20'),
    lastLogin: new Date(),
    isActive: true,
  },
  {
    id: 'admin_001',
    email: 'admin@zkvault.io',
    name: 'Admin User',
    role: 'admin',
    organization: 'ZK-Vault',
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date(),
    isActive: true,
  },
];

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  getAllUsers: () => User[];
  suspendUser: (userId: string) => void;
  activateUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(DEMO_USERS);
  
  /**
   * Simulated login function
   * 
   * For demo purposes, accepts these credentials:
   * - issuer@university.edu / password -> Issuer role
   * - verifier@company.com / password -> Verifier role
   * - admin@zkvault.io / password -> Admin role
   */
  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // For demo, password is always "password"
    if (password !== 'password') {
      return { success: false, message: 'Invalid credentials' };
    }
    
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!foundUser) {
      return { success: false, message: 'User not found' };
    }
    
    if (!foundUser.isActive) {
      return { success: false, message: 'Account is suspended' };
    }
    
    // Update last login
    const updatedUser = { ...foundUser, lastLogin: new Date() };
    setUsers(prev => prev.map(u => u.id === foundUser.id ? updatedUser : u));
    setUser(updatedUser);
    
    return { success: true, message: `Welcome, ${foundUser.name}` };
  }, [users]);
  
  const logout = useCallback(() => {
    setUser(null);
  }, []);
  
  /**
   * Check if current user has a specific permission
   */
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    return ROLE_PERMISSIONS[user.role].includes(permission);
  }, [user]);
  
  const getAllUsers = useCallback(() => users, [users]);
  
  const suspendUser = useCallback((userId: string) => {
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, isActive: false } : u
    ));
  }, []);
  
  const activateUser = useCallback((userId: string) => {
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, isActive: true } : u
    ));
  }, []);
  
  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout,
      hasPermission,
      getAllUsers,
      suspendUser,
      activateUser,
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
