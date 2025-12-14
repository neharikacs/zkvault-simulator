/**
 * Dashboard Layout Component
 * 
 * Provides consistent layout structure for all dashboard pages
 * with sidebar navigation and header
 */

import React, { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Shield,
  FileCheck,
  Upload,
  Search,
  Users,
  Activity,
  LogOut,
  Home,
  Settings,
  BarChart3,
  FileX,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: ('issuer' | 'verifier' | 'admin')[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: Home, roles: ['issuer', 'verifier', 'admin'] },
  { label: 'Issue Certificate', path: '/issue', icon: Upload, roles: ['issuer', 'admin'] },
  { label: 'Verify Certificate', path: '/verify', icon: Search, roles: ['verifier', 'admin'] },
  { label: 'All Certificates', path: '/certificates', icon: FileCheck, roles: ['admin'] },
  { label: 'Revoke Certificate', path: '/revoke', icon: FileX, roles: ['admin'] },
  { label: 'Manage Users', path: '/users', icon: Users, roles: ['admin'] },
  { label: 'System Activity', path: '/activity', icon: Activity, roles: ['admin'] },
  { label: 'Results & Charts', path: '/results', icon: BarChart3, roles: ['issuer', 'verifier', 'admin'] },
  { label: 'Wallet Settings', path: '/wallet-settings', icon: Settings, roles: ['issuer', 'admin'] },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  const filteredNavItems = navItems.filter(item => 
    user && item.roles.includes(user.role)
  );
  
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'issuer': return 'bg-primary/20 text-primary border-primary/30';
      case 'verifier': return 'bg-success/20 text-success border-success/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };
  
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">ZK-Vault</h1>
              <p className="text-xs text-muted-foreground">Certificate System</p>
            </div>
          </Link>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary border border-sidebar-primary/20"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "text-sidebar-primary")} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        {/* User Section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-sm font-semibold text-sidebar-foreground">
                {user?.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.name}
              </p>
              <span className={cn(
                "inline-block px-2 py-0.5 text-xs rounded-full border capitalize",
                getRoleBadgeColor(user?.role || '')
              )}>
                {user?.role}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
