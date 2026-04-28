import { X, TrendingUp, Users, Receipt, FileSpreadsheet, Sparkles, MessageCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlanType, getPlanById } from '@/types/subscription';
import { formatCOP } from '@/lib/utils';

interface FriendlyUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewPlans: () => void;
  onWhatsApp: () => void;
  type: 'customers' | 'transactions' | 'export';
  currentCount?: number;
}

const MODAL_CONTENT = {
  customers: {
    icon: Users,
    title: 'Tu tienda está creciendo 🎉',
    subtitle: 'Has llegado a 20 clientes',
    description: '¡Felicidades! Tu negocio está avanzando. Para seguir registrando más clientes y llevar un mejor control, pásate al plan Pro.',
    benefit: 'Clientes ilimitados',
    color: 'amber',
  },
  transactions: {
    icon: Receipt,
    title: '¡Qué buen ritmo! 🚀',
    subtitle: 'Has registrado 50 movimientos',
    description: 'Tu tienda está muy activa. Para seguir guardando todos tus fiados y abonos sin preocupaciones, actualiza tu plan.',
    benefit: 'Movimientos ilimitados',
    color: 'emerald',
  },
  export: {
    icon: FileSpreadsheet,
    title: 'Necesitas tus reportes 📊',
    subtitle: 'Exportar en Excel y PDF',
    description: 'Descargar tus reportes te ayuda a llevar las cuentas claras y presentar a contador. Esta función está en el plan Plus.',
    benefit: 'Exportar todo',
    color: 'purple',
  },
};

export const FriendlyUpgradeModal = ({
  isOpen,
  onClose,
  onViewPlans,
  onWhatsApp,
  type,
}: FriendlyUpgradeModalProps) => {
  if (!isOpen) return null;

  const content = MODAL_CONTENT[type];
  const Icon = content.icon;
  const proPlan = getPlanById('pro');
  const plusPlan = getPlanById('plus');

  const colorClasses = {
    amber: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: 'bg-amber-100 text-amber-600',
      accent: 'bg-amber-500',
      text: 'text-amber-700',
      light: 'text-amber-600',
    },
    emerald: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      icon: 'bg-emerald-100 text-emerald-600',
      accent: 'bg-emerald-500',
      text: 'text-emerald-700',
      light: 'text-emerald-600',
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      icon: 'bg-purple-100 text-purple-600',
      accent: 'bg-purple-500',
      text: 'text-purple-700',
      light: 'text-purple-600',
    },
  };

  const colors = colorClasses[content.color as keyof typeof colorClasses];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className={`bg-white w-full sm:max-w-md sm:rounded-[32px] rounded-t-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300`}>
        
        {/* Header con gradiente suave */}
        <div className={`${colors.bg} ${colors.border} border-b p-6 text-center relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>

          <div className={`w-16 h-16 ${colors.icon} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
            <Icon className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-black text-zinc-900 mb-1">
            {content.title}
          </h2>
          <p className={`text-sm ${colors.light} font-medium`}>
            {content.subtitle}
          </p>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-5">
          
          {/* Mensaje positivo */}
          <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
            <p className="text-zinc-700 text-sm leading-relaxed text-center">
              {content.description}
            </p>
          </div>

          {/* Plan recomendado */}
          {type !== 'export' ? (
            <div className={`${colors.bg} ${colors.border} border-2 rounded-2xl p-5 relative`}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className={`${colors.accent} text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1`}>
                  <Sparkles className="w-3 h-3" />
                  Recomendado
                </span>
              </div>

              <div className="text-center pt-2">
                <p className="text-zinc-500 text-sm mb-1">Plan Pro</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-black text-zinc-900">{proPlan.priceFormatted}</span>
                  <span className="text-zinc-500 text-sm">{proPlan.period}</span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {['Clientes ilimitados', 'Movimientos ilimitados', 'Reportes básicos', 'WhatsApp integrado'].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-zinc-700">
                    <div className={`w-5 h-5 ${colors.accent} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Para export, mostrar plan Plus
            <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-5 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Necesario para exportar
                </span>
              </div>

              <div className="text-center pt-2">
                <p className="text-zinc-500 text-sm mb-1">Plan Plus</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-black text-zinc-900">{plusPlan.priceFormatted}</span>
                  <span className="text-zinc-500 text-sm">{plusPlan.period}</span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {['Exportar Excel y PDF', 'Multiusuario (3 personas)', 'Reportes avanzados', 'Soporte prioritario'].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-zinc-700">
                    <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="space-y-3">
            <Button
              onClick={onViewPlans}
              className={`w-full h-14 rounded-2xl ${colors.accent} hover:opacity-90 text-white font-black text-base shadow-lg active:scale-95 transition-all`}
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              Ver planes
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>

            <Button
              onClick={onWhatsApp}
              variant="outline"
              className="w-full h-12 rounded-2xl border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10 font-bold"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Hablar por WhatsApp
            </Button>

            <button
              onClick={onClose}
              className="w-full py-3 text-zinc-400 font-medium hover:text-zinc-600 transition-colors text-sm"
            >
              Ahora no
            </button>
          </div>

          {/* Mensaje de tranquilidad */}
          <p className="text-center text-xs text-zinc-400">
            Sin contratos. Puedes volver al plan gratis cuando quieras.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FriendlyUpgradeModal;
