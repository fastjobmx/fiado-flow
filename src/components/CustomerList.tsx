import { Search, ChevronRight, Phone, Clock, AlertTriangle, CheckCircle2, Plus, UserPlus } from 'lucide-react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { Customer } from '@/types/fiado';
import { Input } from '@/components/ui/input';
import { formatCOP, getDaysSince } from '@/lib/utils';
import { Button } from './ui/button';

interface CustomerListProps {
  customers: Customer[];
  onCustomerClick: (customer: Customer) => void;
  onAddCustomer?: () => void;
  autoFocusSearch?: boolean;
}

type FilterType = 'all' | 'debt' | 'up-to-date' | 'overdue';

export const CustomerList = ({ customers, onCustomerClick, onAddCustomer, autoFocusSearch }: CustomerListProps) => {
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocusSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [autoFocusSearch]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const filteredCustomers = useMemo(() => {
    let result = customers.filter((c) => {
      const matchesSearch = 
        (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.phone || '').includes(search);
      
      if (!matchesSearch) return false;

      const days = getDaysSince(c.lastPaymentDate || c.createdAt);
      const totalDebt = c.totalDebt || 0;
      
      if (activeFilter === 'debt') return totalDebt > 0;
      if (activeFilter === 'up-to-date') return totalDebt === 0;
      if (activeFilter === 'overdue') return totalDebt > 0 && days > 7;
      
      return true;
    });

    // Ordenar por deuda mayor primero
    result.sort((a, b) => (b.totalDebt || 0) - (a.totalDebt || 0));

    return result;
  }, [customers, search, activeFilter]);

  const stats = useMemo(() => {
    return {
      total: customers.length,
      withDebt: customers.filter(c => (c.totalDebt || 0) > 0).length
    };
  }, [customers]);

  return (
    <div className="animate-slide-up">
      {/* Header simple */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-black text-zinc-900">Mis clientes</h2>
          <p className="text-sm text-zinc-500">
            {stats.total} registrados · {stats.withDebt} deben
          </p>
        </div>
        {onAddCustomer && (
          <Button 
            onClick={onAddCustomer}
            className="h-12 px-4 rounded-xl bg-primary hover:bg-primary/90"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            <span className="hidden sm:inline">Agregar</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        )}
      </div>
      
      {/* Búsqueda */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
        <Input
          ref={searchInputRef}
          type="text"
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-12 h-14 bg-white border-2 border-zinc-200 rounded-2xl text-base font-medium focus:border-primary focus:ring-0"
        />
      </div>

      {/* Filtros simples */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
        {[
          { id: 'all', label: 'Todos' },
          { id: 'debt', label: 'Deben' },
          { id: 'overdue', label: 'En mora' },
          { id: 'up-to-date', label: 'Al día' },
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id as FilterType)}
            className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeFilter === filter.id 
                ? 'bg-zinc-900 text-white' 
                : 'bg-zinc-100 text-zinc-600'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Lista de clientes */}
      <div className="space-y-3">
        {filteredCustomers.map((customer) => {
          const days = getDaysSince(customer.lastPaymentDate || customer.createdAt);
          const hasDebt = (customer.totalDebt || 0) > 0;
          const isOverdue = hasDebt && days > 7;
          const lastMovement = customer.lastPaymentDate 
            ? `Último abono: hace ${getDaysSince(customer.lastPaymentDate)} días` 
            : customer.totalDebt > 0 
              ? `Último fiado: hace ${getDaysSince(customer.createdAt)} días`
              : 'Sin fiados recientes';

          // Determinar estado visual
          let statusColor = 'bg-emerald-100 text-emerald-700';
          let statusLabel = 'Al día';
          let statusIcon = <CheckCircle2 className="w-3 h-3" />;
          
          if (hasDebt) {
            if (isOverdue) {
              statusColor = 'bg-red-100 text-red-700';
              statusLabel = days > 30 ? 'Mora grave' : 'En mora';
              statusIcon = <AlertTriangle className="w-3 h-3" />;
            } else {
              statusColor = 'bg-amber-100 text-amber-700';
              statusLabel = 'Debe';
              statusIcon = <Clock className="w-3 h-3" />;
            }
          }

          return (
            <button
              key={customer.id}
              onClick={() => onCustomerClick(customer)}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white border-2 border-zinc-100 hover:border-zinc-300 transition-all active:scale-[0.98] text-left"
            >
              {/* Avatar con inicial */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                hasDebt ? 'bg-zinc-100' : 'bg-emerald-100'
              }`}>
                <span className={`text-lg font-black ${
                  hasDebt ? 'text-zinc-700' : 'text-emerald-700'
                }`}>
                  {customer.name.charAt(0).toUpperCase()}
                </span>
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-zinc-900 truncate">{customer.name}</h3>
                {customer.phone && (
                  <p className="text-sm text-zinc-500 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {customer.phone}
                  </p>
                )}
                {hasDebt && days > 0 && (
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {days === 1 ? 'Desde ayer' : `${days} días sin pagar`}
                  </p>
                )}
              </div>

              {/* Deuda y estado */}
              <div className="text-right flex-shrink-0">
                {hasDebt ? (
                  <>
                    <p className="font-black text-lg text-zinc-900">
                      {formatCOP(customer.totalDebt)}
                    </p>
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>
                      {statusIcon}
                      {statusLabel}
                    </span>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                    Al día
                  </span>
                )}
              </div>
              
              <ChevronRight className="w-5 h-5 text-zinc-300" />
            </button>
          );
        })}

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-zinc-400" />
            </div>
            <p className="text-zinc-500 mb-2">No encontramos clientes</p>
            <p className="text-sm text-zinc-400 mb-4">
              {search ? 'Prueba con otro nombre o número' : 'Agrega tu primer cliente'}
            </p>
            {onAddCustomer && !search && (
              <Button 
                onClick={onAddCustomer}
                className="h-12 px-6 rounded-xl"
              >
                <Plus className="w-5 h-5 mr-2" />
                Agregar cliente
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
