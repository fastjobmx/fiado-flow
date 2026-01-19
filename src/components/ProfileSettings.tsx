import { useState } from 'react';
import { X, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProfileSettingsProps {
  currentStoreName: string;
  onSave: (storeName: string) => void;
  onClose: () => void;
}

export const ProfileSettings = ({ currentStoreName, onSave, onClose }: ProfileSettingsProps) => {
  const [storeName, setStoreName] = useState(currentStoreName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (storeName.trim()) {
      onSave(storeName.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Configuración</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="storeName">Nombre de tu tienda</Label>
            <Input
              id="storeName"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Ej: Tienda Don José"
              className="h-12"
              autoFocus
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={!storeName.trim()}>
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
