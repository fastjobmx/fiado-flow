import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Search, UserPlus, Receipt, DollarSign, ArrowLeft, Check } from 'lucide-react';
import { Customer, Transaction } from '@/types/fiado';
import { formatCOP, parseCOP } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface QuickTransactionProps {
  type: 'debt' | 'payment';
  customers: Customer[];
  selectedCustomer?: Customer | null;
  onSubmit: (amount: number, description: string, customerId: string) => Promise<Transaction | null>;
  onCancel: () => void;
  onAddCustomer?: (name: string, phone?: string) => Promise<Customer | null>;
}

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000, 100000];

export const QuickTransaction = ({
  type,
  customers,
  selectedCustomer: initialCustomer,
  onSubmit,
  onCancel,
  onAddCustomer,
}: QuickTransactionProps) => {
  const [step, setStep] = useState<'select' | 'amount' | 'confirm'>('select');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(initialCustomer || null);
  const [search, setSearch] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialCustomer) {
      setSelectedCustomer(initialCustomer);
      setStep('amount');
    }
  }, [initialCustomer]);

  useEffect(() => {
    if (step === 'amount') {
      setTimeout(() => amountInputRef.current?.focus(), 100);
    }
  }, [step]);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  );

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setStep('amount');
  };

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  const handleSubmit = async () => {
    if (!selectedCustomer || !amount) return;
    
    setIsSubmitting(true);
    const desc = description || (type === 'debt' ? 'Fiado' : 'Abono');
    
    try {
      await onSubmit(parseInt(amount), desc, selectedCustomer.id);
      setStep('confirm');
      setTimeout(() => onCancel(), 1500);
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = type === 'debt' ? 'Registrar fiado' : 'Registrar abono';
  const colorClass = type === 'debt' ? 'bg-amber-500' : 'bg-emerald-500';

  // Paso 1: Seleccionar cliente
  if (step === 'select') {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-zinc-100">
          <button onClick={onCancel} className="p-2 hover:bg-zinc-100 rounded-xl">
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-black">{title}</h2>
        </div>

        {/* Búsqueda */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <Input
              type="text"
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-14 rounded-2xl border-2 text-base"
              autoFocus
            />
          </div>
        </div>

        {/* Lista de clientes */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {filteredCustomers.map((customer) => (
            <button
              key={customer.id}
              onClick={() => handleSelectCustomer(customer)}
              className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-zinc-100 hover:border-zinc-300 active:scale-[0.98] transition-all mb-2 text-left"
            >
              <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center">
                <span className="text-lg font-black text-zinc-700">
                  {customer.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-zinc-900">{customer.name}</p>
                <p className="text-sm text-zinc-500">
                  {customer.totalDebt > 0 
                    ? `Debe: ${formatCOP(customer.totalDebt)}`
                    : 'Al día'
                  }
                </p>
              </div>
              <ArrowLeft className="w-5 h-5 text-zinc-400 rotate-180" />
            </button>
          ))}

          {filteredCustomers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-zinc-500 mb-4">No encontramos ese cliente</p>
              {onAddCustomer && (
                <Button 
                  onClick={() => {/* Lógica para agregar */}}
                  className="h-12 rounded-xl"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Agregar nuevo cliente
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Paso 2: Ingresar monto
  if (step === 'amount' && selectedCustomer) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-zinc-100">
          <button 
            onClick={() => setStep('select')} 
            className="p-2 hover:bg-zinc-100 rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-black">{title}</h2>
            <p className="text-sm text-zinc-500">{selectedCustomer.name}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Monto */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-zinc-700 mb-2">
              ¿Cuánto?
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-zinc-400">
                $
              </span>
              <Input
                ref={amountInputRef}
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 h-16 text-2xl font-black rounded-2xl border-2"
              />
            </div>
          </div>

          {/* Montos rápidos */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {QUICK_AMOUNTS.map((value) => (
              <button
                key={value}
                onClick={() => handleQuickAmount(value)}
                className="py-3 px-2 bg-zinc-100 rounded-xl text-sm font-bold text-zinc-700 hover:bg-zinc-200 active:scale-95 transition-all"
              >
                {formatCOP(value)}
              </button>
            ))}
          </div>

          {/* Descripción opcional */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-zinc-700 mb-2">
              ¿Qué compró? (opcional)
            </label>
            <Input
              type="text"
              placeholder="Ej: Arroz, aceite, mercado..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-14 rounded-2xl border-2"
            />
          </div>

          {/* Info del cliente */}
          <div className="bg-zinc-50 rounded-2xl p-4 mb-6">
            <p className="text-sm text-zinc-600">
              <span className="font-medium">Cliente:</span> {selectedCustomer.name}
            </p>
            {selectedCustomer.phone && (
              <p className="text-sm text-zinc-600">
                <span className="font-medium">Tel:</span> {selectedCustomer.phone}
              </p>
            )}
            {type === 'debt' && selectedCustomer.totalDebt > 0 && (
              <p className="text-sm text-zinc-600">
                <span className="font-medium">Deuda actual:</span>{' '}
                <span className="text-red-600 font-bold">
                  {formatCOP(selectedCustomer.totalDebt)}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Botón guardar */}
        <div className="p-4 border-t border-zinc-100">
          <Button
            onClick={handleSubmit}
            disabled={!amount || isSubmitting}
            className={cn(
              "w-full h-16 rounded-2xl font-black text-lg",
              colorClass,
              "hover:opacity-90 active:scale-95 transition-all"
            )}
          >
            {isSubmitting ? 'Guardando...' : (
              <>
                {type === 'debt' ? (
                  <Receipt className="w-5 h-5 mr-2" />
                ) : (
                  <DollarSign className="w-5 h-5 mr-2" />
                )}
                Guardar {type === 'debt' ? 'fiado' : 'abono'}
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Paso 3: Confirmación
  if (step === 'confirm') {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-black text-zinc-900 mb-2">¡Guardado!</h3>
          <p className="text-zinc-500">
            El {type === 'debt' ? 'fiado' : 'abono'} se registró correctamente
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default QuickTransaction;
