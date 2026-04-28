import { X, Sparkles, Users, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlanType, getPlanById } from '@/types/subscription';
import { cn, formatCOP } from '@/lib/utils';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (plan: PlanType) => void;
  type: 'customers' | 'transactions' | 'feature';
  currentCount?: number;
  limit?: number;
  featureName?: string;
}

export const UpgradeModal = ({
  isOpen,
  onClose,
  onUpgrade,
  type,
  currentCount,
  limit,
  featureName,
}: UpgradeModalProps) => {
  if (!isOpen) return null;

  const proPlan = getPlanById('pro');
  const plusPlan = getPlanById('plus');

  const getTitle = () => {
    switch (type) {
      case 'customers':
        return 'Has llegado al límite de clientes';
      case 'transactions':
        return 'Has llegado al límite de movimientos';
      case 'feature':
        return `Necesitas actualizar tu plan`;
      default:
        return 'Actualiza tu plan';
    }
  };

  const getMessage = () => {
    switch (type) {
      case 'customers':
        return (
          <>
            <p className="text-zinc-600 mb-2">
              Tu plan gratis permite hasta <strong>20 clientes</strong>.
            </p>
            <p className="text-zinc-600">
              Para seguir agregando clientes y crecer tu negocio, actualiza a Pro.
            </p>
          </>
        );
      case 'transactions':
        return (
          <>
            <p className="text-zinc-600 mb-2">
              Tu plan gratis permite hasta <strong>50 movimientos</strong>.
            </p>
            <p className="text-zinc-600">
              Para seguir registrando fiados sin límites, actualiza a Pro.
            </p>
          </>
        );
      case 'feature':
        return (
          <p className="text-zinc-600">
            La función <strong>{featureName}</strong> está disponible en los planes Pro y Plus.
            Actualiza para desbloquearla.
          </p>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-[32px] rounded-t-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">
              ¡Es hora de crecer!
            </span>
          </div>
          
          <h2 className="text-2xl font-black">
            {getTitle()}
          </h2>
        </div>

        {/* Contenido */}
        <div className="p-6">
          <div className="mb-6">
            {getMessage()}
          </div>

          {/* Plan recomendado: Pro */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 mb-4 relative">
            <div className="absolute -top-3 left-4">
              <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                Recomendado
              </span>
            </div>
            
            <div className="flex items-center justify-between mb-3 pt-2">
              <h3 className="text-lg font-black text-zinc-900">Plan Pro</h3>
              <div className="text-right">
                <span className="text-2xl font-black text-zinc-900">{proPlan.priceFormatted}</span>
                <span className="text-sm text-zinc-500">{proPlan.period}</span>
              </div>
            </div>

            <ul className="space-y-2 mb-4">
              <li className="flex items-center gap-2 text-sm text-zinc-700">
                <Check className="w-4 h-4 text-amber-500" />
                <strong>Clientes ilimitados</strong>
              </li>
              <li className="flex items-center gap-2 text-sm text-zinc-700">
                <Check className="w-4 h-4 text-amber-500" />
                <strong>Movimientos ilimitados</strong>
              </li>
              <li className="flex items-center gap-2 text-sm text-zinc-700">
                <Check className="w-4 h-4 text-amber-500" />
                Reportes básicos
              </li>
              <li className="flex items-center gap-2 text-sm text-zinc-700">
                <Check className="w-4 h-4 text-amber-500" />
                Recordatorios WhatsApp
              </li>
            </ul>

            <Button
              onClick={() => onUpgrade('pro')}
              className="w-full h-14 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-base"
            >
              Elegir Pro
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Plan Plus */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-black text-zinc-900">Plan Plus</h3>
              <div className="text-right">
                <span className="text-2xl font-black text-zinc-900">{plusPlan.priceFormatted}</span>
                <span className="text-sm text-zinc-500">{plusPlan.period}</span>
              </div>
            </div>

            <p className="text-sm text-zinc-600 mb-3">
              Todo lo del Pro, más:
            </p>

            <ul className="space-y-1 mb-4">
              <li className="flex items-center gap-2 text-sm text-zinc-600">
                <Check className="w-4 h-4 text-purple-500" />
                Multiusuario
              </li>
              <li className="flex items-center gap-2 text-sm text-zinc-600">
                <Check className="w-4 h-4 text-purple-500" />
                Exportar Excel/PDF
              </li>
              <li className="flex items-center gap-2 text-sm text-zinc-600">
                <Check className="w-4 h-4 text-purple-500" />
                Soporte prioritario
              </li>
            </ul>

            <Button
              onClick={() => onUpgrade('plus')}
              variant="outline"
              className="w-full h-12 rounded-xl border-2 border-purple-500 text-purple-700 font-bold hover:bg-purple-50"
            >
              Ver plan Plus
            </Button>
          </div>

          {/* Info adicional */}
          <div className="mt-6 text-center">
            <p className="text-xs text-zinc-400">
              Sin contratos de permanencia. Cancela cuando quieras.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-100 p-4">
          <button
            onClick={onClose}
            className="w-full py-3 text-zinc-500 font-medium hover:text-zinc-700 transition-colors"
          >
            Quedarme en el plan gratis por ahora
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
