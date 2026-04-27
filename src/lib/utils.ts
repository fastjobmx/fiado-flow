import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCOP = (value: number) => {
  if (value === null || value === undefined) return "$ 0";
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
};

export const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return "Sin fecha";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "Fecha inválida";
  
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (d1: Date, d2: Date) => 
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();

  if (isSameDay(d, today)) return "Hoy";
  if (isSameDay(d, yesterday)) return "Ayer";

  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
};

export const normalizePhoneToColombia = (phone: string | null | undefined) => {
  if (!phone || typeof phone !== 'string') return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) return `57${cleaned}`;
  if (cleaned.length === 12 && cleaned.startsWith("57")) return cleaned;
  return cleaned;
};

export const getDaysOverdue = (dueDate: string | Date | null | undefined) => {
  if (!dueDate) return 0;
  const today = new Date();
  const due = new Date(dueDate);
  if (isNaN(due.getTime())) return 0;
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

export const getDaysSince = (date: string | Date | null | undefined) => {
  if (!date) return 0;
  const today = new Date();
  const past = new Date(date);
  if (isNaN(past.getTime())) return 0;
  const diffTime = today.getTime() - past.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

export type DebtStatus = 'no_movements' | 'up_to_date' | 'with_debt' | 'overdue' | 'critical';

export const getDebtStatus = (customer: any, transactions: any[] = []): DebtStatus => {
  if (!customer) return 'no_movements';
  const totalDebt = customer?.totalDebt || 0;
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const hasMovements = safeTransactions.length > 0;

  if (!hasMovements && totalDebt === 0) return 'no_movements';
  if (totalDebt === 0) return 'up_to_date';
  
  // Si debe, calculamos los días según la regla: 
  // días desde el último abono o desde el último fiado si nunca abonó
  const lastPayment = safeTransactions.filter(t => t.type === 'payment').sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
  })[0];
  
  const lastDebt = safeTransactions.filter(t => t.type === 'debt').sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
  })[0];
  
  const referenceDate = lastPayment?.date || lastDebt?.date || customer?.createdAt;
  const days = getDaysSince(referenceDate);

  if (days <= 7) return 'with_debt';
  if (days <= 30) return 'overdue';
  return 'critical';
};

export const getStatusColor = (status: DebtStatus) => {
  switch (status) {
    case 'up_to_date': return 'text-green-600 bg-green-50';
    case 'with_debt': return 'text-purple-600 bg-purple-50';
    case 'overdue': return 'text-amber-600 bg-amber-50';
    case 'critical': return 'text-red-600 bg-red-50';
    case 'no_movements': return 'text-zinc-500 bg-zinc-100';
    default: return 'text-zinc-500 bg-zinc-100';
  }
};

export const getStatusLabel = (status: DebtStatus) => {
  switch (status) {
    case 'up_to_date': return 'Al día';
    case 'with_debt': return 'Debe';
    case 'overdue': return 'En mora';
    case 'critical': return 'Mora crítica';
    case 'no_movements': return 'Sin fiados';
    default: return 'Desconocido';
  }
};

export const buildCustomerPaymentMessage = (customerName: string, amount: number, storeName: string, lastMovement?: string) => {
  const formattedAmount = formatCOP(amount);
  const tienda = storeName || "la tienda";
  const movementInfo = lastMovement ? ` Último movimiento: ${lastMovement}.` : "";
  return `Hola, ${customerName}. Te recordamos que tienes un saldo pendiente de ${formattedAmount} en ${tienda}.${movementInfo} Puedes realizar un abono hoy o confirmar cuándo pasas por la tienda. Gracias.`;
};

export const getCustomerDebt = (customer: any) => {
  return customer?.totalDebt || 0;
};

export const getCustomerTotalBorrowed = (transactions: any[]) => {
  return transactions
    .filter(t => t.type === 'debt')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
};

export const getCustomerTotalPaid = (transactions: any[]) => {
  return transactions
    .filter(t => t.type === 'payment')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
};

export const getCustomerLastMovement = (transactions: any[]) => {
  if (!transactions || transactions.length === 0) return null;
  const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const last = sorted[0];
  const typeLabel = last.type === 'debt' ? 'Fiado' : 'Abono';
  return `${typeLabel} (${formatCOP(last.amount)}) - ${formatDate(last.date)}`;
};

export const parseCOP = (input: string) => {
  const cleaned = input.replace(/\D/g, "");
  return cleaned ? parseInt(cleaned, 10) : 0;
};

export const getTodayDate = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

export const buildDebtCreatedMessage = (customerName: string, storeName: string, amount: number, totalDebt: number) => {
  return `Hola, ${customerName}. Se registró un fiado por ${formatCOP(amount)} en ${storeName}. Tu saldo pendiente ahora es de ${formatCOP(totalDebt)}. Gracias.`;
};

export const buildPaymentReceiptMessage = (customerName: string, storeName: string, amount: number, totalDebt: number) => {
  if (totalDebt <= 0) {
    return `Hola, ${customerName}. Hemos registrado tu abono de ${formatCOP(amount)} en ${storeName}. Tu cuenta quedó al día. Gracias.`;
  }
  return `Hola, ${customerName}. Hemos registrado tu abono de ${formatCOP(amount)} en ${storeName}. Tu saldo pendiente ahora es de ${formatCOP(totalDebt)}. Gracias.`;
};

export const canRegisterPayment = (accountStatus?: string) => {
  return canCreateDebt(accountStatus);
};

export const canCreateDebt = (accountStatus?: string) => {
  if (!accountStatus) return true;
  const blocked = ['inactive', 'suspended'];
  return !blocked.includes(accountStatus.toLowerCase());
};

export const canCreateCustomer = (accountStatus?: string) => {
  if (!accountStatus) return true;
  const blocked = ['inactive', 'suspended'];
  return !blocked.includes(accountStatus.toLowerCase());
};

export const canSendCollection = (accountStatus?: string) => {
  if (!accountStatus) return true;
  const blocked = ['inactive', 'suspended'];
  return !blocked.includes(accountStatus.toLowerCase());
};
