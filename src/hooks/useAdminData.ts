import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AccountStatus = 'pending' | 'active' | 'inactive' | 'trial' | 'soon' | 'overdue' | 'suspended' | 'free' | 'cancelled' | 'exonerated';

export type AppPlan = 'Gratis' | 'Tendero' | 'Pro' | 'Plus' | 'Personalizado';

interface UserWithProfile {
  user_id: string;
  email: string;
  display_name: string | null;
  store_name: string;
  account_status: AccountStatus;
  maintenance_monthly_price_cop: number;
  plan: AppPlan;
  created_at: string;
  total_customers: number;
  total_debt: number;
  last_login: string | null;
  next_maintenance_due_at: string | null;
  phone: string | null;
}

interface GlobalStats {
  totalUsers: number;
  activeUsers: number;
  overdueUsers: number;
  expectedMonthlyIncome: number;
  collectedMonthlyIncome: number;
  maintenanceBalance: number;
  totalFiadoRegistered: number;
}

interface MaintenanceInvoice {
  id: string;
  user_id: string;
  period_ym: string;
  amount_cop: number;
  status: 'open' | 'paid' | 'overdue' | 'inactive' | 'exonerated';
  due_at: string;
  grace_until: string;
  paid_at: string | null;
  store_name?: string;
  method?: string;
  plan?: AppPlan;
}

const getPlanByPrice = (price: number): AppPlan => {
  if (price === 0) return 'Gratis';
  if (price === 14900) return 'Tendero';
  if (price === 29900) return 'Pro';
  if (price === 49900) return 'Plus';
  return 'Personalizado';
};

export const useAdminData = () => {
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [invoices, setInvoices] = useState<MaintenanceInvoice[]>([]);
  const [stats, setStats] = useState<GlobalStats>({
    totalUsers: 0,
    activeUsers: 0,
    overdueUsers: 0,
    expectedMonthlyIncome: 0,
    collectedMonthlyIncome: 0,
    maintenanceBalance: 0,
    totalFiadoRegistered: 0,
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
        const usersData: UserWithProfile[] = (profiles || []).map(p => {
          const price = Number(p.maintenance_monthly_price_cop);
          const email = emailMap[p.user_id] || 'Email no disponible';
          
          // Debug log to see what data we're getting
          console.log(`User ${p.user_id} profile data:`, {
            display_name: p.display_name,
            whatsapp: p.whatsapp_number,
            store_name: p.store_name,
            email: email
          });

          return {
            user_id: p.user_id,
            email: email,
            // Fallback for display_name: use profile name, or email prefix
            display_name: p.display_name || (email !== 'Email no disponible' ? email.split('@')[0] : null),
            store_name: p.store_name,
            account_status: p.account_status as AccountStatus,
            maintenance_monthly_price_cop: price,
            plan: getPlanByPrice(price),
            created_at: p.created_at,
            total_customers: customersByOwner?.[p.user_id]?.count || 0,
            total_debt: customersByOwner?.[p.user_id]?.debt || 0,
            last_login: p.updated_at, // Using updated_at as proxy for last access if not explicitly tracked
            next_maintenance_due_at: p.next_maintenance_due_at,
            phone: p.whatsapp_number,
          };
        });

      setUsers(usersData);

      // Calculate stats
      const totalFiado = usersData.reduce((sum, u) => sum + u.total_debt, 0);
      
      const currentMonthInvoices = invoicesData?.filter(
        i => i.period_ym === currentPeriod
      ) || [];
      
      const collectedIncome = currentMonthInvoices
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + Number(i.amount_cop), 0);
        
      const maintenanceBalance = (invoicesData || [])
        .filter(i => (i.status === 'overdue' || i.status === 'open') && Number(i.amount_cop) > 0)
        .reduce((sum, i) => sum + Number(i.amount_cop), 0);

      const activeUsersCount = usersData.filter(u => 
        u.account_status === 'active' || u.account_status === 'trial' || u.account_status === 'exonerated'
      ).length;

      const overdueUsersCount = (invoicesData || []).filter(i => 
        i.status === 'overdue' && Number(i.amount_cop) > 0
      ).reduce((acc, inv) => {
        if (!acc.includes(inv.user_id)) acc.push(inv.user_id);
        return acc;
      }, [] as string[]).length;

      const expectedIncome = usersData
        .filter(u => 
          u.maintenance_monthly_price_cop > 0 && 
          u.account_status !== 'suspended' && 
          u.account_status !== 'inactive' && 
          u.account_status !== 'cancelled'
        )
        .reduce((sum, u) => sum + u.maintenance_monthly_price_cop, 0);

      setStats({
        totalUsers: usersData.length,
        activeUsers: activeUsersCount,
        overdueUsers: overdueUsersCount,
        expectedMonthlyIncome: expectedIncome,
        collectedMonthlyIncome: collectedIncome,
        maintenanceBalance: maintenanceBalance,
        totalFiadoRegistered: totalFiado,
      });

      // Add store names and plans to invoices
      const invoicesWithNames = (invoicesData || []).map(inv => {
        const user = usersData.find(u => u.user_id === inv.user_id);
        return {
          ...inv,
          status: inv.status as any,
          store_name: user?.store_name || 'Tienda por registrar',
          plan: user?.plan || 'Gratis',
          method: inv.paid_at ? 'Transferencia' : undefined, // Placeholder for method
        };
      });
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
      // Map extended statuses to DB supported statuses
      let dbStatus: 'active' | 'inactive' | 'pending' = 'active';
      if (newStatus === 'inactive' || newStatus === 'suspended' || newStatus === 'cancelled') {
        dbStatus = 'inactive';
      } else if (newStatus === 'pending') {
        dbStatus = 'pending';
      }

      const { error } = await supabase
        .from('profiles')
        .update({ account_status: dbStatus })
        .eq('user_id', userId);

      if (error) throw error;

      // Update local state
      setUsers(prev => prev.map(u => 
        u.user_id === userId ? { ...u, account_status: newStatus } : u
      ));

      // Refresh data to keep everything in sync (stats, etc)
      await fetchData();

      const statusLabels: Record<string, string> = {
        active: 'activado',
        inactive: 'desactivado',
        suspended: 'suspendido',
        pending: 'puesto en espera',
        cancelled: 'cancelado'
      };

      toast.success(`Usuario ${statusLabels[newStatus] || 'actualizado'}`);
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

  const deleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta tienda? Esta acción no se puede deshacer y se borrarán todos sus datos.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(prev => prev.filter(u => u.user_id !== userId));
      setInvoices(prev => prev.filter(i => i.user_id !== userId));
      
      toast.success('Tienda eliminada permanentemente');
      await fetchData();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Error al eliminar la tienda');
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
    deleteUser,
    refetch: fetchData,
  };
};
