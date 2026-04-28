import { useMemo } from 'react';
import { TrendingUp, Users, Clock, DollarSign, ArrowLeft, Download } from 'lucide-react';
import { Customer, Transaction } from '@/types/fiado';
import { formatCOP, getDaysSince } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SimpleReportsProps {
  customers: Customer[];
  transactions: Transaction[];
  onBack: () => void;
}

export const SimpleReports = ({ customers, transactions, onBack }: SimpleReportsProps) => {
  const stats = useMemo(() => {
    const totalDebt = customers.reduce((sum, c) => sum + (c.totalDebt || 0), 0);
    const customersWithDebt = customers.filter(c => (c.totalDebt || 0) > 0).length;
    const totalCustomers = customers.length;
    
    // Deudas por rangos
    const smallDebts = customers.filter(c => (c.totalDebt || 0) > 0 && (c.totalDebt || 0) < 50000).length;
    const mediumDebts = customers.filter(c => (c.totalDebt || 0) >= 50000 && (c.totalDebt || 0) < 150000).length;
    const largeDebts = customers.filter(c => (c.totalDebt || 0) >= 150000).length;
    
    // Clientes por tiempo sin pagar
    const overdue7 = customers.filter(c => {
      const days = getDaysSince(c.lastMovementAt || c.createdAt);
      return (c.totalDebt || 0) > 0 && days > 7;
    }).length;
    
    const overdue30 = customers.filter(c => {
      const days = getDaysSince(c.lastMovementAt || c.createdAt);
      return (c.totalDebt || 0) > 0 && days > 30;
    }).length;
    
    return {
      totalDebt,
      customersWithDebt,
      totalCustomers,
      smallDebts,
      mediumDebts,
      largeDebts,
      overdue7,
      overdue30,
    };
  }, [customers]);

  const topDebtors = useMemo(() => {
    return [...customers]
      .filter(c => (c.totalDebt || 0) > 0)
      .sort((a, b) => (b.totalDebt || 0) - (a.totalDebt || 0))
      .slice(0, 5);
  }, [customers]);

  return (
    <div className="min-h-screen bg-zinc-50 p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-zinc-200 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-black">Reportes</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 border border-zinc-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-red-100 rounded-lg">
              <DollarSign className="w-4 h-4 text-red-600" />
            </div>
            <span className="text-xs font-bold text-zinc-500 uppercase">Por cobrar</span>
          </div>
          <p className="text-xl font-black text-zinc-900">{formatCOP(stats.totalDebt)}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-zinc-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xs font-bold text-zinc-500 uppercase">Deben</span>
          </div>
          <p className="text-xl font-black text-zinc-900">{stats.customersWithDebt}</p>
          <p className="text-xs text-zinc-500">de {stats.totalCustomers} clientes</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-zinc-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-amber-100 rounded-lg">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-xs font-bold text-zinc-500 uppercase">Mora +7 días</span>
          </div>
          <p className="text-xl font-black text-zinc-900">{stats.overdue7}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-zinc-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-red-100 rounded-lg">
              <TrendingUp className="w-4 h-4 text-red-600" />
            </div>
            <span className="text-xs font-bold text-zinc-500 uppercase">Mora +30 días</span>
          </div>
          <p className="text-xl font-black text-zinc-900">{stats.overdue30}</p>
        </div>
      </div>

      {/* Distribución de deudas */}
      <div className="bg-white rounded-2xl p-5 border border-zinc-200 mb-6">
        <h3 className="font-bold text-zinc-900 mb-4">Deudas por tamaño</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-600">Pequeñas (menos de $50k)</span>
            <span className="font-bold text-zinc-900">{stats.smallDebts}</span>
          </div>
          <div className="w-full bg-zinc-100 rounded-full h-2">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all"
              style={{ width: `${stats.totalCustomers ? (stats.smallDebts / stats.totalCustomers) * 100 : 0}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-600">Medianas ($50k - $150k)</span>
            <span className="font-bold text-zinc-900">{stats.mediumDebts}</span>
          </div>
          <div className="w-full bg-zinc-100 rounded-full h-2">
            <div 
              className="bg-amber-500 h-2 rounded-full transition-all"
              style={{ width: `${stats.totalCustomers ? (stats.mediumDebts / stats.totalCustomers) * 100 : 0}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-600">Grandes (más de $150k)</span>
            <span className="font-bold text-zinc-900">{stats.largeDebts}</span>
          </div>
          <div className="w-full bg-zinc-100 rounded-full h-2">
            <div 
              className="bg-red-500 h-2 rounded-full transition-all"
              style={{ width: `${stats.totalCustomers ? (stats.largeDebts / stats.totalCustomers) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Top deudores */}
      <div className="bg-white rounded-2xl p-5 border border-zinc-200 mb-6">
        <h3 className="font-bold text-zinc-900 mb-4">Quién más debe</h3>
        {topDebtors.length > 0 ? (
          <div className="space-y-3">
            {topDebtors.map((customer, index) => (
              <div key={customer.id} className="flex items-center gap-3">
                <span className="w-6 h-6 bg-zinc-100 rounded-full flex items-center justify-center text-xs font-bold text-zinc-500">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-zinc-900">{customer.name}</p>
                  <p className="text-xs text-zinc-500">
                    {getDaysSince(customer.lastMovementAt || customer.createdAt)} días sin pagar
                  </p>
                </div>
                <span className="font-black text-zinc-900">{formatCOP(customer.totalDebt)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-zinc-500 py-4">No hay deudas registradas</p>
        )}
      </div>

      {/* Botón exportar (placeholder) */}
      <Button 
        variant="outline" 
        className="w-full h-14 rounded-2xl border-2 border-zinc-200 font-bold text-zinc-600"
        onClick={() => alert('Función disponible en plan Pro')}
      >
        <Download className="w-5 h-5 mr-2" />
        Exportar reporte (Pro)
      </Button>
    </div>
  );
};

export default SimpleReports;
