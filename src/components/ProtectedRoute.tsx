import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAccountStatus } from '@/hooks/useAccountStatus';
import { useUserRole } from '@/hooks/useUserRole';
import { InactiveAccountScreen } from '@/components/InactiveAccountScreen';
import { PendingAccountScreen } from '@/components/PendingAccountScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { status, loading: statusLoading } = useAccountStatus();
  const { isAdmin, loading: roleLoading } = useUserRole();

  const loading = authLoading || statusLoading || roleLoading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Admins bypass account status checks
  if (isAdmin) {
    return <>{children}</>;
  }

  // Check account status for regular users
  if (status === 'inactive') {
    return <InactiveAccountScreen />;
  }

  if (status === 'pending') {
    return <PendingAccountScreen />;
  }

  return <>{children}</>;
};
