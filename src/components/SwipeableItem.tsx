import { useState, useRef, useCallback, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';

interface SwipeableItemProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: {
    icon: ReactNode;
    label: string;
    color: string;
  };
  rightAction?: {
    icon: ReactNode;
    label: string;
    color: string;
  };
  className?: string;
  threshold?: number;
}

export const SwipeableItem = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  className,
  threshold = 100,
}: SwipeableItemProps) => {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    
    // Limitar el swipe máximo
    const maxSwipe = 150;
    const limitedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diff));
    
    setTranslateX(limitedDiff);
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    
    const diff = currentX.current - startX.current;
    
    if (diff < -threshold && onSwipeLeft) {
      // Swipe left - activar acción derecha
      haptic('medium');
      onSwipeLeft();
    } else if (diff > threshold && onSwipeRight) {
      // Swipe right - activar acción izquierda
      haptic('medium');
      onSwipeRight();
    }
    
    // Volver a posición original
    setTranslateX(0);
  }, [threshold, onSwipeLeft, onSwipeRight]);

  const showLeftAction = translateX > 50 && leftAction;
  const showRightAction = translateX < -50 && rightAction;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Fondo con acciones */}
      <div className="absolute inset-0 flex">
        {/* Acción izquierda (swipe right) */}
        {leftAction && (
          <div
            className={cn(
              "flex-1 flex items-center justify-start pl-4 transition-opacity duration-200",
              showLeftAction ? "opacity-100" : "opacity-0"
            )}
            style={{ backgroundColor: leftAction.color }}
          >
            <div className="flex items-center gap-2 text-white">
              {leftAction.icon}
              <span className="font-bold text-sm">{leftAction.label}</span>
            </div>
          </div>
        )}
        
        {/* Acción derecha (swipe left) */}
        {rightAction && (
          <div
            className={cn(
              "flex-1 flex items-center justify-end pr-4 transition-opacity duration-200",
              showRightAction ? "opacity-100" : "opacity-0"
            )}
            style={{ backgroundColor: rightAction.color }}
          >
            <div className="flex items-center gap-2 text-white">
              <span className="font-bold text-sm">{rightAction.label}</span>
              {rightAction.icon}
            </div>
          </div>
        )}
      </div>

      {/* Contenido deslizable */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        }}
        className="relative bg-white touch-pan-y"
      >
        {children}
      </div>
    </div>
  );
};
