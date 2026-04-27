import { Search, User, ChevronRight, Phone, Clock, AlertTriangle, CheckCircle2, Filter, UserPlus, Plus, ArrowUpDown } from 'lucide-react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { Customer } from '@/types/fiado';
import { Input } from '@/components/ui/input';
import { formatCOP, getDaysSince, getDebtStatus, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CustomerListProps {
  customers: Customer[];
  onCustomerClick: (customer: Customer) => void;
  onAddCustomer?: () => void;
  autoFocusSearch?: boolean;
}

type FilterType = 'all' | 'debt' | 'up-to-date' | 'overdue' | 'critical';
type SortType = 'debt-desc' | 'debt-asc' | 'overdue-desc' | 'recent' | 'name-asc';

export const CustomerList = ({ customers, onCustomerClick, onAddCustomer, autoFocusSearch }: CustomerListProps) => {
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocusSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [autoFocusSearch]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [activeSort, setActiveSort] = useState<SortType>('debt-desc');

  const filteredCustomers = useMemo(() => {
    let result = customers.filter((c) => {
      const matchesSearch = 
        (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.phone || '').includes(search) ||
        (c.nickname || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.notes || '').toLowerCase().includes(search.toLowerCase());
      
      if (!matchesSearch) return false;

      const days = getDaysSince(c.lastPaymentDate || c.createdAt);
          const totalDebt = c.totalDebt || 0;
          if (activeFilter === 'debt') return totalDebt > 0;
          if (activeFilter === 'up-to-date') return totalDebt === 0;
          if (activeFilter === 'overdue') return totalDebt > 0 && days > 7 && days <= 30;
          if (activeFilter === 'critical') return totalDebt > 0 && days > 30;
      
      return true;
    });

    // Ordenamiento
    result.sort((a, b) => {
      switch (activeSort) {
        case 'debt-desc': return (b.totalDebt || 0) - (a.totalDebt || 0);
        case 'debt-asc': return (a.totalDebt || 0) - (b.totalDebt || 0);
        case 'overdue-desc': {
          const daysA = getDaysSince(a.lastPaymentDate || a.createdAt);
          const daysB = getDaysSince(b.lastPaymentDate || b.createdAt);
          return daysB - daysA;
        }
        case 'recent': {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        }
        case 'name-asc': return (a.name || '').localeCompare(b.name || '');
        default: return 0;
      }
    });

    return result;
  }, [customers, search, activeFilter, activeSort]);

  const stats = useMemo(() => {
    return {
      total: customers.length,
      withDebt: customers.filter(c => (c.totalDebt || 0) > 0).length
    };
  }, [customers]);

  const getStatusIcon = (customer: Customer) => {
    if ((customer.totalDebt || 0) === 0) return <CheckCircle2 className="w-3 h-3" />;
    const status = getDebtStatus(customer);
    
    switch (status) {
      case 'up_to_date': return <CheckCircle2 className="w-3 h-3" />;
      case 'with_debt': return <Clock className="w-3 h-3" />;
      case 'overdue': return <AlertTriangle className="w-3 h-3" />;
      case 'critical': return <AlertTriangle className="w-3 h-3" />;
      default: return null;
    }
  };

  const sortOptions = [
    { id: 'debt-desc', label: 'Mayor deuda' },
    { id: 'debt-asc', label: 'Menor deuda' },
    { id: 'overdue-desc', label: 'Más días sin pagar' },
    { id: 'recent', label: 'Más recientes' },
    { id: 'name-asc', label: 'Nombre A-Z' },
  ];

  return (
    <div className="animate-slide-up">
      <div className="flex flex-col gap-1 mb-6">
        <h2 className="text-2xl font-black text-zinc-900">Clientes</h2>
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">
          <span>{stats.total} registrados</span>
          <span className="text-zinc-300">·</span>
          <span className="text-primary">{stats.withDebt} con fiado</span>
        </div>
      </div>
      
      <div className="sticky top-0 z-10 -mt-2 mb-6 bg-background/95 backdrop-blur-sm pt-2 pb-4 space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar por nombre, apodo o celular..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-14 bg-zinc-50 border-zinc-200 rounded-2xl text-base font-medium focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-14 w-14 rounded-2xl border-zinc-200 p-0 shrink-0">
                <ArrowUpDown className="w-5 h-5 text-zinc-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
              {sortOptions.map((opt) => (
                <DropdownMenuItem
                  key={opt.id}
                  onClick={() => setActiveSort(opt.id as SortType)}
                  className={`rounded-xl px-4 py-3 text-sm font-bold cursor-pointer ${
                    activeSort === opt.id ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500'
                  }`}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'debt', label: 'Deben' },
            { id: 'up-to-date', label: 'Al día' },
            { id: 'overdue', label: 'En mora' },
            { id: 'critical', label: 'Mora crítica' }
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as FilterType)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeFilter === filter.id 
                  ? 'bg-zinc-900 text-white shadow-md shadow-zinc-200' 
                  : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredCustomers.map((customer) => {
          const status = getDebtStatus(customer);
          const statusColor = getStatusColor(status);
          const lastMovement = customer.lastPaymentDate 
            ? `Último abono: hace ${getDaysSince(customer.lastPaymentDate)} días` 
            : customer.totalDebt > 0 
              ? `Último fiado: hace ${getDaysSince(customer.createdAt)} días`
              : 'Sin fiados recientes';
          
          return (
            <button
              key={customer.id}
              onClick={() => onCustomerClick(customer)}
              className="w-full flex flex-col p-4 bg-white rounded-3xl border border-zinc-100 hover:border-zinc-300 hover:shadow-md transition-all text-left group active:scale-[0.97] active:bg-zinc-50"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-50 flex items-center justify-center shrink-0 group-hover:bg-zinc-100 transition-colors">
                    <User className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-zinc-900 truncate uppercase text-sm">
                        {customer.name || 'Sin nombre'}
                      </p>
                      {customer.nickname && (
                        <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full truncate">
                          "{customer.nickname}"
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[11px] font-bold text-zinc-400 flex items-center gap-1">
                        <Phone className="w-2.5 h-2.5" />
                        {customer.phone || 'Sin celular'}
                      </p>
                      <span className="text-zinc-300 text-[10px]">•</span>
                      <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full ${statusColor}`}>
                        {getStatusIcon(customer)}
                        {getStatusLabel(status)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="shrink-0 ml-2">
                  <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                </div>
              </div>

              <div className="flex items-end justify-between border-t border-zinc-50 pt-3 mt-1">
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">
                    {customer.totalDebt > 0 ? 'Debe' : 'Estado'}
                  </p>
                  <p className={`text-xl font-black tracking-tight ${customer.totalDebt > 0 ? 'text-zinc-900' : 'text-green-600'}`}>
                    {customer.totalDebt > 0 ? formatCOP(customer.totalDebt) : 'Cliente al día'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-zinc-400 italic">
                    {lastMovement}
                  </p>
                </div>
              </div>
            </button>
          );
        })}

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12 bg-zinc-50 rounded-3xl border border-dashed border-zinc-200 px-6">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <UserPlus className="w-8 h-8 text-zinc-300" />
            </div>
            {customers.length === 0 ? (
              <>
                <h3 className="text-lg font-black text-zinc-900 mb-2">Aún no tienes clientes</h3>
                <p className="text-sm text-zinc-500 mb-6 font-medium">Agrega tu primer cliente para empezar a controlar los fiados de tu negocio.</p>
                {onAddCustomer && (
                  <Button 
                    onClick={onAddCustomer}
                    className="rounded-2xl px-8 bg-zinc-900 hover:bg-zinc-800 font-black uppercase tracking-wider h-12 shadow-lg shadow-zinc-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Cliente
                  </Button>
                )}
              </>
            ) : activeFilter === 'debt' ? (
              <>
                <h3 className="text-lg font-black text-zinc-900 mb-2">¡Todo el mundo está al día!</h3>
                <p className="text-sm text-zinc-500 mb-6 font-medium">No tienes clientes con deudas pendientes en este momento.</p>
                <Button 
                  onClick={() => document.getElementById('dashboard-header')?.scrollIntoView({ behavior: 'smooth' })}
                  className="rounded-2xl px-8 bg-zinc-900 hover:bg-zinc-800 font-black uppercase tracking-wider h-12 shadow-lg shadow-zinc-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar fiado
                </Button>
              </>
            ) : activeFilter === 'overdue' ? (
              <>
                <h3 className="text-lg font-black text-zinc-900 mb-2">No hay moras</h3>
                <p className="text-sm text-zinc-500 font-medium">Tus clientes están pagando a tiempo. ¡Excelente!</p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-black text-zinc-900 mb-2">No se encontró "{search}"</h3>
                <p className="text-sm text-zinc-500 mb-6 font-medium">¿Es un cliente nuevo? Puedes crearlo ahora mismo.</p>
                {onAddCustomer && (
                  <Button 
                    onClick={onAddCustomer}
                    className="rounded-2xl px-8 bg-zinc-900 hover:bg-zinc-800 font-black uppercase tracking-wider h-12 shadow-lg shadow-zinc-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Crear cliente nuevo
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
