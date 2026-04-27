import { AlertTriangle, Clock, Copy, CheckCircle, Wallet, MessageSquare, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatCOP, formatDate } from '@/lib/utils';

interface MaintenanceBannerProps {
  status: 'open' | 'overdue' | 'paid';
  amount: number;
  dueDate: string;
  graceUntil: string;
  isSuspended?: boolean;
  planType?: 'free' | 'trial' | 'pro';
}

const ADMIN_WHATSAPP = '+573022323472';

export const MaintenanceBanner = ({ 
  status, 
  amount, 
  dueDate, 
  graceUntil, 
  isSuspended = false,
  planType = 'pro' 
}: MaintenanceBannerProps) => {
  const [copied, setCopied] = useState(false);

  // Si el valor es $0, no mostrar "Pago vencido"
  if (amount === 0) {
    if (planType === 'free') {
      return (
        <div className="bg-zinc-100 border border-zinc-200 rounded-3xl p-4 mb-6 animate-fade-in">
          <div className="flex items-center gap-3 text-zinc-600">
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-bold">Plan gratis activo</p>
              <p className="text-[11px] font-medium opacity-70">Disfruta de todas las funciones básicas.</p>
            </div>
          </div>
        </div>
      );
    }
    if (planType === 'trial') {
      return (
        <div className="bg-primary/10 border border-primary/20 rounded-3xl p-4 mb-6 animate-fade-in">
          <div className="flex items-center gap-3 text-primary">
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold">Prueba activa hasta {formatDate(dueDate)}</p>
              <p className="text-[11px] font-medium opacity-70">Aprovecha todas las funciones PRO.</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  if (status === 'paid') return null;

  const copyPaymentMessage = () => {
    const message = `Hola, realicé el pago del mantenimiento mensual de FIADO por ${formatCOP(amount)}. Adjunto comprobante.`;
    navigator.clipboard.writeText(message);
    setCopied(true);
    toast.success('Mensaje copiado');
    setTimeout(() => setCopied(false), 2000);
  };

  const openWhatsApp = () => {
    const message = encodeURIComponent(
      `Hola, realicé el pago del mantenimiento mensual de FIADO por ${formatCOP(amount)}. Adjunto comprobante.`
    );
    window.open(`https://wa.me/${ADMIN_WHATSAPP.replace(/\+/g, '')}?text=${message}`, '_blank');
  };

  const isOverdue = status === 'overdue';

  return (
    <div className={`rounded-3xl p-6 mb-8 animate-slide-up shadow-sm border-2 ${
      isSuspended 
        ? 'bg-red-50 border-red-200' 
        : isOverdue 
          ? 'bg-orange-50 border-orange-200' 
          : 'bg-zinc-50 border-zinc-100'
    }`}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl shadow-sm ${
            isSuspended ? 'bg-red-100 text-red-600' : isOverdue ? 'bg-orange-100 text-orange-600' : 'bg-white text-zinc-600'
          }`}>
            {isSuspended ? <AlertTriangle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`text-lg font-black tracking-tight ${
              isSuspended ? 'text-red-900' : isOverdue ? 'text-orange-900' : 'text-zinc-900'
            }`}>
              {isSuspended ? 'Cuenta suspendida' : isOverdue ? 'Mantenimiento vencido' : 'Mantenimiento próximo'}
            </h3>
            <p className="text-sm font-medium text-zinc-500 mt-1 leading-snug">
              {isSuspended 
                ? 'Tu cuenta está suspendida por mantenimiento vencido. Tus datos están seguros. Reactiva tu cuenta para continuar.'
                : `Tu plan venció el ${formatDate(dueDate)}. Reactiva tu cuenta para seguir usando FIADO sin interrupciones.`
              }
            </p>
          </div>
        </div>

        <div className="bg-white/50 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Valor a pagar</p>
            <p className="text-2xl font-black text-zinc-900">{formatCOP(amount)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Límite</p>
            <p className="text-sm font-bold text-zinc-900">{formatDate(graceUntil)}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button 
              onClick={copyPaymentMessage}
              variant="outline"
              className="flex-1 h-12 rounded-2xl border-zinc-200 font-bold text-xs gap-2 hover:bg-zinc-100"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              Copiar mensaje
            </Button>
            <Button 
              onClick={openWhatsApp}
              className="flex-1 h-12 rounded-2xl bg-green-600 hover:bg-green-700 font-bold text-xs gap-2 shadow-sm"
            >
              <MessageSquare className="w-4 h-4" />
              Enviar WhatsApp
            </Button>
          </div>
          <Button 
            variant="ghost"
            className="h-10 text-zinc-400 font-bold text-xs hover:text-zinc-900"
            onClick={() => toast.info('Estamos verificando tu pago. Esto puede tardar unos minutos.')}
          >
            Ya pagué
          </Button>
        </div>
      </div>
    </div>
  );
};
