import { 
  DollarSign, 
  Users, 
  TrendingDown, 
  TrendingUp,
  Clock,
  AlertCircle,
  ArrowRight,
  Receipt,
  Wallet
} from 'lucide-react';
import { formatCOP, getDaysSince } from '@/lib/utils';
import { Customer } from '@/types/fiado';
import { cn } from '@/lib/utils';

interface DashboardProps {
  totalDebt: number;
  customersWithDebt: Customer[];
  todayPayments: number;
  todayDebts: number;
  overdueCustomers: Customer[];
  onViewCustomers: () => void;
  onViewCustomer: (customer: Customer) => void;
}

const STAT_CARD = ({ 
  title, 
  value, 
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = 'blue',
  onClick
}: { 
  title: string;
  value: string;
  subtitle?: string;
  icon: typeof DollarSign;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'blue' | 'red' | 'green' | 'amber';
  onClick?: () => void;
}) => {
  const colorClasses = {
    blue: 'bg-blue-500 text-white',
    red: 'bg-red-500 text-white',
    green: 'bg-emerald-500 text-white',
    amber: 'bg-amber-500 text-white',
  };

  return (
    <div 
      onClick={onClick}
      className={cn(
        "rounded-2xl p-5 relative overflow-hidden",
        onClick && "cursor-pointer active:scale-95 transition-transform",
        colorClasses[color]
      )}
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <Icon className="w-5 h-5" />
          </div>
          {trend && trendValue && (
            <div className={cn(
              "text-xs font-bold px-2 py-1 rounded-full",
              trend === 'up' ? "bg-white/20" : 
              trend === 'down' ? "bg-white/20" : "bg-white/10"
            )}>
              {trend === 'up' && '↑'}
              {trend === 'down' && '↓'}
              {trend === 'neutral' && '→'} {trendValue}
            </div>
          )}
        </div>
        
        <p className="text-sm font-medium opacity-90 mb-1">{title}</p>
        <p className="text-2xl font-black mb-1">{value}</p>
        {subtitle && (
          <p className="text-xs opacity-75">{subtitle}</p>
        )}
      </div>
      
      {/* Decoración de fondo */}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
    </div>
  );
};

const OVERDUE_ITEM = ({ 
  customer, 
  onClick 
}: { 
  customer: Customer; 
  onClick: () => void;
}) => {
  const days = getDaysSince(customer.lastMovementAt || customer.createdAt);
  
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-zinc-200 hover:border-zinc-300 active:scale-[0.98] transition-all"
    >
      <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
        <AlertCircle className="w-6 h-6 text-red-500" />
      </div>
      <div className="flex-1 text-left">
        <p className="font-bold text-zinc-900">{customer.name}</p>
        <p className="text-sm text-zinc-500">
          {days > 30 ? 'Más de 1 mes sin pagar' : `${days} días sin pagar`}
        </p>
      </div>
      <div className="text-right">
        <p className="font-black text-zinc-900">{formatCOP(customer.totalDebt)}</p>
        <ArrowRight className="w-4 h-4 text-zinc-400 ml-auto" />
      </div>
    </button>
  );
};

export const Dashboard = ({ 
  totalDebt, 
  customersWithDebt,
  todayPayments,
  todayDebts,
  overdueCustomers,
  onViewCustomers,
  onViewCustomer,
}: DashboardProps) => {
  const customerCount = customersWithDebt.length;
  const topOverdue = overdueCustomers.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Tarjetas principales */}
      <div className="grid grid-cols-2 gap-4">
        <STAT_CARD
          title="Por cobrar"
          value={formatCOP(totalDebt)}
          subtitle={`${customerCount} ${customerCount === 1 ? 'cliente' : 'clientes'} deben`}
          icon={DollarSign}
          color="red"
          onClick={onViewCustomers}
        />
        
        <STAT_CARD
          title="Abonos hoy"
          value={formatCOP(todayPayments)}
          subtitle={todayPayments > 0 ? '¡Buen día de cobros!' : 'Aún sin abonos hoy'}
          icon={TrendingDown}
          trend={todayPayments > 0 ? 'up' : 'neutral'}
          trendValue="hoy"
          color="green"
        />
        
        <STAT_CARD
          title="Fiados hoy"
          value={formatCOP(todayDebts)}
          subtitle="Total fiado hoy"
          icon={Receipt}
          color="amber"
        />
        
        <STAT_CARD
          title="Cobros pendientes"
          value={`${overdueCustomers.length}`}
          subtitle={overdueCustomers.length > 0 ? 'Clientes que deben pagar' : 'Todos al día'}
          icon={Clock}
          trend={overdueCustomers.length > 0 ? 'up' : 'neutral'}
          trendValue="pendientes"
          color="blue"
          onClick={overdueCustomers.length > 0 ? onViewCustomers : undefined}
        />
      </div>

      {/* Clientes que deben cobrar hoy */}
      {topOverdue.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-zinc-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Cobros urgentes
            </h3>
            <button 
              onClick={onViewCustomers}
              className="text-sm text-primary font-medium"
            >
              Ver todos
            </button>
          </div>
          
          <div className="space-y-2">
            {topOverdue.map((customer) => (
              <OVERDUE_ITEM
                key={customer.id}
                customer={customer}
                onClick={() => onViewCustomer(customer)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Estado vacío - todos al día */}
      {overdueCustomers.length === 0 && customerCount === 0 && (
        <div className="bg-emerald-50 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="font-bold text-emerald-900 mb-2">¡Todo al día!</h3>
          <p className="text-sm text-emerald-700 mb-4">
            No tienes deudas pendientes. Tus clientes están al día con sus pagos.
          </p>
          <button 
            onClick={onViewCustomers}
            className="text-sm font-bold text-emerald-800 underline"
          >
            Ver clientes
          </button>
        </div>
      )}

      {/* Tips rápidos */}
      <div className="bg-blue-50 rounded-2xl p-4">
        <p className="text-sm text-blue-800">
          <span className="font-bold">💡 Tip:</span> Toca el botón verde de WhatsApp para enviar recordatorios de pago a tus clientes.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
