export interface Customer {
  id: string;
  name: string;
  phone: string;
  totalDebt: number;
  lastPaymentDate: Date | null;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  customerId: string;
  type: 'debt' | 'payment';
  amount: number;
  description: string;
  date: Date;
}

export interface CustomerWithTransactions extends Customer {
  transactions: Transaction[];
}
