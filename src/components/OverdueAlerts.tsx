import { AlertTriangle, Clock } from 'lucide-react';
import { Customer } from '@/types/fiado';

interface OverdueAlertsProps {
  customers: Customer[];
  onCustomerClick: (customer: Customer) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getDaysOverdue = (customer: Customer) => {
  const lastDate = customer.lastPaymentDate || customer.createdAt;
  return Math.floor((Date.now() - lastDate.getTime()) / (24 * 60 * 60 * 1000));
};

export const OverdueAlerts = ({ customers, onCustomerClick }: OverdueAlertsProps) => {
  if (customers.length === 0) {
    return (
      <div className="bg-card rounded-xl p-4 border border-border animate-slide-up">
        <div className="flex items-center gap-2 text-success mb-2">
          <Clock className="w-5 h-5" />
          <span className="font-semibold">🤖 Análisis IA</span>
        </div>
        <p className="text-sm text-muted-foreground">
          ¡Excelente! Todos tus clientes están al día con sus pagos.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-4 border border-destructive/20 animate-slide-up">
      <div className="flex items-center gap-2 text-destructive mb-3">
        <AlertTriangle className="w-5 h-5" />
        <span className="font-semibold">🤖 Alerta IA</span>
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        {customers.length} cliente{customers.length > 1 ? 's' : ''} sin pagar hace más de 15 días:
      </p>
      <div className="space-y-2">
        {customers.slice(0, 3).map((customer) => (
          <button
            key={customer.id}
            onClick={() => onCustomerClick(customer)}
            className="w-full flex items-center justify-between p-3 bg-destructive/5 rounded-lg hover:bg-destructive/10 transition-colors text-left"
          >
            <div>
              <p className="font-medium text-foreground">{customer.name}</p>
              <p className="text-xs text-destructive">
                {getDaysOverdue(customer)} días sin pagar
              </p>
            </div>
            <span className="text-sm font-semibold text-destructive">
              {formatCurrency(customer.totalDebt)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
