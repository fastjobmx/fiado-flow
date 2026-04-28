import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, User, DollarSign, Calendar, MessageSquare, Check, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Customer, Transaction } from '@/types/fiado';
import { formatCOP, parseCOP } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface QuickDebtFormProps {
  customers: Customer[];
  selectedCustomer?: Customer | null;
  onSubmit: (customerId: string, amount: number, description: string, date: Date, promisedDate?: Date) => Promise<Transaction | null>;
  onCancel: () => void;
}

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000, 100000];

export const QuickDebtForm = ({
  customers,
  selectedCustomer: initialCustomer,
  onSubmit,
  onCancel,
}: QuickDebtFormProps) => {
  const [step, setStep] = useState<'client' | 'amount' | 'details' | 'success'>('client');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(initialCustomer || null);
  const [search, setSearch] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [promisedDate, setPromisedDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  const validateAmount = (value: string): boolean => {
    const num = parseInt(value.replace(/\D/g, ''));
    if (!num || num <= 0) {
      setError('El valor debe ser mayor a $0');
      return false;
    }
    if (num > 10000000) {
      setError('El valor máximo es $10.000.000');
      return false;
    }
    setError('');
    return true;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setAmount(value);
    if (value) {
      validateAmount(value);
    } else {
      setError('');
    }
  };

  const handleContinue = () => {
    if (validateAmount(amount)) {
      setStep('details');
    }
  };

  const handleSubmit = async () => {
    if (!selectedCustomer || !amount) return;
    
    setIsSubmitting(true);
    try {
      const numAmount = parseInt(amount.replace(/\D/g, ''));
      const promised = promisedDate ? new Date(promisedDate) : undefined;
      
      await onSubmit(
        selectedCustomer.id,
        numAmount,
        description || 'Fiado',
        new Date(date),
        promised
      );
      
      setStep('success');
      setTimeout(() => onCancel(), 2000);
    } catch (err) {
      setError('No se pudo guardar. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formatear valor para mostrar mientras escribe
  const displayAmount = amount ? formatCOP(parseInt(amount.replace(/\D/g, '')) || 0) : '';

  // Paso 1: Seleccionar cliente
  if (step === 'client') {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-zinc-100">
          <button onClick={onCancel} className="p-2 hover:bg-zinc-100 rounded-xl">
            <X className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-black">¿Quién fió?</h2>
            <p className="text-sm text-zinc-500">Selecciona el cliente</p>
          </div>
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
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <span className="text-lg font-black text-amber-700">
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
              <p className="text-zinc-500">No encontramos ese cliente</p>
              <p className="text-sm text-zinc-400 mt-1">
                Agrega el cliente primero
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Paso 2: Ingresar valor
  if (step === 'amount' && selectedCustomer) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-zinc-100">
          <button onClick={() => setStep('client')} className="p-2 hover:bg-zinc-100 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-black">¿Cuánto fiado?</h2>
            <p className="text-sm text-zinc-500">{selectedCustomer.name}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Valor */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-zinc-700 mb-2">
              Valor del fiado *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-zinc-400">
                $
              </span>
              <Input
                ref={amountInputRef}
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={amount}
                onChange={handleAmountChange}
                className={cn(
                  "pl-10 h-20 text-3xl font-black rounded-2xl border-2",
                  error ? "border-red-500" : "border-zinc-200 focus:border-amber-500"
                )}
              />
            </div>
            {/* Preview formateado */}
            {displayAmount && (
              <p className="text-center text-lg font-bold text-zinc-600 mt-2">
                {displayAmount}
              </p>
            )}
            {error && (
              <p className="text-sm text-red-500 mt-2 font-medium">{error}</p>
            )}
          </div>

          {/* Montos rápidos */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {QUICK_AMOUNTS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleQuickAmount(value)}
                className="py-3 px-2 bg-zinc-100 rounded-xl text-sm font-bold text-zinc-700 hover:bg-amber-100 hover:text-amber-700 active:scale-95 transition-all"
              >
                {formatCOP(value)}
              </button>
            ))}
          </div>

          {/* Info del cliente */}
          <div className="bg-zinc-50 rounded-2xl p-4">
            <p className="text-sm text-zinc-600">
              <span className="font-medium">Cliente:</span> {selectedCustomer.name}
            </p>
            {selectedCustomer.phone && (
              <p className="text-sm text-zinc-600">
                <span className="font-medium">Tel:</span> {selectedCustomer.phone}
              </p>
            )}
            {selectedCustomer.totalDebt > 0 && (
              <p className="text-sm text-zinc-600 mt-1">
                <span className="font-medium">Deuda actual:</span>{' '}
                <span className="text-red-600 font-bold">
                  {formatCOP(selectedCustomer.totalDebt)}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Botón continuar */}
        <div className="p-4 border-t border-zinc-100">
          <Button
            onClick={handleContinue}
            disabled={!amount || !!error}
            className="w-full h-16 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-lg disabled:opacity-50"
          >
            Continuar
            <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
          </Button>
        </div>
      </div>
    );
  }

  // Paso 3: Detalles opcionales
  if (step === 'details' && selectedCustomer) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-zinc-100">
          <button onClick={() => setStep('amount')} className="p-2 hover:bg-zinc-100 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-black">Detalles del fiado</h2>
            <p className="text-sm text-zinc-500">{formatCOP(parseInt(amount) || 0)}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Descripción */}
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-2">
              ¿Qué se llevó? (opcional)
            </label>
            <Input
              type="text"
              placeholder="Ej: Arroz, aceite, mercado..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-14 rounded-2xl border-2 text-base"
            />
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-2">
              Fecha del fiado *
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-12 h-14 rounded-2xl border-2 text-base"
                required
              />
            </div>
          </div>

          {/* Fecha prometida */}
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-2">
              ¿Cuándo prometió pagar? (opcional)
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <Input
                type="date"
                value={promisedDate}
                onChange={(e) => setPromisedDate(e.target.value)}
                className="pl-12 h-14 rounded-2xl border-2 text-base"
                min={date}
              />
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Te recordaremos cobrarle ese día
            </p>
          </div>

          {/* Resumen */}
          <div className="bg-amber-50 rounded-2xl p-4 border-2 border-amber-100">
            <h4 className="font-bold text-amber-900 mb-2">Resumen</h4>
            <div className="space-y-1 text-sm">
              <p className="text-amber-800">
                <span className="font-medium">Cliente:</span> {selectedCustomer.name}
              </p>
              <p className="text-amber-800">
                <span className="font-medium">Valor:</span> {formatCOP(parseInt(amount) || 0)}
              </p>
              <p className="text-amber-800">
                <span className="font-medium">Fecha:</span>{' '}
                {new Date(date).toLocaleDateString('es-CO')}
              </p>
              {promisedDate && (
                <p className="text-amber-800">
                  <span className="font-medium">Pagará:</span>{' '}
                  {new Date(promisedDate).toLocaleDateString('es-CO')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Botón guardar */}
        <div className="p-4 border-t border-zinc-100 space-y-2">
          {error && (
            <p className="text-sm text-red-500 text-center font-medium">{error}</p>
          )}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-16 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-lg"
          >
            {isSubmitting ? 'Guardando...' : (
              <>
                <DollarSign className="w-5 h-5 mr-2" />
                Guardar fiado
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Paso 4: Éxito
  if (step === 'success') {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-black text-zinc-900 mb-2">¡Fiado guardado!</h3>
          <p className="text-zinc-500">
            {formatCOP(parseInt(amount) || 0)} registrado para {selectedCustomer?.name}
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default QuickDebtForm;
