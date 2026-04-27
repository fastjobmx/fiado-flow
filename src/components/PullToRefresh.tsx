import { useRef } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

export const PullToRefresh = ({ onRefresh, children, className }: PullToRefreshProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { pullDistance, isRefreshing } = usePullToRefresh(containerRef, {
    onRefresh,
    threshold: 80,
    maxPull: 120,
  });

  const isPulling = pullDistance > 0;
  const isReadyToRelease = pullDistance >= 80;

  return (
    <div ref={containerRef} className={cn("overflow-y-auto", className)}>
      {/* Indicador de pull */}
      <div
        className={cn(
          "flex items-center justify-center transition-all duration-200",
          isPulling ? "opacity-100" : "opacity-0 h-0"
        )}
        style={{
          height: isPulling ? `${pullDistance}px` : 0,
          minHeight: isPulling ? `${pullDistance}px` : 0,
        }}
      >
        <div className="flex flex-col items-center gap-1">
          {isRefreshing ? (
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          ) : (
            <ArrowDown
              className={cn(
                "w-6 h-6 transition-transform duration-200",
                isReadyToRelease ? "rotate-180 text-primary" : "text-zinc-400"
              )}
            />
          )}
          <span className="text-xs font-medium text-zinc-500">
            {isRefreshing
              ? 'Actualizando...'
              : isReadyToRelease
              ? 'Suelta para actualizar'
              : 'Desliza para actualizar'}
          </span>
        </div>
      </div>

      {children}
    </div>
  );
};
