import { ArrowLeft, Phone, MessageCircle, Plus, Minus } from 'lucide-react';
import { useState } from 'react';
import { Customer, Transaction } from '@/types/fiado';
import { Button } from '@/components/ui/button';
import { TransactionForm } from './TransactionForm';

interface CustomerDetailProps {
  customer: Customer;
  transactions: Transaction[];
  onBack: () => void;
  onAddDebt: (amount: number, description: string) => void;
  onAddPayment: (amount: number, description: string) => void;
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

export const CustomerDetail = ({
  customer,
  transactions,
  onBack,
  onAddDebt,
  onAddPayment,
}: CustomerDetailProps) => {
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const sendWhatsAppReminder = () => {
    const message = encodeURIComponent(
      `¡Hola ${customer.name.split(' ')[0]}! 👋\n\n` +
      `Te escribo de la tienda para recordarte que tienes un saldo pendiente de ${formatCurrency(customer.totalDebt)}.\n\n` +
      `Puedes pagar por:\n` +
      `💜 Nequi: 3001234567\n` +
      `🧡 Daviplata: 3001234567\n\n` +
      `¡Gracias por tu preferencia! 🙏`
    );
    window.open(`https://wa.me/57${customer.phone}?text=${message}`, '_blank');
  };

  return (
    <div className="animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Volver</span>
      </button>

      <div className="bg-card rounded-xl p-6 border border-border mb-4">
        <h1 className="text-xl font-bold text-foreground mb-1">{customer.name}</h1>
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <Phone className="w-4 h-4" />
          <span>{customer.phone}</span>
        </div>
        
        <div className="text-center py-4 border-y border-border mb-4">
          <p className="text-sm text-muted-foreground mb-1">Saldo pendiente</p>
          <p className={`text-3xl font-bold ${customer.totalDebt > 0 ? 'text-destructive' : 'text-success'}`}>
            {formatCurrency(customer.totalDebt)}
          </p>
        </div>

        <Button
          onClick={sendWhatsAppReminder}
          className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white gap-2"
          disabled={customer.totalDebt === 0}
        >
          <MessageCircle className="w-5 h-5" />
          Enviar Recordatorio por WhatsApp
        </Button>
      </div>

      <div className="flex gap-3 mb-6">
        <Button
          onClick={() => setShowDebtForm(true)}
          variant="outline"
          className="flex-1 gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <Plus className="w-4 h-4" />
          Agregar Fiado
        </Button>
        <Button
          onClick={() => setShowPaymentForm(true)}
          className="flex-1 gap-2"
        >
          <Minus className="w-4 h-4" />
          Registrar Pago
        </Button>
      </div>

      {showDebtForm && (
        <TransactionForm
          type="debt"
          onSubmit={(amount, description) => {
            onAddDebt(amount, description);
            setShowDebtForm(false);
          }}
          onCancel={() => setShowDebtForm(false)}
        />
      )}

      {showPaymentForm && (
        <TransactionForm
          type="payment"
          maxAmount={customer.totalDebt}
          onSubmit={(amount, description) => {
            onAddPayment(amount, description);
            setShowPaymentForm(false);
          }}
          onCancel={() => setShowPaymentForm(false)}
        />
      )}

      <div className="mt-6">
        <h3 className="font-semibold text-foreground mb-3">Historial</h3>
        {transactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">
            Sin transacciones aún
          </p>
        ) : (
          <div className="space-y-2">
            {transactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-3 bg-card rounded-lg border border-border"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {t.type === 'debt' ? '📝 Fiado' : '✅ Pago'}
                  </p>
                  <p className="text-sm text-muted-foreground">{t.description}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
                </div>
                <span
                  className={`font-semibold ${
                    t.type === 'debt' ? 'text-destructive' : 'text-success'
                  }`}
                >
                  {t.type === 'debt' ? '+' : '-'}{formatCurrency(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
