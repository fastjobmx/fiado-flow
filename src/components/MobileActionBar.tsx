import { Plus, Settings, Home, Users, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

interface MobileActionBarProps {
  onAddTransaction: (type: 'debt' | 'payment') => void;
  onShowSettings: () => void;
  onGoHome: () => void;
  onShowCustomers: () => void;
  onShowCollection: () => void;
  activeTab?: 'home' | 'customers' | 'payment' | 'settings';
}

export const MobileActionBar = ({ 
  onAddTransaction, 
  onShowSettings, 
  onGoHome, 
  onShowCustomers, 
  onShowCollection,
  activeTab = 'home'
}: MobileActionBarProps) => {
  const handlePress = (action: () => void, type?: 'debt' | 'payment') => {
    haptic('light');
    if (type) {
      onAddTransaction(type);
    } else {
      action();
    }
  };

  const NavButton = ({
    onClick,
    icon: Icon,
    label,
    isActive,
  }: {
    onClick: () => void;
    icon: typeof Home;
    label: string;
    isActive?: boolean;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center flex-1 min-h-[64px] gap-1.5 transition-all active:scale-95",
        "touch-manipulation", // Optimiza para touch
        isActive 
          ? "text-primary" 
          : "text-zinc-400 hover:text-zinc-600"
      )}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <div className={cn(
        "p-2 rounded-xl transition-all",
        isActive && "bg-primary/10"
      )}>
        <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
      </div>
      <span className={cn(
        "text-[11px] font-bold transition-all",
        isActive ? "scale-105" : ""
      )}>
        {label}
      </span>
    </button>
  );

  return (
    <div
      className="fixed bottom-0 left-0 right-0 border-t border-zinc-100/50 bg-white/95 backdrop-blur-xl z-50 safe-area-bottom"
      style={{ 
        paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
        paddingTop: '8px'
      }}
    >
      <div className="max-w-md mx-auto px-2 flex items-center justify-between">
        <NavButton
          onClick={() => handlePress(onGoHome)}
          icon={Home}
          label="Inicio"
          isActive={activeTab === 'home'}
        />

        <NavButton
          onClick={() => handlePress(onShowCustomers)}
          icon={Users}
          label="Clientes"
          isActive={activeTab === 'customers'}
        />

        {/* Botón principal de acción */}
        <div className="flex-1 flex flex-col items-center justify-center -mt-6 relative">
          <Button
            onClick={() => handlePress(() => {}, 'debt')}
            className={cn(
              "w-[72px] h-[72px] rounded-full shadow-lg shadow-primary/40",
              "flex items-center justify-center p-0",
              "bg-primary hover:bg-primary/90",
              "active:scale-90 transition-all duration-200",
              "border-4 border-white"
            )}
            title="Registrar fiado"
          >
            <Plus className="w-8 h-8 text-white" strokeWidth={3} />
          </Button>
          <span className="text-[10px] font-black text-primary uppercase tracking-tighter mt-1">
            Nuevo
          </span>
        </div>

        <NavButton
          onClick={() => handlePress(() => onAddTransaction('payment'))}
          icon={CreditCard}
          label="Cobrar"
          isActive={activeTab === 'payment'}
        />

        <NavButton
          onClick={() => handlePress(onShowSettings)}
          icon={Settings}
          label="Más"
          isActive={activeTab === 'settings'}
        />
      </div>
    </div>
  );
};