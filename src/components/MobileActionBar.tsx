import { Plus, Settings, Home, Users, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileActionBarProps {
  onAddTransaction: (type: 'debt' | 'payment') => void;
  onShowSettings: () => void;
  onGoHome: () => void;
  onShowCustomers: () => void;
  onShowCollection: () => void;
}

export const MobileActionBar = ({ 
  onAddTransaction, 
  onShowSettings, 
  onGoHome, 
  onShowCustomers, 
  onShowCollection 
}: MobileActionBarProps) => {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 border-t border-zinc-100 bg-white/95 backdrop-blur-md z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-md mx-auto px-2 py-2 flex items-center justify-between gap-1">
        <button
          onClick={onGoHome}
          className="flex flex-col items-center justify-center flex-1 h-14 gap-1 text-zinc-500 hover:text-primary transition-colors"
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold">Inicio</span>
        </button>

        <button
          onClick={onShowCustomers}
          className="flex flex-col items-center justify-center flex-1 h-14 gap-1 text-zinc-500 hover:text-primary transition-colors"
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-bold">Clientes</span>
        </button>

        <div className="flex-1 flex flex-col items-center justify-center -mt-8 relative">
          <Button
            onClick={() => onAddTransaction('debt')}
            className="w-16 h-16 rounded-full shadow-lg shadow-primary/30 flex items-center justify-center p-0 bg-primary hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all mb-1"
            title="Registrar fiado"
          >
            <Plus className="w-8 h-8 text-white" />
          </Button>
          <span className="text-[10px] font-black text-primary uppercase tracking-tighter">Fiado</span>
        </div>

        <button
          onClick={() => onAddTransaction('payment')}
          className="flex flex-col items-center justify-center flex-1 h-14 gap-1 text-zinc-500 hover:text-primary transition-colors"
        >
          <CreditCard className="w-5 h-5" />
          <span className="text-[10px] font-bold">Abono</span>
        </button>

        <button
          onClick={onShowSettings}
          className="flex flex-col items-center justify-center flex-1 h-14 gap-1 text-zinc-500 hover:text-primary transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-bold">Ajustes</span>
        </button>
      </div>
    </div>
  );
};