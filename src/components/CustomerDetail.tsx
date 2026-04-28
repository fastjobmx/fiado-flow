import { ArrowLeft, Phone, MessageCircle, Plus, Minus, Pencil, Trash2, ChevronRight, Receipt, Clock, Copy, Check, Calendar, AlertCircle, Info, History, Wallet } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Customer, Transaction } from '@/types/fiado';
import { Button } from '@/components/ui/button';
import { QuickTransaction } from './QuickTransaction';
import { EditCustomerForm } from './EditCustomerForm';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { useProfile } from '@/hooks/useProfile';
import { formatTemplate, encodeWhatsAppMessage } from '@/lib/messages';
import { InvoiceModal } from './InvoiceModal';
import { 
  formatCOP, 
  getDaysSince, 
  getDebtStatus, 
  getStatusColor, 
  getStatusLabel,
  canCreateDebt, 
  canSendCollection, 
  buildCustomerPaymentMessage, 
  formatDate,
  normalizePhoneToColombia
} from '@/lib/utils';
import { toast } from 'sonner';

interface CustomerDetailProps {
  customer: Customer;
  transactions: Transaction[];
  onBack: () => void;
  onAddDebt: (amount: number, description: string, date: Date, note?: string) => void;
  onAddPayment: (amount: number, description: string, date: Date, method?: string, note?: string) => Promise<Transaction | null>;
  onPayFullAmount?: (date: Date, method?: string, note?: string) => Promise<Transaction | null>;
  onEdit: (data: Partial<Customer>) => void;
  onDelete: () => void;
  userStatus?: string;
}

