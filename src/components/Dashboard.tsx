import { 
  DollarSign, 
  Users, 
  TrendingDown, 
  Calendar,
  Clock,
  AlertCircle,
  ArrowRight,
  Receipt,
  Wallet,
  MessageCircle,
  Phone,
  Plus,
  Minus,
  ChevronRight
} from 'lucide-react';
import { formatCOP, getDaysSince } from '@/lib/utils';
import { Customer, Transaction } from '@/types/fiado';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface DashboardProps {
  totalDebt: number;
  customersWithDebt: Customer[];
  todayPayments: number;
  todayDebts: number;
  overdueCustomers: Customer[];
  recentTransactions?: Transaction[];
  onViewCustomers: () => void;
  onViewCustomer: (customer: Customer) => void;
  onAddDebt?: () => void;
  onAddPayment?: () => void;
  onSendWhatsApp?: (customer: Customer) => void;
  // Props de plan
  planName?: string;
  planId?: 'free' | 'pro' | 'plus';
  customerLimit?: number | null;
  currentCustomers?: number;
  onShowPlanSelector?: () => void;
}

// Tarjeta de estadística principal
const STAT_CARD = ({ 
  title, 
  value, 
  subtitle,
  icon: Icon,
  color = 'blue',
  onClick,
  large = false
}: { 
  title: string;
  value: string;
  subtitle?: string;
  icon: typeof DollarSign;
  color?: 'red' | 'green' | 'amber' | 'blue' | 'purple';
  onClick?: () => void;
  large?: boolean;
}) => {
  const colorClasses = {
    red: 'bg-red-500 text-white',
    green: 'bg-emerald-500 text-white',
    amber: 'bg-amber-500 text-white',
    blue: 'bg-blue-500 text-white',
    purple: 'bg-purple-500 text-white',
  };

  return (
    <div 
      onClick={onClick}
      className={cn(
        "rounded-2xl p-4 relative overflow-hidden shadow-lg",
        onClick && "cursor-pointer active:scale-95 transition-transform",
        colorClasses[color],
        large && "col-span-2"
      )}
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-2">
          <div className="p-2 bg-white/20 rounded-xl">
            <Icon className={cn("text-white", large ? "w-6 h-6" : "w-5 h-5")} />
          </div>
        </div>
        
        <p className={cn("font-medium opacity-90 mb-1", large ? "text-base" : "text-sm")}>
          {title}
        </p>
        <p className={cn("font-black mb-1", large ? "text-3xl" : "text-xl")}>
          {value}
        </p>
        {subtitle && (
          <p className="text-xs opacity-80">{subtitle}</p>
        )}
      </div>
      
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
    </div>
  );
};

