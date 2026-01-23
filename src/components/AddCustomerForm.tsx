import { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AddCustomerFormProps {
  onSubmit: (name: string, phone: string) => void;
  onCancel: () => void;
}

export const AddCustomerForm = ({ onSubmit, onCancel }: AddCustomerFormProps) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && phone.trim()) {
      onSubmit(name.trim(), phone.replace(/\D/g, ''));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50 animate-fade-in">
      <div className="bg-background w-full rounded-t-2xl p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Nuevo Cliente</h2>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">
              Nombre completo
            </label>
            <Input
              type="text"
              placeholder="Ej: María García"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">
              Número de celular
            </label>
            <div className="flex items-center gap-2">
              <div className="px-3 py-2 rounded-md border border-border bg-card text-sm text-muted-foreground shrink-0">
                +57
              </div>
              <Input
                type="tel"
                inputMode="numeric"
                placeholder="3001234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                autoComplete="tel"
                maxLength={10}
                className="flex-1"
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Ingresa 10 dígitos, sin espacios ni guiones.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={!name.trim() || !phone.trim()}>
              Agregar Cliente
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
