import { useState, useCallback, useEffect, ReactNode } from 'react';
import { X, GripHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  showHandle?: boolean;
  showCloseButton?: boolean;
  snapPoints?: number[];
}

export const MobileBottomSheet = ({
  isOpen,
  onClose,
  title,
  children,
  className,
  showHandle = true,
  showCloseButton = true,
  snapPoints = [85, 50],
}: MobileBottomSheetProps) => {
  const [translateY, setTranslateY] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Animar entrada/salida
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setTimeout(() => setTranslateY(0), 10);
    } else {
      setTranslateY(100);
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [isOpen]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const y = e.touches[0].clientY;
    setCurrentY(y);
    
    const diff = y - startY;
    if (diff > 0) {
      // Solo permitir arrastrar hacia abajo
      const progress = diff / window.innerHeight;
      setTranslateY(progress * 100);
    }
  }, [isDragging, startY]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    
    const diff = currentY - startY;
    const threshold = window.innerHeight * 0.25; // 25% de la pantalla
    
    if (diff > threshold) {
      haptic('medium');
      onClose();
    } else {
      setTranslateY(0);
    }
  }, [currentY, startY, onClose]);

  if (!isVisible && !isOpen) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 transition-opacity duration-300",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={cn(
          "absolute left-0 right-0 bottom-0 bg-white rounded-t-[32px] shadow-2xl",
          "flex flex-col max-h-[90vh]",
          isDragging ? "" : "transition-transform duration-300 ease-out",
          className
        )}
        style={{
          transform: `translateY(${translateY}%)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle */}
        {showHandle && (
          <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
            <div className="w-12 h-1.5 bg-zinc-300 rounded-full" />
          </div>
        )}

        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-5 py-3">
            {title && (
              <h2 className="text-lg font-black text-zinc-900">{title}</h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 -mr-2 hover:bg-zinc-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-8">
          {children}
        </div>
      </div>
    </div>
  );
};
