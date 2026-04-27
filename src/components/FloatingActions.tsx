import { useState } from 'react';
import { Plus, UserPlus, DollarSign, X, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingActionsProps {
  onAddCustomer: () => void;
  onAddDebt: () => void;
  canAddCustomer: boolean;
  canAddDebt: boolean;
  className?: string;
}

export const FloatingActions = ({
  onAddCustomer,
  onAddDebt,
  canAddCustomer,
  canAddDebt,
  className,
}: FloatingActionsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsOpen(false);
  };

  return (
    <div className={cn("fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3", className)}>
      {/* Acciones secundarias */}
      <div
        className={cn(
          "flex flex-col gap-2 transition-all duration-300 ease-out",
          isOpen 
            ? "opacity-100 translate-y-0 pointer-events-auto" 
            : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        {/* Botón ir arriba */}
        <button
          onClick={scrollToTop}
          className="flex items-center gap-3 group"
        >
          <span className="text-sm font-medium text-zinc-600 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
            Ir arriba
          </span>
          <div className="w-12 h-12 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex items-center justify-center shadow-lg transition-all hover:scale-110">
            <ArrowUp className="w-5 h-5" />
          </div>
        </button>

        {/* Botón nuevo cliente */}
        {canAddCustomer && (
          <button
            onClick={() => handleAction(onAddCustomer)}
            className="flex items-center gap-3 group"
          >
            <span className="text-sm font-medium text-zinc-600 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
              Nuevo cliente
            </span>
            <div className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 transition-all hover:scale-110">
              <UserPlus className="w-5 h-5" />
            </div>
          </button>
        )}

        {/* Botón registrar fiado */}
        {canAddDebt && (
          <button
            onClick={() => handleAction(onAddDebt)}
            className="flex items-center gap-3 group"
          >
            <span className="text-sm font-medium text-zinc-600 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
              Registrar fiado
            </span>
            <div className="w-12 h-12 rounded-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center shadow-lg shadow-primary/30 transition-all hover:scale-110">
              <DollarSign className="w-5 h-5" />
            </div>
          </button>
        )}
      </div>

      {/* Botón principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-105",
          isOpen 
            ? "bg-zinc-900 text-white rotate-45" 
            : "bg-primary text-primary-foreground shadow-primary/40"
        )}
        aria-label={isOpen ? "Cerrar menú" : "Abrir menú de acciones"}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Plus className="w-6 h-6" />
        )}
      </button>

      {/* Hint tooltip */}
      {!isOpen && (
        <div className="absolute -top-10 right-0 bg-zinc-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap animate-in fade-in slide-in-from-bottom-2">
          Acciones rápidas
          <div className="absolute -bottom-1 right-5 w-2 h-2 bg-zinc-900 rotate-45" />
        </div>
      )}
    </div>
  );
};
