import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AccountStatus = 'pending' | 'active' | 'inactive';

interface UserWithProfile {
  user_id: string;
  email: string;
  display_name: string | null;
  store_name: string;
  account_status: AccountStatus;
  maintenance_monthly_price_cop: number;
  created_at: string;
  total_customers: number;
  total_debt: number;
}

interface GlobalStats {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  inactiveUsers: number;
  totalDebtAllStores: number;
  monthlyPaymentsReceived: number;
}

interface MaintenanceInvoice {
  id: string;
  user_id: string;
  period_ym: string;
  amount_cop: number;
  status: 'open' | 'paid' | 'overdue' | 'inactive';
  due_at: string;
  grace_until: string;
  paid_at: string | null;
  store_name?: string;
}

export const useAdminData = () => {
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [invoices, setInvoices] = useState<MaintenanceInvoice[]>([]);
  const [stats, setStats] = useState<GlobalStats>({
    totalUsers: 0,
    activeUsers: 0,
    pendingUsers: 0,
    inactiveUsers: 0,
    totalDebtAllStores: 0,
    monthlyPaymentsReceived: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      // Fetch all profiles with customer data
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Fetch all customers to calculate totals
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('owner_id, total_debt');

      if (customersError) throw customersError;

      // Fetch current month invoices
      const currentPeriod = new Date().toISOString().slice(0, 7);
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('maintenance_invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (invoicesError) throw invoicesError;

      // Fetch emails for each user using the secure function
      const emailPromises = (profiles || []).map(async (p) => {
        const { data } = await supabase.rpc('get_user_email_for_admin', { 
          target_user_id: p.user_id 
        });
        return { user_id: p.user_id, email: data as string | null };
      });
      const emailResults = await Promise.all(emailPromises);
      const emailMap = emailResults.reduce((acc, { user_id, email }) => {
        acc[user_id] = email;
        return acc;
      }, {} as Record<string, string | null>);

      // Aggregate customer data per owner
      const customersByOwner = customers?.reduce((acc, c) => {
        if (!acc[c.owner_id]) {
          acc[c.owner_id] = { count: 0, debt: 0 };
        }
        acc[c.owner_id].count++;
        acc[c.owner_id].debt += Number(c.total_debt);
        return acc;
      }, {} as Record<string, { count: number; debt: number }>);

      // Build users list with real email data
      const usersData: UserWithProfile[] = (profiles || []).map(p => ({
        user_id: p.user_id,
        email: emailMap[p.user_id] || 'Email no disponible',
        display_name: p.display_name || null,
        store_name: p.store_name,
        account_status: p.account_status as AccountStatus,
        maintenance_monthly_price_cop: Number(p.maintenance_monthly_price_cop),
        created_at: p.created_at,
        total_customers: customersByOwner?.[p.user_id]?.count || 0,
        total_debt: customersByOwner?.[p.user_id]?.debt || 0,
      }));

      setUsers(usersData);

      // Calculate stats
      const activeUsers = usersData.filter(u => u.account_status === 'active').length;
      const pendingUsers = usersData.filter(u => u.account_status === 'pending').length;
      const inactiveUsers = usersData.filter(u => u.account_status === 'inactive').length;
      const totalDebt = usersData.reduce((sum, u) => sum + u.total_debt, 0);

      // Calculate monthly payments
      const currentMonthInvoices = invoicesData?.filter(
        i => i.period_ym === currentPeriod && i.status === 'paid'
      ) || [];
      const monthlyPayments = currentMonthInvoices.reduce((sum, i) => sum + Number(i.amount_cop), 0);

      setStats({
        totalUsers: usersData.length,
        activeUsers,
        pendingUsers,
        inactiveUsers,
        totalDebtAllStores: totalDebt,
        monthlyPaymentsReceived: monthlyPayments,
      });

      // Add store names to invoices
      const invoicesWithNames = (invoicesData || []).map(inv => ({
        ...inv,
        status: inv.status as 'open' | 'paid' | 'overdue' | 'inactive',
        store_name: profiles?.find(p => p.user_id === inv.user_id)?.store_name || 'Desconocido',
      }));
      setInvoices(invoicesWithNames);

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateAccountStatus = async (userId: string, newStatus: AccountStatus) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ account_status: newStatus })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => 
        u.user_id === userId ? { ...u, account_status: newStatus } : u
      ));

      // Update stats
      setStats(prev => {
        const oldUser = users.find(u => u.user_id === userId);
        if (!oldUser) return prev;

        const newStats = { ...prev };
        
        // Decrement old status
        if (oldUser.account_status === 'active') newStats.activeUsers--;
        else if (oldUser.account_status === 'pending') newStats.pendingUsers--;
        else if (oldUser.account_status === 'inactive') newStats.inactiveUsers--;

        // Increment new status
        if (newStatus === 'active') newStats.activeUsers++;
        else if (newStatus === 'pending') newStats.pendingUsers++;
        else if (newStatus === 'inactive') newStats.inactiveUsers++;

        return newStats;
      });

      toast.success(`Usuario ${newStatus === 'active' ? 'activado' : newStatus === 'inactive' ? 'desactivado' : 'puesto en espera'}`);
    } catch (error) {
      console.error('Error updating account status:', error);
      toast.error('Error al actualizar estado');
    }
  };

  const registerPayment = async (invoiceId: string) => {
    try {
      const { error } = await supabase
        .from('maintenance_invoices')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);

      if (error) throw error;

      // Also ensure the user's account is active
      const invoice = invoices.find(i => i.id === invoiceId);
      if (invoice) {
        await supabase
          .from('profiles')
          .update({ 
            account_status: 'active',
            last_maintenance_paid_at: new Date().toISOString(),
          })
          .eq('user_id', invoice.user_id);

        // Update local state
        setInvoices(prev => prev.map(i => 
          i.id === invoiceId ? { ...i, status: 'paid' as const, paid_at: new Date().toISOString() } : i
        ));
        
        setUsers(prev => prev.map(u => 
          u.user_id === invoice.user_id ? { ...u, account_status: 'active' as AccountStatus } : u
        ));
      }

      await fetchData(); // Refresh to update stats
      toast.success('Pago registrado correctamente');
    } catch (error) {
      console.error('Error registering payment:', error);
      toast.error('Error al registrar pago');
    }
  };

  const updateMaintenancePrice = async (userId: string, price: number) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ maintenance_monthly_price_cop: price })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => 
        u.user_id === userId ? { ...u, maintenance_monthly_price_cop: price } : u
      ));

      toast.success('Precio actualizado');
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error('Error al actualizar precio');
    }
  };

  return {
    users,
    invoices,
    stats,
    loading,
    updateAccountStatus,
    registerPayment,
    updateMaintenancePrice,
    refetch: fetchData,
  };
};
