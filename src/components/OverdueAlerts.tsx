import { AlertTriangle, Clock, MessageSquare, Phone } from 'lucide-react';
import { Customer } from '@/types/fiado';
import { formatCOP, getDaysSince, buildCustomerPaymentMessage, normalizePhoneToColombia, getDebtStatus, getStatusColor } from '@/lib/utils';
import { Button } from './ui/button';

interface OverdueAlertsProps {
  customers: Customer[];
  onCustomerClick: (customer: Customer) => void;
  storeName?: string;
}

export const OverdueAlerts = ({ customers, onCustomerClick, storeName = 'Mi Tienda' }: OverdueAlertsProps) => {
  if (customers.length === 0) {
    return (
      <div className="bg-green-50 rounded-3xl p-6 border border-green-100 animate-slide-up">
        <div className="flex items-center gap-3 text-green-600 mb-2">
          <div className="p-2 bg-green-100 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <span className="font-bold">Todo al día</span>
        </div>
        <p className="text-sm text-green-700 font-medium">
          No tienes clientes con más de 15 días sin pagar.
        </p>
      </div>
    );
  }

  const handleWhatsApp = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    if (!customer.phone) return;
    
    const message = buildCustomerPaymentMessage(customer.name || 'Cliente', customer.totalDebt, storeName);
    const phone = normalizePhoneToColombia(customer.phone);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm animate-slide-up">
      <div className="flex items-center gap-3 text-zinc-900 mb-1">
        <div className="p-2 bg-zinc-100 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <span className="font-bold">Alertas de cobro</span>
      </div>
      <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider mb-4 ml-12">
        Clientes que llevan más de 15 días sin pagar
      </p>

      <div className="space-y-3">
        {customers.slice(0, 5).map((customer) => {
          const days = getDaysSince(customer.lastPaymentDate || customer.createdAt);
          const status = getDebtStatus(days);
          const statusColorClass = getStatusColor(status);
          
          return (
            <div
              key={customer.id}
              onClick={() => onCustomerClick(customer)}
              className="w-full flex flex-col p-4 bg-zinc-50 rounded-2xl hover:bg-zinc-100 transition-all border border-transparent hover:border-zinc-200 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="min-w-0">
                  <p className="font-bold text-zinc-900 truncate">{customer.name || 'Cliente sin nombre'}</p>
                  <p className={`text-xs font-bold flex items-center gap-1 ${statusColorClass.split(' ')[0]}`}>
                    <Clock className="w-3 h-3" />
                    {days} días sin pagar
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-zinc-900">
                    {formatCOP(customer.totalDebt)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-1">
                <Button 
                  size="sm" 
                  className="flex-1 h-10 rounded-xl font-bold text-xs bg-zinc-900 hover:bg-zinc-800"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCustomerClick(customer);
                  }}
                >
                  Cobrar
                </Button>
                {customer.phone ? (
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1 h-10 rounded-xl font-bold text-xs border-zinc-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                    onClick={(e) => handleWhatsApp(e, customer)}
                  >
                    <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-green-600" />
                    WhatsApp
                  </Button>
                ) : (
                  <div className="flex-1 h-10 rounded-xl border border-dashed border-zinc-200 flex items-center justify-center text-[10px] text-zinc-400 font-bold">
                    <Phone className="w-3 h-3 mr-1" />
                    Sin celular
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
