import { useState, useMemo, useCallback } from 'react';
import { PlanType, Subscription, PlanLimits, getPlanById, checkLimit, getLimitMessage } from '@/types/subscription';

// Simulación - en producción esto vendría de Supabase
const MOCK_SUBSCRIPTION: Subscription = {
  plan: 'free',
  status: 'active',
  customerCount: 0,
  transactionCount: 0,
};

interface UseSubscriptionProps {
  currentCustomers: number;
  currentTransactions: number;
}

export function useSubscription({ currentCustomers, currentTransactions }: UseSubscriptionProps) {
  // En producción, esto vendría de la base de datos
  const [subscription, setSubscription] = useState<Subscription>(MOCK_SUBSCRIPTION);

  const plan = useMemo(() => getPlanById(subscription.plan), [subscription.plan]);
  
  const limits = plan.limits;

  // Verificar si puede agregar más clientes
  const canAddCustomer = useMemo(() => {
    return checkLimit(currentCustomers, limits.maxCustomers);
  }, [currentCustomers, limits.maxCustomers]);

  // Verificar si puede agregar más transacciones
  const canAddTransaction = useMemo(() => {
    return checkLimit(currentTransactions, limits.maxTransactions);
  }, [currentTransactions, limits.maxTransactions]);

  // Verificar si está cerca del límite (80% o más)
  const isNearCustomerLimit = useMemo(() => {
    if (limits.maxCustomers === null) return false;
    return currentCustomers >= limits.maxCustomers * 0.8;
  }, [currentCustomers, limits.maxCustomers]);

  const isNearTransactionLimit = useMemo(() => {
    if (limits.maxTransactions === null) return false;
    return currentTransactions >= limits.maxTransactions * 0.8;
  }, [currentTransactions, limits.maxTransactions]);

  // Mensajes de límite
  const customerLimitMessage = useMemo(() => {
    if (limits.maxCustomers === null) return null;
    const remaining = limits.maxCustomers - currentCustomers;
    if (remaining <= 0) return 'Has llegado al límite de clientes del plan gratis';
    return getLimitMessage('customers', currentCustomers, limits.maxCustomers);
  }, [currentCustomers, limits.maxCustomers]);

  const transactionLimitMessage = useMemo(() => {
    if (limits.maxTransactions === null) return null;
    const remaining = limits.maxTransactions - currentTransactions;
    if (remaining <= 0) return 'Has llegado al límite de movimientos del plan gratis';
    return getLimitMessage('transactions', currentTransactions, limits.maxTransactions);
  }, [currentTransactions, limits.maxTransactions]);

  // Cambiar de plan (simulado)
  const upgradePlan = useCallback((newPlan: PlanType) => {
    setSubscription(prev => ({
      ...prev,
      plan: newPlan,
      status: 'active',
    }));
  }, []);

  // Verificar si necesita mostrar modal de upgrade
  const shouldShowUpgradeModal = useMemo(() => {
    return subscription.plan === 'free' && (!canAddCustomer || !canAddTransaction);
  }, [subscription.plan, canAddCustomer, canAddTransaction]);

  return {
    subscription,
    plan,
    limits,
    canAddCustomer,
    canAddTransaction,
    isNearCustomerLimit,
    isNearTransactionLimit,
    customerLimitMessage,
    transactionLimitMessage,
    shouldShowUpgradeModal,
    upgradePlan,
    currentCustomers,
    currentTransactions,
  };
}

export default useSubscription;
