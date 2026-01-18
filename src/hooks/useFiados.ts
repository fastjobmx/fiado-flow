import { useState, useEffect } from 'react';
import { Customer, Transaction } from '@/types/fiado';

const STORAGE_KEY = 'fiados_data';

interface FiadosData {
  customers: Customer[];
  transactions: Transaction[];
}

const getInitialData = (): FiadosData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const data = JSON.parse(stored);
    return {
      customers: data.customers.map((c: Customer) => ({
        ...c,
        lastPaymentDate: c.lastPaymentDate ? new Date(c.lastPaymentDate) : null,
        createdAt: new Date(c.createdAt),
      })),
      transactions: data.transactions.map((t: Transaction) => ({
        ...t,
        date: new Date(t.date),
      })),
    };
  }
  
  // Demo data
  const demoCustomers: Customer[] = [
    {
      id: '1',
      name: 'María García',
      phone: '3001234567',
      totalDebt: 45000,
      lastPaymentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
    {
      id: '2',
      name: 'Carlos Rodríguez',
      phone: '3109876543',
      totalDebt: 78500,
      lastPaymentDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    },
    {
      id: '3',
      name: 'Ana Martínez',
      phone: '3205551234',
      totalDebt: 23000,
      lastPaymentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    },
    {
      id: '4',
      name: 'Pedro Sánchez',
      phone: '3157894561',
      totalDebt: 156000,
      lastPaymentDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    },
  ];
  
  return { customers: demoCustomers, transactions: [] };
};

export const useFiados = () => {
  const [data, setData] = useState<FiadosData>(getInitialData);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const addCustomer = (name: string, phone: string) => {
    const newCustomer: Customer = {
      id: Date.now().toString(),
      name,
      phone,
      totalDebt: 0,
      lastPaymentDate: null,
      createdAt: new Date(),
    };
    setData((prev) => ({
      ...prev,
      customers: [...prev.customers, newCustomer],
    }));
    return newCustomer;
  };

  const addDebt = (customerId: string, amount: number, description: string) => {
    const transaction: Transaction = {
      id: Date.now().toString(),
      customerId,
      type: 'debt',
      amount,
      description,
      date: new Date(),
    };

    setData((prev) => ({
      customers: prev.customers.map((c) =>
        c.id === customerId ? { ...c, totalDebt: c.totalDebt + amount } : c
      ),
      transactions: [...prev.transactions, transaction],
    }));
  };

  const addPayment = (customerId: string, amount: number, description: string) => {
    const transaction: Transaction = {
      id: Date.now().toString(),
      customerId,
      type: 'payment',
      amount,
      description,
      date: new Date(),
    };

    setData((prev) => ({
      customers: prev.customers.map((c) =>
        c.id === customerId
          ? {
              ...c,
              totalDebt: Math.max(0, c.totalDebt - amount),
              lastPaymentDate: new Date(),
            }
          : c
      ),
      transactions: [...prev.transactions, transaction],
    }));
  };

  const getTotalDebt = () => {
    return data.customers.reduce((sum, c) => sum + c.totalDebt, 0);
  };

  const getOverdueCustomers = (days: number = 15) => {
    const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
    return data.customers.filter((c) => {
      if (c.totalDebt === 0) return false;
      if (!c.lastPaymentDate) {
        return c.createdAt.getTime() < threshold;
      }
      return c.lastPaymentDate.getTime() < threshold;
    });
  };

  const getCustomerTransactions = (customerId: string) => {
    return data.transactions
      .filter((t) => t.customerId === customerId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  return {
    customers: data.customers,
    transactions: data.transactions,
    addCustomer,
    addDebt,
    addPayment,
    getTotalDebt,
    getOverdueCustomers,
    getCustomerTransactions,
  };
};
