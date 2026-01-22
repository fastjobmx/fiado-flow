import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type AccountStatus = 'pending' | 'active' | 'inactive';

interface MaintenanceInvoice {
  id: string;
  period_ym: string;
  amount_cop: number;
  status: 'open' | 'paid' | 'overdue' | 'inactive';
  due_at: string;
  grace_until: string;
  paid_at: string | null;
}

interface AccountStatusData {
  status: AccountStatus | null;
  currentInvoice: MaintenanceInvoice | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

export const useAccountStatus = (): AccountStatusData => {
  const { user } = useAuth();
  const [status, setStatus] = useState<AccountStatus | null>(null);
  const [currentInvoice, setCurrentInvoice] = useState<MaintenanceInvoice | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    if (!user) {
      setStatus(null);
      setCurrentInvoice(null);
      setLoading(false);
      return;
    }
    
    try {
      // Get profile status
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('account_status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      
      setStatus(profile?.account_status as AccountStatus || 'pending');

      // Get current month's invoice
      const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
      const { data: invoice, error: invoiceError } = await supabase
        .from('maintenance_invoices')
        .select('*')
        .eq('user_id', user.id)
        .eq('period_ym', currentPeriod)
        .maybeSingle();

      if (invoiceError) throw invoiceError;
      
      setCurrentInvoice(invoice as MaintenanceInvoice | null);
    } catch (error) {
      console.error('Error fetching account status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [user]);

  return {
    status,
    currentInvoice,
    loading,
    refetch: fetchStatus,
  };
};