// Item de cliente para cobrar hoy
const COBRAR_HOY_ITEM = ({ 
  customer, 
  onClick,
  onWhatsApp 
}: { 
  customer: Customer; 
  onClick: () => void;
  onWhatsApp?: (customer: Customer) => void;
}) => {
  return (
    <div className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border-2 border-zinc-100 shadow-sm">
      <button 
        onClick={onClick}
        className="flex-1 flex items-center gap-3 text-left"
      >
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-lg font-black text-blue-700">
            {customer.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-zinc-900 truncate">{customer.name}</p>
          {customer.phone && (
            <p className="text-sm text-zinc-500 flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {customer.phone}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="font-black text-lg text-zinc-900">{formatCOP(customer.totalDebt)}</p>
        </div>
      </button>
      
      {customer.phone && onWhatsApp && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onWhatsApp(customer);
          }}
          className="flex-shrink-0 p-3 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl active:scale-95 transition-all"
          title="Cobrar por WhatsApp"
        >
          <MessageCircle className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

// Item de top deudor
const TOP_DEUDOR_ITEM = ({ 
  customer, 
  rank,
  onClick 
}: { 
  customer: Customer; 
  rank: number;
  onClick: () => void;
}) => {
  const rankColors = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-zinc-400', 'bg-zinc-400'];
  
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 bg-white rounded-xl border border-zinc-200 hover:border-zinc-300 active:scale-[0.98] transition-all"
    >
      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-black flex-shrink-0", rankColors[rank - 1] || 'bg-zinc-400')}>
        {rank}
      </div>
      <div className="flex-1 text-left">
        <p className="font-bold text-zinc-900 text-sm">{customer.name}</p>
        <p className="text-xs text-zinc-500">
          {getDaysSince(customer.lastMovementAt || customer.createdAt)} días sin pagar
        </p>
      </div>
      <div className="text-right">
        <p className="font-black text-zinc-900">{formatCOP(customer.totalDebt)}</p>
      </div>
    </button>
  );
};

// Item de movimiento reciente
const MOVIMIENTO_ITEM = ({ 
  transaction 
}: { 
  transaction: Transaction;
}) => {
  const isDebt = transaction.type === 'debt';
  
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-zinc-100">
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
        isDebt ? "bg-red-100" : "bg-emerald-100"
      )}>
        {isDebt ? (
          <Receipt className="w-5 h-5 text-red-600" />
        ) : (
          <DollarSign className="w-5 h-5 text-emerald-600" />
        )}
      </div>
      <div className="flex-1">
        <p className="font-medium text-zinc-900 text-sm">
          {isDebt ? 'Fiado' : 'Abono'}
        </p>
        <p className="text-xs text-zinc-500">
          {transaction.description || 'Sin descripción'}
        </p>
      </div>
      <div className="text-right">
        <p className={cn(
          "font-black",
          isDebt ? "text-red-600" : "text-emerald-600"
        )}>
          {isDebt ? '+' : '-'}{formatCOP(transaction.amount)}
        </p>
        <p className="text-xs text-zinc-400">
          {new Date(transaction.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
        </p>
      </div>
    </div>
  );
};

export const Dashboard = ({ 
  totalDebt, 
  customersWithDebt,
  todayPayments,
  todayDebts,
  overdueCustomers,
  recentTransactions = [],
  onViewCustomers,
  onViewCustomer,
  onAddDebt,
  onAddPayment,
  onSendWhatsApp,
  planName = 'Gratis',
  planId = 'free',
  customerLimit = null,
  currentCustomers = 0,
  onShowPlanSelector,
}: DashboardProps) => {
  const customerCount = customersWithDebt.length;
  
  // Top 5 deudores
  const topDebtors = [...customersWithDebt]
    .sort((a, b) => (b.totalDebt || 0) - (a.totalDebt || 0))
    .slice(0, 5);
  
  // Clientes con promesa de pago para hoy (simulado)
  const cobrarHoy = overdueCustomers.slice(0, 3);
  
  // Últimos 5 movimientos
  const ultimosMovimientos = recentTransactions.slice(0, 5);

  // Verificar si está cerca del límite
  const isNearLimit = customerLimit !== null && currentCustomers >= customerLimit * 0.8;
  const remainingCustomers = customerLimit !== null ? customerLimit - currentCustomers : null;

  return (
    <div className="space-y-6">
      {/* Banner del plan actual */}
      <div className={cn(
        "flex items-center justify-between p-4 rounded-2xl border-2",
        planId === 'free' ? "bg-zinc-50 border-zinc-200" : 
        planId === 'pro' ? "bg-amber-50 border-amber-200" : 
        "bg-purple-50 border-purple-200"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            planId === 'free' ? "bg-zinc-200" : 
            planId === 'pro' ? "bg-amber-200" : 
            "bg-purple-200"
          )}>
            <span className="text-lg">
              {planId === 'free' ? '⚡' : planId === 'pro' ? '⭐' : '👑'}
            </span>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Plan actual</p>
            <p className="font-bold text-zinc-900">{planName}</p>
          </div>
        </div>
        {onShowPlanSelector && (
          <button
            onClick={onShowPlanSelector}
            className={cn(
              "text-sm font-bold px-4 py-2 rounded-xl transition-colors",
              planId === 'free' ? "bg-zinc-900 text-white hover:bg-zinc-800" : 
              planId === 'pro' ? "bg-amber-500 text-white hover:bg-amber-600" : 
              "bg-purple-500 text-white hover:bg-purple-600"
            )}
          >
            {planId === 'free' ? 'Mejorar plan' : 'Cambiar plan'}
          </button>
        )}
      </div>

      {/* Advertencia de límite */}
      {isNearLimit && remainingCustomers !== null && remainingCustomers > 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-800">
                Te quedan {remainingCustomers} {remainingCustomers === 1 ? 'cliente' : 'clientes'} en el plan gratis
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Actualiza a Pro para clientes ilimitados
              </p>
              {onShowPlanSelector && (
                <button
                  onClick={onShowPlanSelector}
                  className="text-sm font-bold text-amber-700 underline hover:text-amber-800 mt-2"
                >
                  Ver planes →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Botones de acción principales */}
      <div className="flex gap-3">
        <Button
          onClick={onAddDebt}
          className="flex-1 h-16 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-base gap-2 shadow-lg shadow-amber-500/25 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          Registrar fiado
        </Button>
        <Button
          onClick={onAddPayment}
          className="flex-1 h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-base gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
        >
          <Minus className="w-5 h-5" />
          Registrar abono
        </Button>
      </div>

      {/* Tarjetas principales - 5 tarjetas en grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* 1. Total pendiente - GRANDE */}
        <STAT_CARD
          title="Por cobrar"
          value={formatCOP(totalDebt)}
          subtitle={`${customerCount} ${customerCount === 1 ? 'cliente' : 'clientes'} deben`}
          icon={DollarSign}
          color="red"
          onClick={onViewCustomers}
          large
        />
        
        {/* 2. Clientes que deben */}
        <STAT_CARD
          title="Deben"
          value={`${customerCount}`}
          subtitle="Clientes con saldo"
          icon={Users}
          color="purple"
          onClick={onViewCustomers}
        />
        
        {/* 3. Abonos hoy */}
        <STAT_CARD
          title="Abonos hoy"
          value={formatCOP(todayPayments)}
          subtitle={todayPayments > 0 ? '¡Cobraste!' : 'Sin abonos'}
          icon={TrendingDown}
          color="green"
        />
        
        {/* 4. Cobros prometidos hoy */}
        <STAT_CARD
          title="Prometidos hoy"
          value={`${cobrarHoy.length}`}
          subtitle="Clientes por cobrar"
          icon={Calendar}
          color="blue"
          onClick={cobrarHoy.length > 0 ? onViewCustomers : undefined}
        />
        
        {/* 5. Deudas vencidas */}
        <STAT_CARD
          title="Vencidas"
          value={`${overdueCustomers.length}`}
          subtitle="Más de 7 días"
          icon={AlertCircle}
          color="amber"
          onClick={overdueCustomers.length > 0 ? onViewCustomers : undefined}
        />
      </div>

      {/* Sección: Cobrar hoy */}
      {cobrarHoy.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-lg text-zinc-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Cobrar hoy
            </h3>
            <span className="text-sm text-zinc-500 font-medium">
              {cobrarHoy.length} {cobrarHoy.length === 1 ? 'cliente' : 'clientes'}
            </span>
          </div>
          
          <div className="space-y-2">
            {cobrarHoy.map((customer) => (
              <COBRAR_HOY_ITEM
                key={customer.id}
                customer={customer}
                onClick={() => onViewCustomer(customer)}
                onWhatsApp={onSendWhatsApp}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sección: Clientes que más deben */}
      {topDebtors.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-lg text-zinc-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Quién más debe
            </h3>
            <button 
              onClick={onViewCustomers}
              className="text-sm text-primary font-bold flex items-center gap-1"
            >
              Ver todos
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-2">
            {topDebtors.map((customer, index) => (
              <TOP_DEUDOR_ITEM
                key={customer.id}
                customer={customer}
                rank={index + 1}
                onClick={() => onViewCustomer(customer)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sección: Últimos movimientos */}
      {ultimosMovimientos.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-black text-lg text-zinc-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-zinc-500" />
            Últimos movimientos
          </h3>
          
          <div className="space-y-2">
            {ultimosMovimientos.map((tx) => (
              <MOVIMIENTO_ITEM key={tx.id} transaction={tx} />
            ))}
          </div>
        </div>
      )}

      {/* Estado vacío - todo al día */}
      {overdueCustomers.length === 0 && customerCount === 0 && (
        <div className="bg-emerald-50 rounded-2xl p-6 text-center border-2 border-emerald-100">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="font-black text-xl text-emerald-900 mb-2">¡Todo al día!</h3>
          <p className="text-sm text-emerald-700 mb-4">
            No tienes deudas pendientes. Tus clientes están al día con sus pagos.
          </p>
          <Button 
            onClick={onAddDebt}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Registrar primer fiado
          </Button>
        </div>
      )}

      {/* Mensaje motivacional */}
      {customerCount > 0 && overdueCustomers.length === 0 && (
        <div className="bg-blue-50 rounded-2xl p-4 border-2 border-blue-100">
          <p className="text-center text-blue-800">
            <span className="font-black">¡Excelente!</span> Todos tus clientes están pagando a tiempo. 🎉
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
