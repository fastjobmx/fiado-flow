export interface Customer {
  id: string;
  name: string;
  phone: string;
  totalDebt: number;
  lastPaymentDate: Date | null;
  createdAt: Date;
  updatedAt?: Date;
  nickname?: string;
  notes?: string;
  address?: string;
  creditLimit?: number;
  status?: 'active' | 'suspended' | 'inactive';
  lastMovementAt?: Date | null;
}

export interface Transaction {
  id: string;
  customerId: string;
  type: 'debt' | 'payment';
  amount: number;
  description: string;
  date: Date;
  paymentMethod?: string;
  note?: string;
  registeredBy?: string;
  parentTransactionId?: string;
  status?: 'completed' | 'pending' | 'cancelled';
  originalAmount?: number;
  pendingBalance?: number;
}

export interface CustomerWithTransactions extends Customer {
  transactions: Transaction[];
}
