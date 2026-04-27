import { X, Download, Share2, Printer } from 'lucide-react';
import { useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Customer, Transaction } from '@/types/fiado';
import { formatTemplate, encodeWhatsAppMessage } from '@/lib/messages';

interface InvoiceModalProps {
  storeName: string;
  logoUrl?: string | null;
  contacts: {
    whatsapp_number?: string;
    nequi_number?: string;
    daviplata_number?: string;
  };
  templates: {
    receiptTemplate: string;
  };
  customer: Customer;
  transaction: Transaction;
  remainingDebt: number;
  onClose: () => void;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

// Helper para formatear fechas de forma segura
const formatDateSafe = (date: Date | string | null | undefined): string => {
  if (!date) return 'Fecha no disponible';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Fecha no disponible';
    return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
  } catch (e) {
    return 'Fecha no disponible';
  }
};

export const InvoiceModal = ({
  storeName,
  logoUrl,
  contacts,
  templates,
  customer,
  transaction,
  remainingDebt,
  onClose,
}: InvoiceModalProps) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const receiptText = useMemo(() => {
    // Manejo seguro de fecha inválida
    let formattedDate = 'Fecha no disponible';
    try {
      if (transaction.date && !isNaN(new Date(transaction.date).getTime())) {
        formattedDate = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(transaction.date));
      }
    } catch (e) {
      console.error('[InvoiceModal] Fecha inválida:', transaction.date);
    }

    const context = {
      transaction_id: transaction.id,
      store_name: storeName,
      customer_name: customer.name,
      amount: formatCurrency(transaction.amount),
      date: formattedDate,
      remaining: formatCurrency(remainingDebt),
      nequi: contacts.nequi_number || '',
      daviplata: contacts.daviplata_number || '',
      whatsapp: contacts.whatsapp_number || '',
    };
    return formatTemplate(templates.receiptTemplate, context);
  }, [templates.receiptTemplate, storeName, customer, transaction, remainingDebt, contacts]);

  const printInvoice = () => {
    const html = contentRef.current?.innerHTML || '';
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html>
        <head>
          <title>Recibo ${transaction.id}</title>
          <style>
            body { font-family: system-ui, -apple-system, Segoe UI, Roboto; padding: 24px; }
            .card { max-width: 420px; margin: 0 auto; border: 1px solid #ddd; border-radius: 12px; padding: 20px; }
            .header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
            .logo { width: 40px; height: 40px; border-radius: 8px; object-fit: cover; }
            .row { display: flex; justify-content: space-between; margin: 6px 0; }
            .title { font-weight: 600; font-size: 18px; margin-bottom: 12px; }
            .muted { color: #666; font-size: 12px; }
            .divider { border-top: 1px dashed #ccc; margin: 10px 0; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${html}
        </body>
      </html>
    `);
    w.document.close();
  };

  const shareWhatsApp = () => {
    const number = customer.phone;
    const url = `https://wa.me/57${number}?text=${encodeWhatsAppMessage(receiptText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">Comprobante</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>

          <div 
            ref={contentRef} 
            className="bg-zinc-50 rounded-[24px] p-6 border border-zinc-100 relative overflow-hidden"
          >
            {/* Marca de agua decorativa */}
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] rotate-12">
              <Share2 className="w-32 h-32" />
            </div>

            <div className="flex items-center gap-4 mb-6 relative">
              {logoUrl ? (
                <img src={logoUrl} className="w-12 h-12 rounded-2xl object-cover shadow-sm" />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-white font-black text-xl">
                  {storeName.charAt(0)}
                </div>
              )}
              <div>
                <div className="font-black text-zinc-900 leading-tight">{storeName}</div>
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                  Recibo #{transaction.id.slice(0, 8)}
                </div>
              </div>
            </div>

            <div className="space-y-4 relative">
              <div className="flex justify-between items-baseline border-b border-zinc-200/50 pb-2">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Cliente</span>
                <span className="font-bold text-zinc-900">{customer.name}</span>
              </div>
              
              <div className="flex justify-between items-baseline border-b border-zinc-200/50 pb-2">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Fecha</span>
                <span className="font-bold text-zinc-900">
                  {formatDateSafe(transaction.date)}
                </span>
              </div>

              <div className="pt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    {transaction.type === 'debt' ? 'Monto Fiado' : 'Monto Pagado'}
                  </span>
                  <span className={`text-2xl font-black ${transaction.type === 'debt' ? 'text-zinc-900' : 'text-green-600'}`}>
                    {formatCurrency(transaction.amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Saldo Restante</span>
                  <span className="text-sm font-bold text-zinc-500">
                    {formatCurrency(remainingDebt)}
                  </span>
                </div>
              </div>
            </div>

            {(contacts.nequi_number || contacts.daviplata_number) && (
              <div className="mt-6 pt-4 border-t border-zinc-200 border-dashed">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2 text-center">Medios de Pago</p>
                <div className="flex justify-center gap-4">
                  {contacts.nequi_number && (
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] font-bold text-zinc-400 uppercase">Nequi</span>
                      <span className="text-[11px] font-black text-zinc-700">{contacts.nequi_number}</span>
                    </div>
                  )}
                  {contacts.daviplata_number && (
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] font-bold text-zinc-400 uppercase">Daviplata</span>
                      <span className="text-[11px] font-black text-zinc-700">{contacts.daviplata_number}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <Button 
              onClick={shareWhatsApp} 
              className="h-14 rounded-2xl bg-[#25D366] hover:bg-[#128C7E] text-white font-black gap-2 shadow-lg shadow-green-100 transition-all active:scale-95"
            >
              <Share2 className="w-5 h-5" />
              WhatsApp
            </Button>
            <Button 
              onClick={printInvoice} 
              variant="outline" 
              className="h-14 rounded-2xl border-zinc-200 font-bold text-zinc-600 gap-2 hover:bg-zinc-50 transition-all active:scale-95"
            >
              <Download className="w-5 h-5" />
              Descargar
            </Button>
          </div>
          
          <Button 
            onClick={onClose} 
            variant="ghost" 
            className="w-full mt-2 h-12 rounded-xl text-zinc-400 font-bold hover:text-zinc-900"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};