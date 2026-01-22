import { AlertTriangle, Clock, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MaintenanceBannerProps {
  status: 'open' | 'overdue' | 'paid';
  amount: number;
  dueDate: string;
  graceUntil: string;
}

const ADMIN_WHATSAPP = '+573001234567';

export const MaintenanceBanner = ({ status, amount, dueDate, graceUntil }: MaintenanceBannerProps) => {
  const [copied, setCopied] = useState(false);

  if (status === 'paid') return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
    });
  };

  const copyPaymentMessage = () => {
    const message = `Hola, realicé el pago del mantenimiento mensual de Fiado Friendly por ${formatCurrency(amount)}. Adjunto comprobante.`;
    navigator.clipboard.writeText(message);
    setCopied(true);
    toast.success('Mensaje copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  const openWhatsApp = () => {
    const message = encodeURIComponent(
      `Hola, realicé el pago del mantenimiento mensual de Fiado Friendly por ${formatCurrency(amount)}. Adjunto comprobante.`
    );
    window.open(`https://wa.me/${ADMIN_WHATSAPP.replace(/\+/g, '')}?text=${message}`, '_blank');
  };

  const isOverdue = status === 'overdue';

  return (
    <div className={`rounded-lg p-3 mb-4 ${isOverdue ? 'bg-destructive/10 border border-destructive/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
      <div className="flex items-start gap-3">
        {isOverdue ? (
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        ) : (
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-sm ${isOverdue ? 'text-destructive' : 'text-amber-700'}`}>
            {isOverdue ? 'Pago Vencido' : 'Pago Pendiente'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isOverdue 
              ? `Límite: ${formatDate(graceUntil)} • ${formatCurrency(amount)}`
              : `Vence: ${formatDate(dueDate)} • ${formatCurrency(amount)}`
            }
          </p>
          <div className="flex gap-2 mt-2">
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={copyPaymentMessage}>
              {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              Copiar mensaje
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={openWhatsApp}>
              WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
