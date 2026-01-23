import { ArrowLeft, Phone, MessageCircle, Plus, Minus, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Customer, Transaction } from '@/types/fiado';
import { Button } from '@/components/ui/button';
import { TransactionForm } from './TransactionForm';
import { EditCustomerForm } from './EditCustomerForm';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { useProfile } from '@/hooks/useProfile';
import { formatTemplate, encodeWhatsAppMessage } from '@/lib/messages';
import { InvoiceModal } from './InvoiceModal';

interface CustomerDetailProps {
  customer: Customer;
  transactions: Transaction[];
  onBack: () => void;
  onAddDebt: (amount: number, description: string) => void;
  onAddPayment: (amount: number, description: string) => void;
  onEdit: (name: string, phone: string) => void;
  onDelete: () => void;
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
  onEdit,
  onDelete,
}: CustomerDetailProps) => {
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [invoiceTx, setInvoiceTx] = useState<Transaction | null>(null);

  const { profile, getMessageTemplates, getPaymentContacts } = useProfile();

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

  const sendWhatsAppReminder = () => {
    const templates = getMessageTemplates();
    const contacts = getPaymentContacts();
    const message = formatTemplate(templates.message_template_reminder || '', {
      customer_first_name: customer.name.split(' ')[0],
      customer_name: customer.name,
      amount: formatCurrency(customer.totalDebt),
      store_name: profile?.store_name || 'Mi Tienda',
      nequi: contacts.nequi_number || '',
      daviplata: contacts.daviplata_number || '',
      whatsapp: contacts.whatsapp_number || '',
    });
    window.open(`https://wa.me/57${customer.phone}?text=${encodeWhatsAppMessage(message)}`, '_blank');
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
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold text-foreground">{customer.name}</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowEditForm(true)}
              className="p-2 text-muted-foreground hover:text-primary transition-colors"
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-muted-foreground hover:text-destructive transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
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

      {/* Acciones principales en barra inferior */}
      <div className="h-24" /> {/* Espaciador para que el historial no quede debajo */}
      <div
        className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="max-w-md mx-auto px-4 py-3 grid grid-cols-2 gap-3">
          <Button
            onClick={() => setShowDebtForm(true)}
            variant="outline"
            className="h-12 gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <Plus className="w-4 h-4" />
            Agregar Fiado
          </Button>
          <Button
            onClick={() => setShowPaymentForm(true)}
            className="h-12 gap-2"
          >
            <Minus className="w-4 h-4" />
            Registrar Pago
          </Button>
        </div>
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

      {showEditForm && (
        <EditCustomerForm
          customer={customer}
          onSubmit={(name, phone) => {
            onEdit(name, phone);
            setShowEditForm(false);
          }}
          onCancel={() => setShowEditForm(false)}
        />
      )}

      {showDeleteConfirm && (
        <DeleteConfirmDialog
          customer={customer}
          onConfirm={() => {
            onDelete();
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      <div className="mt-6">
        <h3 className="font-semibold text-foreground mb-3">Historial</h3>
        {transactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">Sin transacciones aún</p>
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
                <div className="flex items-center gap-2">
                  <span
                    className={`font-semibold ${t.type === 'debt' ? 'text-destructive' : 'text-success'}`}
                  >
                    {t.type === 'debt' ? '+' : '-'}{formatCurrency(t.amount)}
                  </span>
                  {t.type === 'payment' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInvoiceTx(t)}
                      title="Ver/Enviar factura"
                    >
                      Recibo
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {invoiceTx && (
        <InvoiceModal
          storeName={profile?.store_name || 'Mi Tienda'}
          logoUrl={profile?.logo_url || null}
          contacts={getPaymentContacts()}
          templates={{ receiptTemplate: getMessageTemplates().message_template_receipt || '' }}
          customer={customer}
          transaction={invoiceTx}
          remainingDebt={customer.totalDebt}
          onClose={() => setInvoiceTx(null)}
        />
      )}
    </div>
  );
};
