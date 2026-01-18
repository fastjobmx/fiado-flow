import { AlertTriangle } from 'lucide-react';
import { Customer } from '@/types/fiado';
import { Button } from '@/components/ui/button';

interface DeleteConfirmDialogProps {
  customer: Customer;
  onConfirm: () => void;
  onCancel: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const DeleteConfirmDialog = ({ customer, onConfirm, onCancel }: DeleteConfirmDialogProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-card w-full max-w-sm rounded-2xl p-6 animate-scale-in">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
        </div>

        <h2 className="text-lg font-semibold text-foreground text-center mb-2">
          ¿Eliminar cliente?
        </h2>
        
        <p className="text-muted-foreground text-center mb-4">
          Estás a punto de eliminar a <strong>{customer.name}</strong>.
          {customer.totalDebt > 0 && (
            <span className="block text-destructive mt-1">
              Este cliente tiene una deuda de {formatCurrency(customer.totalDebt)}
            </span>
          )}
        </p>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm} 
            className="flex-1"
          >
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  );
};
