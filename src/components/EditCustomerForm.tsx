import { useState } from 'react';
import { X, User, Phone, Tag, MapPin, FileText } from 'lucide-react';
import { Customer } from '@/types/fiado';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { normalizePhoneToColombia } from '@/lib/utils';

interface EditCustomerFormProps {
  customer: Customer;
  onSubmit: (data: Partial<Customer>) => void;
  onCancel: () => void;
}

export const EditCustomerForm = ({ customer, onSubmit, onCancel }: EditCustomerFormProps) => {
  const [formData, setFormData] = useState({
    name: customer.name || '',
    phone: customer.phone || '',
    nickname: customer.nickname || '',
    address: customer.address || '',
    notes: customer.notes || '',
    creditLimit: customer.creditLimit || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSubmit({
        ...formData,
        name: formData.name.trim(),
        phone: normalizePhoneToColombia(formData.phone),
        nickname: formData.nickname.trim(),
        address: formData.address.trim(),
        notes: formData.notes.trim(),
        creditLimit: Number(formData.creditLimit),
      });
    }
  };

  const handleChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-md rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-zinc-900">Editar Cliente</h2>
          <button onClick={onCancel} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">
              Nombre completo
            </Label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ej: Pedro Pérez"
                className="h-14 pl-11 bg-zinc-50 border-zinc-100 rounded-2xl font-bold"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nickname" className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">
              Apodo / Alias
            </Label>
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                id="nickname"
                value={formData.nickname}
                onChange={(e) => handleChange('nickname', e.target.value)}
                placeholder="Ej: Don Pedro"
                className="h-14 pl-11 bg-zinc-50 border-zinc-100 rounded-2xl font-bold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">
              Teléfono Celular
            </Label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="Ej: 3001234567"
                className="h-14 pl-11 bg-zinc-50 border-zinc-100 rounded-2xl font-bold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address" className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">
              Dirección
            </Label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Ej: Calle 123 # 45-67"
                className="h-14 pl-11 bg-zinc-50 border-zinc-100 rounded-2xl font-bold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="creditLimit" className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">
              Límite de fiado (Opcional)
            </Label>
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                id="creditLimit"
                type="number"
                value={formData.creditLimit}
                onChange={(e) => handleChange('creditLimit', e.target.value)}
                placeholder="Ej: 50000"
                className="h-14 pl-11 bg-zinc-50 border-zinc-100 rounded-2xl font-bold"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">
              Notas adicionales
            </Label>
            <div className="relative">
              <FileText className="absolute left-4 top-4 w-4 h-4 text-zinc-400" />
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Ej: Siempre paga los sábados, familiar de Doña Rosa"
                className="w-full min-h-[100px] pl-11 pr-4 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl font-medium text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel} 
              className="flex-1 h-14 rounded-2xl border-zinc-200 font-bold text-zinc-500 hover:bg-zinc-50"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1 h-14 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-black uppercase tracking-wider text-xs shadow-lg shadow-zinc-200"
            >
              Guardar Cambios
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
