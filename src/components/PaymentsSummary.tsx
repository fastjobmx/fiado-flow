import { useState } from 'react';
import { X, Calendar, TrendingUp } from 'lucide-react';
import { Transaction } from '@/types/fiado';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PaymentsSummaryProps {
  transactions: Transaction[];
  onClose: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const PaymentsSummary = ({ transactions, onClose }: PaymentsSummaryProps) => {
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const payments = transactions.filter((t) => t.type === 'payment');
  
  const weekPayments = payments.filter((t) => t.date >= weekAgo);
  const monthPayments = payments.filter((t) => t.date >= monthAgo);

  const weekTotal = weekPayments.reduce((sum, t) => sum + t.amount, 0);
  const monthTotal = monthPayments.reduce((sum, t) => sum + t.amount, 0);

  const currentPayments = period === 'week' ? weekPayments : monthPayments;
  const currentTotal = period === 'week' ? weekTotal : monthTotal;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 animate-fade-in">
      <div className="bg-card w-full max-w-md rounded-t-2xl p-6 animate-slide-up max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Resumen de Pagos
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <Tabs value={period} onValueChange={(v) => setPeriod(v as 'week' | 'month')} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="week">Esta Semana</TabsTrigger>
            <TabsTrigger value="month">Este Mes</TabsTrigger>
          </TabsList>

          <div className="bg-primary/10 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Recibido</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(currentTotal)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Pagos</p>
                <p className="text-xl font-semibold text-foreground">{currentPayments.length}</p>
              </div>
            </div>
          </div>

          <TabsContent value={period} className="flex-1 overflow-auto mt-0">
            {currentPayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>Sin pagos en este periodo</p>
              </div>
            ) : (
              <div className="space-y-2">
                {currentPayments
                  .sort((a, b) => b.date.getTime() - a.date.getTime())
                  .map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
                    >
                      <div>
                        <p className="font-medium text-foreground">{payment.description || 'Pago'}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(payment.date)}</p>
                      </div>
                      <span className="font-semibold text-success">
                        +{formatCurrency(payment.amount)}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Button onClick={onClose} className="w-full mt-4">
          Cerrar
        </Button>
      </div>
    </div>
  );
};
