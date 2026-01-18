import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface TransactionFormProps {
  type: 'debt' | 'payment';
  maxAmount?: number;
  onSubmit: (amount: number, description: string) => void;
  onCancel: () => void;
}

export const TransactionForm = ({
  type,
  maxAmount,
  onSubmit,
  onCancel,
}: TransactionFormProps) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseInt(amount.replace(/\D/g, ''), 10);
    if (numAmount > 0) {
      onSubmit(numAmount, description || (type === 'debt' ? 'Fiado' : 'Abono'));
    }
  };

  const formatAmount = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '';
    return new Intl.NumberFormat('es-CO').format(parseInt(numbers, 10));
  };

  return (
    <div className="bg-card rounded-xl p-4 border border-border mb-4 animate-slide-up">
      <h3 className="font-semibold text-foreground mb-4">
        {type === 'debt' ? '📝 Nuevo Fiado' : '✅ Registrar Pago'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">
            Monto (COP)
          </label>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(formatAmount(e.target.value))}
            className="text-lg font-semibold"
            autoFocus
          />
          {maxAmount !== undefined && type === 'payment' && (
            <p className="text-xs text-muted-foreground mt-1">
              Máximo: ${new Intl.NumberFormat('es-CO').format(maxAmount)}
            </p>
          )}
        </div>
        
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">
            Descripción (opcional)
          </label>
          <Input
            type="text"
            placeholder={type === 'debt' ? 'Ej: Arroz, aceite, huevos' : 'Ej: Abono parcial'}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
          <Button
            type="submit"
            className={`flex-1 ${type === 'debt' ? 'bg-destructive hover:bg-destructive/90' : ''}`}
            disabled={!amount}
          >
            {type === 'debt' ? 'Agregar Fiado' : 'Registrar Pago'}
          </Button>
        </div>
      </form>
    </div>
  );
};
