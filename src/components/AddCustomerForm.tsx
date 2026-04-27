import { useState } from 'react';
import { UserPlus, X, Tag, MapPin, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  const [creditLimit, setCreditLimit] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(
        name.trim(), 
        phone.replace(/\D/g, ''),
        nickname.trim(),
        address.trim(),
        notes.trim(),
        creditLimit ? Number(creditLimit) : 0
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-md rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-black text-zinc-900">Nuevo Cliente</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">
              Nombre completo
            </Label>
            <Input
              type="text"
              placeholder="Ej: María García"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-14 bg-zinc-50 border-zinc-100 rounded-2xl font-bold"
              autoComplete="name"
              autoFocus
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">
              Apodo / Alias
            </Label>
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Ej: Doña María"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="h-14 pl-11 bg-zinc-50 border-zinc-100 rounded-2xl font-bold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">
              Número de celular
            </Label>
            <div className="flex items-center gap-2">
              <div className="h-14 px-4 flex items-center justify-center rounded-2xl border border-zinc-100 bg-zinc-50 text-sm font-bold text-zinc-400 shrink-0">
                +57
              </div>
              <Input
                type="tel"
                inputMode="numeric"
                placeholder="3001234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
                className="h-14 bg-zinc-50 border-zinc-100 rounded-2xl font-bold flex-1"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">
              Dirección
            </Label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Ej: Calle 123 # 45-67"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="h-14 pl-11 bg-zinc-50 border-zinc-100 rounded-2xl font-bold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">
              Límite de fiado (Opcional)
            </Label>
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                type="number"
                placeholder="Ej: 50000"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                className="h-14 pl-11 bg-zinc-50 border-zinc-100 rounded-2xl font-bold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">
              Notas adicionales
            </Label>
            <div className="relative">
              <FileText className="absolute left-4 top-4 w-4 h-4 text-zinc-400" />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Paga siempre los sábados"
                className="w-full min-h-[100px] pl-11 pr-4 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl font-medium text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-14 rounded-2xl border-zinc-200 font-bold text-zinc-500">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 h-14 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-black" disabled={!name.trim()}>
              Crear Cliente
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
