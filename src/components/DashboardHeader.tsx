import { DollarSign, TrendingUp } from 'lucide-react';

interface DashboardHeaderProps {
  totalDebt: number;
  customerCount: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const DashboardHeader = ({ totalDebt, customerCount }: DashboardHeaderProps) => {
  return (
    <div className="bg-primary text-primary-foreground rounded-2xl p-6 shadow-lg animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <DollarSign className="w-5 h-5 opacity-80" />
        <span className="text-sm font-medium opacity-80">Plata en la calle</span>
      </div>
      <div className="text-3xl font-bold mb-4">{formatCurrency(totalDebt)}</div>
      <div className="flex items-center gap-2 text-sm opacity-80">
        <TrendingUp className="w-4 h-4" />
        <span>{customerCount} clientes con fiado</span>
      </div>
    </div>
  );
};
