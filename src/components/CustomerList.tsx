import { Search, User, ChevronRight } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Customer } from '@/types/fiado';
import { Input } from '@/components/ui/input';

interface CustomerListProps {
  customers: Customer[];
  onCustomerClick: (customer: Customer) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const CustomerList = ({ customers, onCustomerClick }: CustomerListProps) => {
  const [search, setSearch] = useState('');

  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search)
      )
      .sort((a, b) => b.totalDebt - a.totalDebt);
  }, [customers, search]);

  return (
    <div className="animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Clientes</h2>
        <span className="text-sm text-muted-foreground">{customers.length} total</span>
      </div>
      
      <div className="sticky top-0 z-10 -mt-2 mb-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-2 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 bg-card border-border"
          />
        </div>
      </div>

      <div className="space-y-2">
        {filteredCustomers.map((customer) => (
          <button
            key={customer.id}
            onClick={() => onCustomerClick(customer)}
            className="w-full flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-sm active:scale-[0.997] transition-all text-left"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{customer.name}</p>
              <p className="text-sm text-muted-foreground">{customer.phone}</p>
            </div>
            <div className="text-right shrink-0">
              <p className={`font-semibold ${customer.totalDebt > 0 ? 'text-destructive' : 'text-success'}`}>
                {formatCurrency(customer.totalDebt)}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
          </button>
        ))}

        {filteredCustomers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <User className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No se encontraron clientes</p>
          </div>
        )}
      </div>
    </div>
  );
};
