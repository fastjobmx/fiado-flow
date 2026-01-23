import { Plus, Settings, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileActionBarProps {
  onAddCustomer: () => void;
  onShowSummary: () => void;
  onShowSettings: () => void;
}

export const MobileActionBar = ({ onAddCustomer, onShowSummary, onShowSettings }: MobileActionBarProps) => {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-md mx-auto px-4 py-3 grid grid-cols-3 gap-3">
        <Button
          onClick={onShowSummary}
          variant="outline"
          className="h-12 gap-2"
          title="Resumen"
        >
          <BarChart3 className="w-5 h-5" />
          Resumen
        </Button>
        <Button
          onClick={onAddCustomer}
          className="h-12 gap-2"
          title="Agregar cliente"
        >
          <Plus className="w-5 h-5" />
          Agregar
        </Button>
        <Button
          onClick={onShowSettings}
          variant="outline"
          className="h-12 gap-2"
          title="Configuración"
        >
          <Settings className="w-5 h-5" />
          Ajustes
        </Button>
      </div>
    </div>
  );
};