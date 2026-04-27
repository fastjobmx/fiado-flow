import { useState, useEffect } from 'react';
import { X, Lightbulb, Keyboard, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WelcomeTooltipProps {
  className?: string;
}

export const WelcomeTooltip = ({ className }: WelcomeTooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    // Mostrar después de 2 segundos
    const timer = setTimeout(() => {
      const hasSeenTips = localStorage.getItem('fiado-seen-tips');
      if (!hasSeenTips) {
        setIsVisible(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('fiado-seen-tips', 'true');
  };

  const tips = [
    {
      icon: <Keyboard className="w-5 h-5" />,
      title: "Atajos de teclado",
      description: "Presiona / para buscar rápidamente clientes",
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: "Acciones rápidas",
      description: "Usa el botón + en la esquina para registrar fiados rápido",
    },
    {
      icon: <Lightbulb className="w-5 h-5" />,
      title: "Colores de estado",
      description: "Rojo = Urgente, Amarillo = Debe, Verde = Al día",
    },
  ];

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-24 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-40",
        "bg-gradient-to-br from-zinc-900 to-zinc-800 text-white rounded-2xl p-4 shadow-2xl",
        "animate-in slide-in-from-bottom-5 fade-in",
        className
      )}
    >
      <button
        onClick={handleClose}
        className="absolute top-2 right-2 p-1.5 hover:bg-white/10 rounded-full transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/20 rounded-xl text-primary">
          {tips[currentTip].icon}
        </div>
        <div className="flex-1 pr-6">
          <h4 className="font-bold text-sm mb-1">{tips[currentTip].title}</h4>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {tips[currentTip].description}
          </p>
        </div>
      </div>

      {/* Indicadores */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex gap-1.5">
          {tips.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentTip(i)}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                i === currentTip ? "bg-primary" : "bg-white/20 hover:bg-white/40"
              )}
            />
          ))}
        </div>

        <div className="flex gap-2">
          {currentTip > 0 && (
            <button
              onClick={() => setCurrentTip(currentTip - 1)}
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Anterior
            </button>
          )}
          {currentTip < tips.length - 1 ? (
            <button
              onClick={() => setCurrentTip(currentTip + 1)}
              className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
            >
              Entendido
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
