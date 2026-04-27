import { useState } from 'react';
import { Plus, UserPlus, DollarSign, ArrowUp, X, Receipt, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { MobileBottomSheet } from './MobileBottomSheet';

interface QuickActionSheetProps {
  onAddCustomer: () => void;
  onAddDebt: () => void;
  onAddPayment: () => void;
  onScrollToTop: () => void;
  canAddCustomer: boolean;
  canAddDebt: boolean;
  className?: string;
}

export const QuickActionSheet = ({
  onAddCustomer,
  onAddDebt,
  onAddPayment,
  onScrollToTop,
  canAddCustomer,
  canAddDebt,
  className,
}: QuickActionSheetProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (action: () => void) => {
    haptic('medium');
    setIsOpen(false);
    setTimeout(action, 300); // Esperar cierre de sheet
  };

  const actions = [
    {
      id: 'debt',
      label: 'Registrar Fiado',
      description: 'Agregar deuda a un cliente',
      icon: Receipt,
      color: 'bg-rose-500',
      onClick: () => handleAction(onAddDebt),
      disabled: !canAddDebt,
    },
    {
      id: 'payment',
      label: 'Registrar Abono',
      description: 'Cliente realiza un pago',
      icon: DollarSign,
      color: 'bg-emerald-500',
      onClick: () => handleAction(onAddPayment),
      disabled: !canAddDebt,
    },
    {
      id: 'customer',
      label: 'Nuevo Cliente',
      description: 'Agregar cliente a la lista',
      icon: UserPlus,
      color: 'bg-blue-500',
      onClick: () => handleAction(onAddCustomer),
      disabled: !canAddCustomer,
    },
    {
      id: 'top',
      label: 'Ir al Inicio',
      description: 'Volver arriba de la lista',
      icon: ArrowUp,
      color: 'bg-zinc-500',
      onClick: () => handleAction(onScrollToTop),
      disabled: false,
    },
  ];

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={() => {
          haptic('light');
          setIsOpen(true);
        }}
        className={cn(
          "fixed bottom-24 right-4 z-40",
          "w-14 h-14 rounded-full bg-primary text-white",
          "flex items-center justify-center shadow-lg shadow-primary/30",
          "active:scale-90 transition-all duration-200",
          className
        )}
        style={{
          boxShadow: '0 4px 20px rgba(14, 165, 233, 0.4)',
        }}
      >
        <Plus className="w-7 h-7" strokeWidth={2.5} />
      </button>

      {/* Action Sheet */}
      <MobileBottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Acciones Rápidas"
      >
        <div className="space-y-3 pt-2">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              disabled={action.disabled}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl transition-all",
                "active:scale-[0.98]",
                action.disabled
                  ? "opacity-40 cursor-not-allowed bg-zinc-100"
                  : "hover:bg-zinc-50 active:bg-zinc-100"
              )}
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                  action.color,
                  "text-white shadow-lg"
                )}
              >
                <action.icon className="w-6 h-6" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-zinc-900">{action.label}</h3>
                <p className="text-sm text-zinc-500">{action.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Botón cancelar */}
        <button
          onClick={() => setIsOpen(false)}
          className="w-full mt-6 py-4 rounded-2xl bg-zinc-100 hover:bg-zinc-200 font-bold text-zinc-700 transition-all active:scale-[0.98]"
        >
          Cancelar
        </button>
      </MobileBottomSheet>
    </>
  );
};
