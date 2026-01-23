import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Customer, Transaction } from '@/types/fiado';
import { useToast } from '@/hooks/use-toast';

export const useFiados = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!user) {
      setCustomers([]);
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (customersError) throw customersError;

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (transactionsError) throw transactionsError;

      // Map to local types
      const mappedCustomers: Customer[] = (customersData || []).map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        totalDebt: Number(c.total_debt),
        lastPaymentDate: c.last_payment_date ? new Date(c.last_payment_date) : null,
        createdAt: new Date(c.created_at),
      }));

      const mappedTransactions: Transaction[] = (transactionsData || []).map((t) => ({
        id: t.id,
        customerId: t.customer_id,
        type: t.type as 'debt' | 'payment',
        amount: Number(t.amount),
        description: t.description || '',
        date: new Date(t.created_at),
      }));

      setCustomers(mappedCustomers);
      setTransactions(mappedTransactions);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addCustomer = async (name: string, phone: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          owner_id: user.id,
          name,
          phone,
          total_debt: 0,
        })
        .select()
        .single();

      if (error) throw error;

      const newCustomer: Customer = {
        id: data.id,
        name: data.name,
        phone: data.phone,
        totalDebt: 0,
        lastPaymentDate: null,
        createdAt: new Date(data.created_at),
      };

      setCustomers((prev) => [newCustomer, ...prev]);
      return newCustomer;
    } catch (error) {
      console.error('Error adding customer:', error);
      toast({
        title: 'Error',
        description: 'No se pudo agregar el cliente',
        variant: 'destructive',
      });
      return null;
    }
  };

  const addDebt = async (customerId: string, amount: number, description: string) => {
    if (!user) return;

    try {
      // Insert transaction
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          customer_id: customerId,
          owner_id: user.id,
          type: 'debt',
          amount,
          description,
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Update customer total_debt
      const customer = customers.find((c) => c.id === customerId);
      if (!customer) return;

      const newDebt = customer.totalDebt + amount;

      const { error: updateError } = await supabase
        .from('customers')
        .update({ total_debt: newDebt })
        .eq('id', customerId);

      if (updateError) throw updateError;

      // Update local state
      const newTransaction: Transaction = {
        id: transactionData.id,
        customerId,
        type: 'debt',
        amount,
        description,
        date: new Date(transactionData.created_at),
      };

      setTransactions((prev) => [newTransaction, ...prev]);
      setCustomers((prev) =>
        prev.map((c) => (c.id === customerId ? { ...c, totalDebt: newDebt } : c))
      );
    } catch (error) {
      console.error('Error adding debt:', error);
      toast({
        title: 'Error',
        description: 'No se pudo agregar la deuda',
        variant: 'destructive',
      });
    }
  };

  const addPayment = async (customerId: string, amount: number, description: string) => {
    if (!user) return null;

    try {
      // Insert transaction
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          customer_id: customerId,
          owner_id: user.id,
          type: 'payment',
          amount,
          description,
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Update customer
      const customer = customers.find((c) => c.id === customerId);
      if (!customer) return null;

      const newDebt = Math.max(0, customer.totalDebt - amount);
      const now = new Date();

      const { error: updateError } = await supabase
        .from('customers')
        .update({
          total_debt: newDebt,
          last_payment_date: now.toISOString(),
        })
        .eq('id', customerId);

      if (updateError) throw updateError;

      // Update local state
      const newTransaction: Transaction = {
        id: transactionData.id,
        customerId,
        type: 'payment',
        amount,
        description,
        date: new Date(transactionData.created_at),
      };

      setTransactions((prev) => [newTransaction, ...prev]);
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId ? { ...c, totalDebt: newDebt, lastPaymentDate: now } : c
        )
      );
    } catch (error) {
      console.error('Error adding payment:', error);
      toast({
        title: 'Error',
        description: 'No se pudo registrar el pago',
        variant: 'destructive',
      });
      return null;
    }
  };

  const getTotalDebt = () => {
    return customers.reduce((sum, c) => sum + c.totalDebt, 0);
  };

  const getOverdueCustomers = (days: number = 15) => {
    const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
    return customers.filter((c) => {
      if (c.totalDebt === 0) return false;
      if (!c.lastPaymentDate) {
        return c.createdAt.getTime() < threshold;
      }
      return c.lastPaymentDate.getTime() < threshold;
    });
  };

  const getCustomerTransactions = (customerId: string) => {
    return transactions
      .filter((t) => t.customerId === customerId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const deleteCustomer = async (customerId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (error) throw error;

      setCustomers((prev) => prev.filter((c) => c.id !== customerId));
      setTransactions((prev) => prev.filter((t) => t.customerId !== customerId));
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el cliente',
        variant: 'destructive',
      });
    }
  };

  const updateCustomer = async (customerId: string, name: string, phone: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('customers')
        .update({ name, phone })
        .eq('id', customerId);

      if (error) throw error;

      setCustomers((prev) =>
        prev.map((c) => (c.id === customerId ? { ...c, name, phone } : c))
      );
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el cliente',
        variant: 'destructive',
      });
    }
  };

  return {
    customers,
    transactions,
    loading,
    addCustomer,
    addDebt,
    addPayment,
    getTotalDebt,
    getOverdueCustomers,
    getCustomerTransactions,
    deleteCustomer,
    updateCustomer,
    refetch: fetchData,
  };
};
