import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth/AuthContext";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import IssueCertificate from "./pages/IssueCertificate";
import VerifyCertificate from "./pages/VerifyCertificate";
import Certificates from "./pages/Certificates";
import RevokeCertificate from "./pages/RevokeCertificate";
import UsersPage from "./pages/Users";
import ActivityPage from "./pages/Activity";
import Results from "./pages/Results";
import WalletSettings from "./pages/WalletSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route wrapper
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  
  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Landing />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/issue" element={<ProtectedRoute allowedRoles={['issuer', 'admin']}><IssueCertificate /></ProtectedRoute>} />
      <Route path="/verify" element={<ProtectedRoute allowedRoles={['verifier', 'admin']}><VerifyCertificate /></ProtectedRoute>} />
      <Route path="/certificates" element={<ProtectedRoute allowedRoles={['admin']}><Certificates /></ProtectedRoute>} />
      <Route path="/revoke" element={<ProtectedRoute allowedRoles={['admin']}><RevokeCertificate /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute allowedRoles={['admin']}><UsersPage /></ProtectedRoute>} />
      <Route path="/activity" element={<ProtectedRoute allowedRoles={['admin']}><ActivityPage /></ProtectedRoute>} />
      <Route path="/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
      <Route path="/wallet-settings" element={<ProtectedRoute allowedRoles={['issuer', 'admin']}><WalletSettings /></ProtectedRoute>} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
