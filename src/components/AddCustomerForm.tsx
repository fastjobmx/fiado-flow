import { useState } from 'react';
import { UserPlus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AddCustomerFormProps {
  onSubmit: (name: string, phone: string, nickname?: string, address?: string, notes?: string, creditLimit?: number) => void;
  onCancel: () => void;
}

export const AddCustomerForm = ({ onSubmit, onCancel }: AddCustomerFormProps) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nickname, setNickname] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [showExtras, setShowExtras] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(
        name.trim(), 
        phone.replace(/\D/g, ''),
        nickname.trim() || undefined,
        address.trim() || undefined,
        notes.trim() || undefined,
        undefined
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full sm:max-w-md sm:rounded-[32px] rounded-t-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle visual para mobile */}
        <div className="w-12 h-1 bg-zinc-200 rounded-full mx-auto mb-6 sm:hidden" />
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-black text-zinc-900">Agregar cliente</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre - Obligatorio */}
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-2">
              Nombre completo *
            </label>
            <Input
              type="text"
              placeholder="Ej: María García"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-14 text-base font-medium rounded-2xl border-2 border-zinc-200 focus:border-primary"
              autoFocus
              required
            />
          </div>

          {/* Celular - Importante para WhatsApp */}
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-2">
              Número de celular
            </label>
            <div className="flex items-center gap-2">
              <span className="h-14 px-4 flex items-center rounded-2xl bg-zinc-100 text-sm font-bold text-zinc-600">
                +57
              </span>
              <Input
                type="tel"
                inputMode="numeric"
                placeholder="3001234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
                className="h-14 text-base font-medium rounded-2xl border-2 border-zinc-200 focus:border-primary flex-1"
              />
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Necesario para enviar recordatorios por WhatsApp
            </p>
          </div>

          {/* Campos opcionales colapsables */}
          <button
            type="button"
            onClick={() => setShowExtras(!showExtras)}
            className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 py-2"
          >
            {showExtras ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showExtras ? 'Ocultar datos opcionales' : 'Agregar más datos (opcional)'}
          </button>

          {showExtras && (
            <div className="space-y-4 animate-in slide-in-from-top-2">
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">
                  Apodo / Cómo lo conoces
                </label>
                <Input
                  placeholder="Ej: Doña María, el del negocio de la esquina"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="h-14 text-base font-medium rounded-2xl border-2 border-zinc-200 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">
                  Dirección
                </label>
                <Input
                  placeholder="Ej: Calle 123 # 45-67, barrio Centro"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-14 text-base font-medium rounded-2xl border-2 border-zinc-200 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">
                  Notas
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Paga los sábados, tiene 3 hijos, vive cerca..."
                  className="w-full h-24 p-4 text-base font-medium rounded-2xl border-2 border-zinc-200 focus:border-primary focus:outline-none resize-none"
                />
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel} 
              className="flex-1 h-14 rounded-2xl border-2 border-zinc-200 font-bold text-zinc-600"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1 h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-base"
              disabled={!name.trim()}
            >
              Guardar cliente
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
