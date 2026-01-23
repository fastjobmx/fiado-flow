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
    const context = {
      transaction_id: transaction.id,
      store_name: storeName,
      customer_name: customer.name,
      amount: formatCurrency(transaction.amount),
      date: new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(transaction.date),
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
    <div className="fixed inset-0 bg-black/50 flex items-end z-50 animate-fade-in">
      <div className="bg-background w-full rounded-t-2xl p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recibo del pago</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>

        <div ref={contentRef} className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3 mb-2">
            {logoUrl ? <img src={logoUrl} className="w-10 h-10 rounded-lg object-cover" /> : null}
            <div>
              <div className="font-semibold">{storeName}</div>
              <div className="text-xs text-muted-foreground">Recibo #{transaction.id}</div>
            </div>
          </div>
          <div className="divider" />
          <div className="row"><span>Cliente</span><span className="font-medium">{customer.name}</span></div>
          <div className="row"><span>Teléfono</span><span>{customer.phone}</span></div>
          <div className="row"><span>Fecha</span><span>{new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(transaction.date)}</span></div>
          <div className="divider" />
          <div className="row"><span>Monto pagado</span><span className="font-semibold">{formatCurrency(transaction.amount)}</span></div>
          <div className="row"><span>Saldo restante</span><span className="font-semibold">{formatCurrency(remainingDebt)}</span></div>
          <div className="divider" />
          <div className="muted">
            Pagos: Nequi {contacts.nequi_number || 'N/A'} · Daviplata {contacts.daviplata_number || 'N/A'}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <Button onClick={printInvoice} className="gap-2"><Printer className="w-4 h-4" /> Imprimir/Descargar</Button>
          <Button onClick={shareWhatsApp} variant="outline" className="gap-2"><Share2 className="w-4 h-4" /> WhatsApp</Button>
          <Button onClick={onClose} variant="ghost">Cerrar</Button>
        </div>
      </div>
    </div>
  );
};