export const CustomerDetail = ({
  customer,
  transactions,
  onBack,
  onAddDebt,
  onAddPayment,
  onPayFullAmount,
  onEdit,
  onDelete,
  userStatus = 'paid',
}: CustomerDetailProps) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'data'>('pending');
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState<{ type: 'debt' | 'payment' } | null>(null);
  const [invoiceTx, setInvoiceTx] = useState<Transaction | null>(null);
  const [copied, setCopied] = useState(false);

  const { profile, getMessageTemplates, getPaymentContacts } = useProfile();

  // Cálculos financieros
  const totalBorrowed = useMemo(() => {
    if (!Array.isArray(transactions)) return 0;
    return transactions.filter(t => t.type === 'debt').reduce((acc, t) => acc + (t.amount || 0), 0);
  }, [transactions]);

  const totalPaid = useMemo(() => {
    if (!Array.isArray(transactions)) return 0;
    return transactions.filter(t => t.type === 'payment').reduce((acc, t) => acc + (t.amount || 0), 0);
  }, [transactions]);

  const sortedTransactions = useMemo(() => {
    if (!Array.isArray(transactions)) return [];
    return [...transactions].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
  }, [transactions]);

  const lastDebt = sortedTransactions.find(t => t.type === 'debt');
  const lastPayment = sortedTransactions.find(t => t.type === 'payment');

  const daysSinceLastMovement = useMemo(() => {
    const lastMovement = customer.lastMovementAt || (sortedTransactions[0]?.date);
    if (!lastMovement) return null;
    return getDaysSince(lastMovement);
  }, [customer.lastMovementAt, sortedTransactions]);

  const status = getDebtStatus(customer, transactions);
  const statusColor = getStatusColor(status);
  const statusLabel = getStatusLabel(status);

  const sendWhatsAppReminder = () => {
    if (!canSendCollection(userStatus)) return;
    const lastMovementStr = sortedTransactions[0] 
      ? `${sortedTransactions[0].type === 'debt' ? 'Fiado' : 'Abono'} de ${formatCOP(sortedTransactions[0].amount)} el ${formatDate(sortedTransactions[0].date)}`
      : undefined;

    const message = buildCustomerPaymentMessage(
      customer.name || 'Cliente', 
      customer.totalDebt, 
      profile?.store_name || 'la tienda',
      lastMovementStr
    );
    
    const phone = normalizePhoneToColombia(customer.phone);
    if (!phone) {
      toast.error('El cliente no tiene un número de celular válido');
      return;
    }
    window.open(`https://wa.me/${phone}?text=${encodeWhatsAppMessage(message)}`, '_blank');
  };

  const copyReminderMessage = () => {
    const lastMovementStr = sortedTransactions[0] 
      ? `${sortedTransactions[0].type === 'debt' ? 'Fiado' : 'Abono'} de ${formatCOP(sortedTransactions[0].amount)} el ${formatDate(sortedTransactions[0].date)}`
      : undefined;

    const message = buildCustomerPaymentMessage(
      customer.name || 'Cliente', 
      customer.totalDebt, 
      profile?.store_name || 'la tienda',
      lastMovementStr
    );
    navigator.clipboard.writeText(message);
    setCopied(true);
    toast.success('Mensaje de cobro copiado');
    setTimeout(() => setCopied(false), 2000);
  };

  const copyTotalDebt = () => {
    navigator.clipboard.writeText(customer.totalDebt.toString());
    toast.success('Monto copiado');
  };

  if (showEditForm) {
    return (
      <EditCustomerForm
        customer={customer}
        onSubmit={(data) => {
          onEdit(data);
          setShowEditForm(false);
        }}
        onCancel={() => setShowEditForm(false)}
      />
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
      {/* Botón Regresar */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors mb-6 font-bold text-sm"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Regresar</span>
      </button>

      {/* Cabecera de Cliente */}
      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-zinc-100 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-black text-zinc-900 leading-tight uppercase truncate">
              {customer.name || 'Cliente sin nombre'}
            </h1>
            {customer.nickname && (
              <p className="text-zinc-400 font-bold text-sm italic">"{customer.nickname}"</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              <p className="text-zinc-500 font-bold flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-zinc-400" />
                {customer.phone || 'Sin celular'}
              </p>
              <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${statusColor.split(' ')[0]} ${statusColor.split(' ')[1]}`}>
                {statusLabel}
              </span>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setShowEditForm(true)}
              className="p-3 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 rounded-2xl transition-all"
            >
              <Pencil className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-3 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tarjeta de Saldo Principal */}
        <div className={`rounded-[28px] p-8 text-center transition-all relative overflow-hidden ${
          customer.totalDebt > 0 ? 'bg-zinc-900 text-white' : 'bg-green-50 text-green-700'
        }`}>
          {customer.creditLimit ? (
            <div className="absolute top-4 right-6 px-3 py-1 bg-white/10 rounded-full backdrop-blur-sm border border-white/10">
              <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Cupo: {formatCOP(customer.creditLimit)}</p>
            </div>
          ) : null}
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">
            {customer.totalDebt > 0 ? 'Debe' : 'Estado'}
          </p>
          <div className="flex items-center justify-center gap-2 mb-4">
            <h2 className="text-5xl font-black tracking-tighter">
              {customer.totalDebt > 0 ? formatCOP(customer.totalDebt) : 'Cliente al día'}
            </h2>
            {customer.totalDebt > 0 && (
              <button 
                onClick={copyTotalDebt}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                title="Copiar monto"
              >
                <Copy className="w-4 h-4 opacity-50" />
              </button>
            )}
          </div>
          
          {customer.totalDebt > 0 && (
            <div className="flex flex-col gap-2 items-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm border border-white/10">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {daysSinceLastMovement !== null 
                    ? `Días sin pagar: ${daysSinceLastMovement}` 
                    : 'Sin registro'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Acciones de Cobro Rápidas */}
        {customer.totalDebt > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
            {/* Botón Pagar Total - Destacado */}
            {onPayFullAmount && (
              <Button
                onClick={async () => {
                  const confirmed = window.confirm(
                    `¿Confirmar pago TOTAL de ${formatCOP(customer.totalDebt)}?\n\nEsto saldará la cuenta de ${customer.name} completamente.`
                  );
                  if (confirmed) {
                    await onPayFullAmount(new Date());
                  }
                }}
                disabled={!canSendCollection(userStatus)}
                className="h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black gap-3 transition-all active:scale-95 col-span-full shadow-lg shadow-emerald-500/25"
              >
                <Check className="w-5 h-5" />
                Pagar Total: {formatCOP(customer.totalDebt)}
              </Button>
            )}
            
            {customer.phone && customer.phone.trim() !== "" && (
              <Button
                onClick={sendWhatsAppReminder}
                disabled={!canSendCollection(userStatus)}
                className="h-14 rounded-2xl bg-[#25D366] hover:bg-[#128C7E] text-white font-black gap-3 transition-all active:scale-95"
              >
                <MessageCircle className="w-5 h-5" />
                Cobrar por WhatsApp
              </Button>
            )}
            <Button
              onClick={copyReminderMessage}
              variant="outline"
              className="h-14 rounded-2xl border-zinc-200 text-zinc-600 font-bold gap-2 hover:bg-zinc-50 transition-all active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              Copiar mensaje
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-zinc-100 p-1.5 rounded-[24px] mb-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 py-3 px-4 rounded-[18px] text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'pending' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <Wallet className="w-4 h-4" />
          Pendientes
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 px-4 rounded-[18px] text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'history' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <History className="w-4 h-4" />
          Historial
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`flex-1 py-3 px-4 rounded-[18px] text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'data' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <Info className="w-4 h-4" />
          Datos
        </button>
      </div>

      {/* Contenido de Tabs */}
      <div className="px-1 min-h-[300px]">
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {/* Resumen Financiero */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white p-5 rounded-[28px] border border-zinc-100 shadow-sm">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Fiado</p>
                <p className="text-xl font-black text-zinc-900">{formatCOP(totalBorrowed)}</p>
              </div>
              <div className="bg-white p-5 rounded-[28px] border border-zinc-100 shadow-sm">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Abonado</p>
                <p className="text-xl font-black text-green-600">{formatCOP(totalPaid)}</p>
              </div>
            </div>

            {customer.totalDebt > 0 ? (
              <div className="space-y-3">
                <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest px-2">Fiados Pendientes</h3>
                {sortedTransactions.filter(t => t.type === 'debt').map(t => (
                  <div key={t.id} className="bg-white border border-zinc-100 p-5 rounded-[28px] shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-lg font-black text-zinc-900 leading-none">{formatCOP(t.amount)}</p>
                        <p className="text-xs font-bold text-zinc-400 mt-1">{formatDate(t.date)}</p>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 px-2 py-1 rounded-lg">
                        Hace {getDaysSince(t.date)} días
                      </span>
                    </div>
                    <p className="text-sm text-zinc-600 font-medium mb-4 line-clamp-2">
                      {t.description || 'Sin descripción'}
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => setShowTransactionForm({ type: 'payment' })}
                        size="sm" 
                        className="flex-1 rounded-xl bg-zinc-900 text-[10px] font-black uppercase h-10"
                      >
                        Registrar abono
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 rounded-xl text-[10px] font-black uppercase h-10 border-zinc-200"
                        onClick={() => setInvoiceTx(t)}
                      >
                        Ver Detalle
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-zinc-50 rounded-[40px] border-2 border-dashed border-zinc-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-zinc-900 font-black uppercase tracking-wider">Cliente al día</p>
                <p className="text-zinc-400 text-sm font-bold">No tiene saldos pendientes.</p>
                <Button 
                  onClick={() => setShowTransactionForm({ type: 'debt' })}
                  className="mt-6 bg-zinc-900 rounded-2xl px-8 font-black uppercase tracking-wider h-12"
                >
                  Registrar Fiado
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white p-4 rounded-[24px] border border-zinc-100 shadow-sm">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Último Fiado</p>
                <p className="text-sm font-black text-zinc-900">{lastDebt ? formatCOP(lastDebt.amount) : 'Sin registro'}</p>
                <p className="text-[10px] text-zinc-400 font-bold">{lastDebt ? formatDate(lastDebt.date) : ''}</p>
              </div>
              <div className="bg-white p-4 rounded-[24px] border border-zinc-100 shadow-sm">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Último Abono</p>
                <p className="text-sm font-black text-green-600">{lastPayment ? formatCOP(lastPayment.amount) : 'Sin registro'}</p>
                <p className="text-[10px] text-zinc-400 font-bold">{lastPayment ? formatDate(lastPayment.date) : ''}</p>
              </div>
            </div>

            {sortedTransactions.length > 0 ? (
              <div className="space-y-4 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-100">
                {sortedTransactions.map((t) => (
                  <div key={t.id} className="relative pl-14 pr-2 group">
                    <div className={`absolute left-[21px] top-4 w-2.5 h-2.5 rounded-full border-2 border-white ring-4 ring-background z-10 ${
                      t.type === 'debt' ? (getDaysSince(t.date) > 30 ? 'bg-red-500' : 'bg-purple-500') : 'bg-green-500'
                    }`} />
                    
                    <div 
                      className="bg-white border border-zinc-100 p-4 rounded-[28px] shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
                      onClick={() => setInvoiceTx(t)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                              t.type === 'debt' 
                                ? (getDaysSince(t.date) > 30 ? 'bg-red-50 text-red-600' : 'bg-purple-50 text-purple-600') 
                                : 'bg-green-50 text-green-600'
                            }`}>
                              {t.type === 'debt' ? 'Fiado' : 'Abono'}
                            </span>
                            <span className="text-[10px] font-bold text-zinc-400">
                              {formatDate(t.date)}
                            </span>
                          </div>
                          <p className="font-bold text-zinc-900 truncate text-base leading-tight uppercase">
                            {t.description || (t.type === 'debt' ? 'Sin descripción' : 'Abono recibido')}
                          </p>
                          {t.paymentMethod && (
                            <p className="text-[10px] font-bold text-zinc-400 uppercase mt-1">
                              Método: {t.paymentMethod}
                            </p>
                          )}
                          {t.note && (
                            <p className="text-[10px] font-medium text-zinc-500 italic mt-1 bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                              Nota: {t.note}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-lg font-black tracking-tighter ${
                            t.type === 'debt' ? 'text-zinc-900' : 'text-green-600'
                          }`}>
                            {t.type === 'debt' ? '+' : '-'}{formatCOP(t.amount)}
                          </p>
                          <Receipt className="w-4 h-4 text-zinc-300 ml-auto mt-1 group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-zinc-50 rounded-[40px] border-2 border-dashed border-zinc-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <History className="w-8 h-8 text-zinc-200" />
                </div>
                <p className="text-zinc-900 font-black uppercase tracking-wider">Sin movimientos</p>
                <p className="text-zinc-400 text-sm font-bold">Aún no hay registros para este cliente.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'data' && (
          <div className="bg-white border border-zinc-100 rounded-[32px] p-8 shadow-sm space-y-8">
            <div className="grid grid-cols-1 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Nombre Completo</p>
                <p className="text-lg font-black text-zinc-900">{customer.name || 'Cliente sin nombre'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Apodo / Alias</p>
                <p className="text-lg font-black text-zinc-900">{customer.nickname || 'No registrado'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Celular</p>
                <p className="text-lg font-black text-zinc-900">{customer.phone || 'No registrado'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Dirección</p>
                <p className="text-lg font-black text-zinc-900">{customer.address || 'No registrada'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Notas del Cliente</p>
                <p className="text-base font-bold text-zinc-600 leading-relaxed">
                  {customer.notes || 'Sin notas adicionales'}
                </p>
              </div>
              <div className="pt-4 border-t border-zinc-50 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">Registrado</p>
                  <p className="text-xs font-bold text-zinc-500">{formatDate(customer.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">Último Cambio</p>
                  <p className="text-xs font-bold text-zinc-500">
                    {sortedTransactions[0] ? formatDate(sortedTransactions[0].date) : 'Sin movimientos'}
                  </p>
                </div>
              </div>
            </div>
            
            <Button
              onClick={() => setShowEditForm(true)}
              variant="outline"
              className="w-full h-14 rounded-2xl border-zinc-200 text-zinc-600 font-black uppercase tracking-wider text-xs gap-2"
            >
              <Pencil className="w-4 h-4" />
              Editar Información
            </Button>
          </div>
        )}
      </div>

      {/* Footer Acciones Fijas */}
      <div className="fixed bottom-6 left-4 right-4 z-40 max-w-md mx-auto">
        <div className="bg-white/90 backdrop-blur-xl border border-zinc-200/50 p-3 rounded-[32px] shadow-2xl flex gap-3">
          <Button
            onClick={() => setShowTransactionForm({ type: 'debt' })}
            disabled={!canCreateDebt(userStatus)}
            variant="outline"
            className="flex-1 h-14 rounded-2xl border-zinc-200 font-black text-sm gap-2 hover:bg-zinc-50 text-zinc-900 disabled:opacity-50 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Registrar Fiado
          </Button>
          <Button
            onClick={() => setShowTransactionForm({ type: 'payment' })}
            disabled={!canCreateDebt(userStatus) || (customer.totalDebt || 0) <= 0}
            className="flex-1 h-14 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-black text-sm gap-2 shadow-lg shadow-zinc-200 disabled:opacity-50 transition-all active:scale-95"
          >
            <Minus className="w-5 h-5" />
            Registrar Abono
          </Button>
        </div>
      </div>

      {/* Modales */}
      {showTransactionForm && (
        <QuickTransaction
          type={showTransactionForm.type}
          customers={[]}
          selectedCustomer={customer}
          onSubmit={async (amount, desc, customerId) => {
            if (showTransactionForm.type === 'debt') {
              onAddDebt(amount, desc, new Date());
              setShowTransactionForm(null);
              return null;
            } else {
              const tx = await onAddPayment(amount, desc, new Date());
              setShowTransactionForm(null);
              if (tx) setInvoiceTx(tx);
              return tx;
            }
          }}
          onCancel={() => setShowTransactionForm(null)}
        />
      )}

      {showDeleteConfirm && (
        <DeleteConfirmDialog
          customer={customer}
          onConfirm={() => {
            onDelete();
            setShowDeleteConfirm(false);
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

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
