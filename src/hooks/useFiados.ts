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

      // Map to local types - usando SOLO campos base seguros
      const mappedCustomers: Customer[] = (customersData || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        phone: c.phone || '',
        totalDebt: Number(c.total_debt) || 0,
        lastPaymentDate: c.last_payment_date ? new Date(c.last_payment_date) : null,
        createdAt: new Date(c.created_at),
        updatedAt: c.updated_at ? new Date(c.updated_at) : undefined,
        status: 'active',
      }));

      // Map to local types - usando SOLO campos base seguros
      const mappedTransactions: Transaction[] = (transactionsData || []).map((t: any) => ({
        id: t.id,
        customerId: t.customer_id,
        type: t.type as 'debt' | 'payment',
        amount: Number(t.amount) || 0,
        description: t.description || '',
        date: new Date(t.created_at),
        status: 'completed',
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

  const addCustomer = async (
    name: string, 
    phone: string, 
    nickname?: string, 
    address?: string, 
    notes?: string,
    creditLimit?: number
  ) => {
    if (!user) {
      console.error('[addCustomer] ERROR: No hay usuario autenticado');
      return null;
    }

    // Validar name
    if (!name || name.trim() === '') {
      console.error('[addCustomer] ERROR: name es requerido');
      return null;
    }

    console.log('[addCustomer] Iniciando creación de cliente:', {
      name: name.trim(),
      phone,
      userId: user.id,
    });

    try {
      // Payload MÍNIMO para customers (solo columnas base seguras)
      const payload: any = {
        owner_id: user.id,
        name: name.trim() || 'Cliente sin nombre',
        phone: phone || null,
        total_debt: 0,
      };

      console.log('[FIADO] payload customer', payload);

      const { data, error } = await supabase
        .from('customers')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error('[addCustomer] Error de Supabase:', {
          message: error.message,
          code: error.code,
          details: error.details,
        });
        throw error;
      }

      console.log('[addCustomer] Respuesta de Supabase:', data);

      const newCustomer: Customer = {
        id: data.id,
        name: data.name,
        phone: data.phone || '',
        totalDebt: 0,
        lastPaymentDate: null,
        createdAt: new Date(data.created_at),
        updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
        nickname: data.nickname,
        address: data.address,
        notes: data.notes,
        creditLimit: data.credit_limit ? Number(data.credit_limit) : undefined,
        status: 'active',
        lastMovementAt: data.last_movement_at ? new Date(data.last_movement_at) : null,
      };

      setCustomers((prev) => [newCustomer, ...prev]);

      toast({
        title: 'Cliente creado',
        description: `Se agregó a ${newCustomer.name}`,
      });

      return newCustomer;
    } catch (error: any) {
      console.error('[addCustomer] Error completo:', error);
      const errorMessage = error?.message || error?.details || 'Error desconocido al crear el cliente';
      toast({
        title: 'Error al crear cliente',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  };

  const addDebt = async (customerId: string, amount: number, description: string, date: Date = new Date(), note?: string) => {
    if (!user) {
      console.error('[addDebt] ERROR: No hay usuario autenticado');
      return null;
    }

    // Validar customer_id
    if (!customerId) {
      console.error('[addDebt] ERROR: customer_id es requerido');
      return null;
    }

    // Validar amount
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      console.error('[addDebt] ERROR: amount debe ser un número positivo');
      return null;
    }

    console.log('[addDebt] Iniciando registro de fiado:', {
      customerId,
      amount: numAmount,
      description,
      date: date.toISOString(),
      note,
      userId: user.id,
    });

    try {
      // Payload MÍNIMO para transactions (solo columnas base seguras)
      const payload: any = {
        owner_id: user.id,
        customer_id: customerId,
        type: 'debt',
        amount: numAmount,
        description: description || 'Fiado',
      };

      console.log('[FIADO] payload transaction', payload);

      // Insert transaction
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .insert(payload)
        .select()
        .single();

      if (transactionError) {
        console.error('[addDebt] Error de Supabase:', {
          message: transactionError.message,
          code: transactionError.code,
          details: transactionError.details,
          hint: transactionError.hint,
        });
        throw transactionError;
      }

      console.log('[addDebt] Respuesta de Supabase:', transactionData);

      // Update customer total_debt
      const customer = customers.find((c) => c.id === customerId);
      if (!customer) return null;

      if (customer.creditLimit && customer.totalDebt + numAmount > customer.creditLimit) {
        toast({
          title: 'Aviso de Límite',
          description: `Este fiado supera el límite de ${new Intl.NumberFormat('es-CO').format(customer.creditLimit)}.`,
          variant: 'destructive',
        });
      }

      const newDebt = customer.totalDebt + numAmount;

      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('customers')
        .update({ 
          total_debt: newDebt,
          updated_at: now,
        })
        .eq('id', customerId);

      if (updateError) {
        console.error('[FIADO] Supabase error', updateError);
        throw updateError;
      }

      // Update local state
      const newTransaction: Transaction = {
        id: transactionData.id,
        customerId,
        type: 'debt',
        amount: numAmount,
        description: description || 'Fiado',
        date: new Date(transactionData.created_at),
        status: 'completed',
      };

      setTransactions((prev) => [newTransaction, ...prev]);
      setCustomers((prev) =>
        prev.map((c) => (c.id === customerId ? { ...c, totalDebt: newDebt, lastMovementAt: date } : c))
      );

      toast({
        title: 'Fiado guardado',
        description: `Se registró el fiado de ${new Intl.NumberFormat('es-CO').format(numAmount)}`,
      });

      return newTransaction;
    } catch (error: any) {
      console.error('[addDebt] Error completo:', error);
      const errorMessage = error?.message || error?.details || 'Error desconocido al guardar el fiado';
      toast({
        title: 'Error al guardar fiado',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  };

  const addPayment = async (customerId: string, amount: number, description: string, date: Date = new Date(), paymentMethod?: string, note?: string) => {
    if (!user) {
      console.error('[addPayment] ERROR: No hay usuario autenticado');
      return null;
    }

    // Validar customer_id
    if (!customerId) {
      console.error('[addPayment] ERROR: customer_id es requerido');
      return null;
    }

    // Validar amount
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      console.error('[addPayment] ERROR: amount debe ser un número positivo');
      return null;
    }

    console.log('[addPayment] Iniciando registro de abono:', {
      customerId,
      amount: numAmount,
      description,
      date: date.toISOString(),
      paymentMethod,
      note,
      userId: user.id,
    });

    try {
      // Payload MÍNIMO para transactions (solo columnas base seguras)
      const payload: any = {
        owner_id: user.id,
        customer_id: customerId,
        type: 'payment',
        amount: numAmount,
        description: description || 'Abono',
      };

      console.log('[FIADO] payload transaction', payload);

      // Insertar el abono
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .insert(payload)
        .select()
        .single();

      if (transactionError) {
        console.error('[addPayment] Error de Supabase:', {
          message: transactionError.message,
          code: transactionError.code,
          details: transactionError.details,
          hint: transactionError.hint,
        });
        throw transactionError;
      }

      console.log('[addPayment] Respuesta de Supabase:', transactionData);

      // RECARGAR datos actualizados del cliente desde Supabase para evitar desincronización
      const { data: updatedCustomer, error: reloadError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (reloadError) {
        console.error('[addPayment] Error al recargar cliente:', reloadError);
      }

      // Calcular nueva deuda basada en datos frescos o fallback al cálculo local
      const currentDebt = updatedCustomer?.total_debt ?? customers.find((c) => c.id === customerId)?.totalDebt ?? 0;
      const newDebt = Math.max(0, Number(currentDebt) - numAmount);

      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          total_debt: newDebt,
          last_payment_date: now,
          updated_at: now,
        })
        .eq('id', customerId);

      if (updateError) {
        console.error('[FIADO] Supabase error', updateError);
        throw updateError;
      }

      console.log('[addPayment] Deuda actualizada:', { oldDebt: currentDebt, newDebt, amount: numAmount });

      // Update local state con datos verificados
      const newTransaction: Transaction = {
        id: transactionData.id,
        customerId,
        type: 'payment',
        amount: numAmount,
        description: description || 'Abono',
        date: new Date(transactionData.created_at),
        status: 'completed',
      };

      setTransactions((prev) => [newTransaction, ...prev]);
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId 
            ? { ...c, totalDebt: newDebt, lastPaymentDate: new Date(now), lastMovementAt: date } 
            : c
        )
      );

      toast({
        title: 'Abono registrado',
        description: `Se recibió un abono de ${new Intl.NumberFormat('es-CO').format(numAmount)}`,
      });

      return newTransaction;
    } catch (error: any) {
      console.error('[addPayment] Error completo:', error);
      const errorMessage = error?.message || error?.details || 'Error desconocido al registrar el abono';
      toast({
        title: 'Error al registrar abono',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  };

  const getTotalDebt = () => {
    return customers.reduce((sum, c) => sum + c.totalDebt, 0);
  };

  const getDailyStats = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayTransactions = transactions.filter(t => {
      const transDate = new Date(t.date);
      transDate.setHours(0, 0, 0, 0);
      return transDate.getTime() === today.getTime();
    });

    const newDebts = todayTransactions
      .filter(t => t.type === 'debt')
      .reduce((sum, t) => sum + t.amount, 0);

    const newPayments = todayTransactions
      .filter(t => t.type === 'payment')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      newDebts,
      newPayments
    };
  }, [transactions]);

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

    console.log('[FIADO] delete customer', { customerId });

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (error) {
        console.error('[deleteCustomer] Error de Supabase:', {
          message: error.message,
          code: error.code,
          details: error.details,
        });
        throw error;
      }

      setCustomers((prev) => prev.filter((c) => c.id !== customerId));
      setTransactions((prev) => prev.filter((t) => t.customerId !== customerId));
      
      console.log('[FIADO] customer deleted', { customerId });
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      toast({
        title: 'Error',
        description: error?.message || 'No se pudo eliminar el cliente',
        variant: 'destructive',
      });
    }
  };

  const updateCustomer = async (customerId: string, name: string, phone: string, nickname?: string, address?: string, notes?: string) => {
    if (!user) return;

    try {
      // Payload MÍNIMO para update (solo columnas base seguras)
      const updateData: any = {
        name: name || 'Cliente sin nombre',
        phone: phone || null,
        updated_at: new Date().toISOString(),
      };

      console.log('[FIADO] update customer payload', updateData);

      const { error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', customerId);

      if (error) {
        console.error('[FIADO] Supabase error', error);
        throw error;
      }

      setCustomers((prev) =>
        prev.map((c) => (c.id === customerId ? { 
          ...c, 
          name: updateData.name, 
          phone: updateData.phone,
          updatedAt: new Date(),
        } : c))
      );
    } catch (error: any) {
      console.error('Error updating customer:', error);
      toast({
        title: 'Error',
        description: error?.message || 'No se pudo actualizar el cliente',
        variant: 'destructive',
      });
    }
  };

  // Importar múltiples clientes desde Excel
  const importCustomers = async (customersToImport: { name: string; phone: string; total_debt?: number }[]) => {
    if (!user) return { success: 0, errors: customersToImport.length };

    let success = 0;
    let errors = 0;

    for (const customer of customersToImport) {
      try {
        const payload: any = {
          owner_id: user.id,
          name: customer.name.trim() || 'Cliente sin nombre',
          phone: customer.phone || null,
          total_debt: customer.total_debt || 0,
        };

        const { data, error } = await supabase
          .from('customers')
          .insert(payload)
          .select()
          .single();

        if (error) {
          console.error('[importCustomers] Error insertando:', error);
          errors++;
        } else {
          const newCustomer: Customer = {
            id: data.id,
            name: data.name,
            phone: data.phone || '',
            totalDebt: Number(data.total_debt) || 0,
            lastPaymentDate: data.last_payment_date ? new Date(data.last_payment_date) : null,
            createdAt: new Date(data.created_at),
            updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
            status: 'active',
          };
          
          setCustomers((prev) => [newCustomer, ...prev]);
          success++;
        }
      } catch (error) {
        console.error('[importCustomers] Error:', error);
        errors++;
      }
    }

    return { success, errors };
  };

  // Pagar la deuda total de un cliente (saldar cuenta)
  const payFullAmount = async (customerId: string, date: Date = new Date(), paymentMethod?: string, note?: string) => {
    if (!user) {
      console.error('[payFullAmount] ERROR: No hay usuario autenticado');
      return null;
    }

    const customer = customers.find((c) => c.id === customerId);
    if (!customer) {
      toast({
        title: 'Error',
        description: 'Cliente no encontrado',
        variant: 'destructive',
      });
      return null;
    }

    const totalDebt = customer.totalDebt;
    if (totalDebt <= 0) {
      toast({
        title: 'Cliente al día',
        description: 'Este cliente no tiene deuda pendiente',
      });
      return null;
    }

    console.log('[payFullAmount] Saldando deuda total:', {
      customerId,
      customerName: customer.name,
      totalDebt,
    });

    try {
      // Usar addPayment con el monto total
      const result = await addPayment(
        customerId,
        totalDebt,
        'Pago total - Saldado de cuenta',
        date,
        paymentMethod,
        note || `Pago completo de ${new Intl.NumberFormat('es-CO').format(totalDebt)}`
      );

      if (result) {
        toast({
          title: '¡Cuenta saldada!',
          description: `${customer.name} ha pagado su deuda completa de ${new Intl.NumberFormat('es-CO').format(totalDebt)}`,
        });
      }

      return result;
    } catch (error: any) {
      console.error('[payFullAmount] Error:', error);
      toast({
        title: 'Error al saldar cuenta',
        description: error?.message || 'No se pudo procesar el pago total',
        variant: 'destructive',
      });
      return null;
    }
  };

  return {
    customers,
    transactions,
    loading,
    addCustomer,
    addDebt,
    addPayment,
    payFullAmount,
    getTotalDebt,
    getDailyStats,
    getOverdueCustomers,
    getCustomerTransactions,
    deleteCustomer,
    updateCustomer,
    importCustomers,
    refetch: fetchData,
  };
};
