import { useState } from 'react';
import { Check, X, Sparkles, Users, Receipt, Download, MessageCircle, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlanType, PLANS, getPlanById } from '@/types/subscription';
import { cn, formatCOP } from '@/lib/utils';

interface PlanSelectorProps {
  currentPlan: PlanType;
  onSelectPlan: (plan: PlanType) => void;
  onCancel: () => void;
}

const PLAN_ICONS = {
  free: Users,
  pro: Sparkles,
  plus: Crown,
};

const PLAN_COLORS = {
  free: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  pro: 'bg-amber-50 text-amber-700 border-amber-200',
  plus: 'bg-purple-50 text-purple-700 border-purple-200',
};

const PLAN_BUTTON_COLORS = {
  free: 'bg-zinc-900 hover:bg-zinc-800',
  pro: 'bg-amber-500 hover:bg-amber-600',
  plus: 'bg-purple-500 hover:bg-purple-600',
};

export const PlanSelector = ({ currentPlan, onSelectPlan, onCancel }: PlanSelectorProps) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(currentPlan);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleSelectPlan = async (plan: PlanType) => {
    if (plan === currentPlan) return;
    
    setIsUpgrading(true);
    // Simular proceso de upgrade
    await new Promise(resolve => setTimeout(resolve, 1000));
    onSelectPlan(plan);
    setIsUpgrading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-4xl sm:rounded-[32px] rounded-t-[32px] max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-zinc-100 p-4 sm:p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900">
                Elige tu plan
              </h2>
              <p className="text-sm text-zinc-500 mt-1">
                Actualiza cuando quieras, cancela cuando quieras
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Planes */}
        <div className="p-4 sm:p-6">
          <div className="grid md:grid-cols-3 gap-4">
            {(Object.keys(PLANS) as PlanType[]).map((planId) => {
              const plan = getPlanById(planId);
              const Icon = PLAN_ICONS[planId];
              const isCurrent = currentPlan === planId;
              const isSelected = selectedPlan === planId;
              const isRecommended = plan.isRecommended;

              return (
                <div
                  key={planId}
                  onClick={() => setSelectedPlan(planId)}
                  className={cn(
                    "relative rounded-2xl border-2 p-5 cursor-pointer transition-all",
                    isSelected 
                      ? PLAN_COLORS[planId] 
                      : "bg-white border-zinc-200 hover:border-zinc-300",
                    isCurrent && "ring-2 ring-zinc-900"
                  )}
                >
                  {/* Badge recomendado */}
                  {isRecommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        Recomendado
                      </span>
                    </div>
                  )}

                  {/* Badge actual */}
                  {isCurrent && (
                    <div className="absolute top-3 right-3">
                      <span className="bg-zinc-900 text-white text-xs font-bold px-2 py-1 rounded-lg">
                        Actual
                      </span>
                    </div>
                  )}

                  {/* Icono */}
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                    isSelected ? "bg-white/50" : "bg-zinc-100"
                  )}>
                    <Icon className={cn(
                      "w-6 h-6",
                      isSelected ? "text-current" : "text-zinc-600"
                    )} />
                  </div>

                  {/* Nombre y precio */}
                  <h3 className="text-lg font-black mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-2xl font-black">{plan.priceFormatted}</span>
                    <span className="text-sm text-zinc-500">{plan.period}</span>
                  </div>

                  <p className="text-sm text-zinc-600 mb-4">
                    {plan.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-2 mb-4">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className={cn(
                          "w-4 h-4 flex-shrink-0 mt-0.5",
                          isSelected ? "text-current" : "text-zinc-400"
                        )} />
                        <span className={cn(
                          isSelected ? "text-current" : "text-zinc-700"
                        )}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Not included */}
                  {plan.notIncluded && plan.notIncluded.length > 0 && (
                    <div className="pt-4 border-t border-zinc-200">
                      <p className="text-xs font-bold text-zinc-400 uppercase mb-2">
                        No incluye
                      </p>
                      <ul className="space-y-1">
                          {plan.notIncluded.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-zinc-400">
                              <span className="text-zinc-300">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer con botón de acción */}
          <div className="sticky bottom-0 bg-white border-t border-zinc-100 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="text-center sm:text-left">
                <p className="text-sm text-zinc-500">
                  Plan seleccionado:
                </p>
                <p className="font-bold text-zinc-900">
                  {getPlanById(selectedPlan).name}
                  {selectedPlan !== 'free' && (
                    <span className="text-zinc-500 font-normal">
                      {' '}- {getPlanById(selectedPlan).priceFormatted}{getPlanById(selectedPlan).period}
                    </span>
                  )}
                </p>
              </div>
              
              <div className="flex gap-3 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1 sm:flex-none h-12 rounded-xl border-2"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => handleSelectPlan(selectedPlan)}
                  disabled={selectedPlan === currentPlan || isUpgrading}
                  className={cn(
                    "flex-1 sm:flex-none h-12 rounded-xl font-bold px-8 text-white",
                    PLAN_BUTTON_COLORS[selectedPlan],
                    (selectedPlan === currentPlan || isUpgrading) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isUpgrading ? 'Procesando...' : selectedPlan === currentPlan ? 'Plan actual' : 'Elegir este plan'}
                </Button>
              </div>
            </div>
            
            <p className="text-xs text-zinc-400 text-center mt-4">
              Puedes cancelar en cualquier momento. Sin contratos de permanencia.
            </p>
          </div>
        </div>
      </div>
    );
  };

  export default PlanSelector;
