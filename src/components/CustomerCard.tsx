import { Customer } from '@/types/fiado';
import { formatCOP, getDaysSince, getDebtStatus, getStatusColor, getStatusLabel } from '@/lib/utils';
import { ChevronRight, Phone, Clock, AlertTriangle, CheckCircle2, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomerCardProps {
  customer: Customer;
  onClick: () => void;
  index: number;
}

export const CustomerCard = ({ customer, onClick, index }: CustomerCardProps) => {
  const days = getDaysSince(customer.lastPaymentDate || customer.createdAt);
  const status = getDebtStatus(customer, []);
  const statusColor = getStatusColor(status);
  const statusLabel = getStatusLabel(status);

  const getStatusStyles = () => {
    switch (status) {
      case 'critical':
      case 'overdue':
        return {
          border: 'border-red-200 hover:border-red-300',
          bg: 'bg-gradient-to-r from-red-50 to-white',
          badge: 'bg-red-100 text-red-700',
          icon: 'text-red-500',
        };
      case 'with_debt':
        return {
          border: 'border-amber-200 hover:border-amber-300',
          bg: 'bg-gradient-to-r from-amber-50 to-white',
          badge: 'bg-amber-100 text-amber-700',
          icon: 'text-amber-500',
        };
      case 'up_to_date':
        return {
          border: 'border-green-200 hover:border-green-300',
          bg: 'bg-gradient-to-r from-green-50 to-white',
          badge: 'bg-green-100 text-green-700',
          icon: 'text-green-500',
        };
      default:
        return {
          border: 'border-zinc-200 hover:border-zinc-300',
          bg: 'bg-white',
          badge: 'bg-zinc-100 text-zinc-600',
          icon: 'text-zinc-400',
        };
    }
  };

  const styles = getStatusStyles();

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-2xl border-2 p-4 transition-all duration-200",
        "hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
        "animate-in slide-in-from-bottom-3",
        styles.border,
        styles.bg
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
          customer.totalDebt > 0 ? "bg-white shadow-sm" : "bg-zinc-100"
        )}>
          {customer.totalDebt > 0 ? (
            <span className="text-lg font-black text-zinc-700">
              {customer.name.charAt(0).toUpperCase()}
            </span>
          ) : (
            <User className="w-5 h-5 text-zinc-400" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-zinc-900 truncate">
              {customer.name}
            </h3>
            {customer.nickname && (
              <span className="text-xs text-zinc-400 truncate hidden sm:inline">
                ({customer.nickname})
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm">
            {customer.phone && (
              <span className="flex items-center gap-1 text-zinc-500">
                <Phone className="w-3 h-3" />
                {customer.phone}
              </span>
            )}
          </div>
        </div>

        {/* Deuda */}
        <div className="text-right">
          {customer.totalDebt > 0 ? (
            <>
              <p className="font-black text-lg text-zinc-900">
                {formatCOP(customer.totalDebt)}
              </p>
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium",
                  styles.badge
                )}>
                  {statusLabel}
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-medium">Al día</span>
            </div>
          )}
        </div>

        {/* Flecha */}
        <ChevronRight className={cn(
          "w-5 h-5 transition-colors",
          customer.totalDebt > 0 ? "text-zinc-400" : "text-zinc-300"
        )} />
      </div>

      {/* Indicador de tiempo */}
      {customer.totalDebt > 0 && days > 0 && (
        <div className="mt-3 pt-3 border-t border-current border-opacity-10 flex items-center gap-2 text-xs">
          <Clock className={cn("w-3.5 h-3.5", styles.icon)} />
          <span className={styles.icon}>
            {days === 1 ? 'Desde ayer' : `${days} días sin pagar`}
          </span>
          {status === 'critical' && (
            <AlertTriangle className="w-3.5 h-3.5 text-red-500 ml-auto" />
          )}
        </div>
      )}
    </button>
  );
};
