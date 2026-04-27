import { DollarSign, TrendingUp, Users, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { formatCOP } from '@/lib/utils';

interface DashboardHeaderProps {
  totalDebt: number;
  customerCount: number;
  dailyStats?: {
    newDebts: number;
    newPayments: number;
  };
}

export const DashboardHeader = ({ totalDebt, customerCount, dailyStats }: DashboardHeaderProps) => {
  return (
    <div id="dashboard-header" className="bg-primary text-primary-foreground rounded-3xl p-6 shadow-xl shadow-primary/20 animate-fade-in relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-black/10 rounded-full blur-xl" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-bold uppercase tracking-wider opacity-90">Total fiado pendiente</span>
          <span className="text-[10px] font-medium opacity-50 italic">"Plata en la calle"</span>
        </div>
        <p className="text-[10px] opacity-70 mb-4 font-medium">Dinero que tus clientes aún no han pagado</p>
        
        <div className="text-4xl font-black mb-6 tracking-tight">
          {totalDebt > 0 ? formatCOP(totalDebt) : '$ 0'}
        </div>

        {totalDebt === 0 && customerCount === 0 ? (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <p className="text-sm font-medium">Aún no tienes fiados registrados</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold bg-white/10 w-fit px-3 py-1.5 rounded-xl backdrop-blur-sm">
              <Users className="w-4 h-4" />
              <span>{customerCount} {customerCount === 1 ? 'cliente' : 'clientes'} con fiado</span>
            </div>
            
            {dailyStats && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-bold border-t border-white/10 pt-4">
                <div className="flex items-center gap-1.5 text-white">
                  <span className="opacity-70">Hoy:</span>
                </div>
                <div className="flex items-center gap-1 text-red-200">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>{formatCOP(dailyStats.newDebts)} fiado</span>
                </div>
                <div className="flex items-center gap-1 text-green-200">
                  <ArrowDownLeft className="w-3 h-3" />
                  <span>{formatCOP(dailyStats.newPayments)} abonado</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
