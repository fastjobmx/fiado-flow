import { AlertTriangle, Clock, Copy, CheckCircle, Wallet } from 'lucide-react';
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
    <div className={`rounded-xl p-4 mb-4 shadow-sm ${isOverdue ? 'bg-destructive/10 border-2 border-destructive/30' : 'bg-amber-50 border-2 border-amber-200'}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${isOverdue ? 'bg-destructive/20' : 'bg-amber-100'}`}>
          {isOverdue ? (
            <AlertTriangle className="w-5 h-5 text-destructive" />
          ) : (
            <Wallet className="w-5 h-5 text-amber-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`font-semibold text-sm ${isOverdue ? 'text-destructive' : 'text-amber-800'}`}>
              {isOverdue ? '⚠️ Pago Vencido' : '💳 Recordatorio de Pago'}
            </p>
          </div>
          <p className={`text-base font-bold mt-1 ${isOverdue ? 'text-destructive' : 'text-amber-900'}`}>
            {formatCurrency(amount)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isOverdue 
              ? <>Límite para reactivar: <span className="font-medium text-destructive">{formatDate(graceUntil)}</span></>
              : <>Vence el <span className="font-medium">{formatDate(dueDate)}</span> • Mantenimiento mensual</>
            }
          </p>
          <div className="flex gap-2 mt-3">
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 text-xs gap-1.5 flex-1" 
              onClick={copyPaymentMessage}
            >
              {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              Copiar mensaje
            </Button>
            <Button 
              size="sm" 
              className={`h-8 text-xs flex-1 ${isOverdue ? 'bg-destructive hover:bg-destructive/90' : 'bg-green-600 hover:bg-green-700'}`}
              onClick={openWhatsApp}
            >
              Enviar WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
