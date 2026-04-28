import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, User, DollarSign, Calendar, Check, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Customer, Transaction } from '@/types/fiado';
import { formatCOP } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface QuickPaymentFormProps {
  customers: Customer[];
  selectedCustomer?: Customer | null;
  onSubmit: (customerId: string, amount: number, description: string, date: Date) => Promise<Transaction | null>;
  onCancel: () => void;
}

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000, 100000];

export const QuickPaymentForm = ({
  customers,
  selectedCustomer: initialCustomer,
  onSubmit,
  onCancel,
}: QuickPaymentFormProps) => {
  const [step, setStep] = useState<'client' | 'amount' | 'confirm' | 'success'>('client');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(initialCustomer || null);
  const [search, setSearch] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
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

  // Solo mostrar clientes que deben
  const customersWithDebt = customers.filter(c => (c.totalDebt || 0) > 0);
  
  const filteredCustomers = customersWithDebt.filter(c => 
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
      setError('El abono debe ser mayor a $0');
      return false;
    }
    if (selectedCustomer && num > (selectedCustomer.totalDebt || 0)) {
      setError(`El abono no puede ser mayor a la deuda (${formatCOP(selectedCustomer.totalDebt)})`);
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
      setStep('confirm');
    }
  };

  const handleSubmit = async () => {
    if (!selectedCustomer || !amount) return;
    
    setIsSubmitting(true);
    try {
      const numAmount = parseInt(amount.replace(/\D/g, ''));
      
      await onSubmit(
        selectedCustomer.id,
        numAmount,
        description || 'Abono',
        new Date(date)
      );
      
      setStep('success');
      setTimeout(() => onCancel(), 2000);
    } catch (err) {
      setError('No se pudo guardar. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formatear valor para mostrar
  const displayAmount = amount ? formatCOP(parseInt(amount.replace(/\D/g, '')) || 0) : '';
  const remainingDebt = selectedCustomer 
    ? Math.max(0, (selectedCustomer.totalDebt || 0) - (parseInt(amount.replace(/\D/g, '')) || 0))
    : 0;

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
            <h2 className="text-lg font-black">¿Quién abonó?</h2>
            <p className="text-sm text-zinc-500">Solo clientes con deuda</p>
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

        {/* Lista de clientes con deuda */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {filteredCustomers.map((customer) => (
            <button
              key={customer.id}
              onClick={() => handleSelectCustomer(customer)}
              className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-zinc-100 hover:border-zinc-300 active:scale-[0.98] transition-all mb-2 text-left"
            >
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <span className="text-lg font-black text-emerald-700">
                  {customer.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-zinc-900">{customer.name}</p>
                <p className="text-sm text-red-500 font-medium">
                  Debe: {formatCOP(customer.totalDebt)}
                </p>
              </div>
              <ArrowLeft className="w-5 h-5 text-zinc-400 rotate-180" />
            </button>
          ))}

          {filteredCustomers.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="text-zinc-700 font-bold">¡Todos al día!</p>
              <p className="text-sm text-zinc-500 mt-1">
                No hay clientes con deudas pendientes
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Paso 2: Ingresar valor del abono
  if (step === 'amount' && selectedCustomer) {
    const canPayFull = selectedCustomer.totalDebt > 0;

    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-zinc-100">
          <button onClick={() => setStep('client')} className="p-2 hover:bg-zinc-100 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-black">¿Cuánto abonó?</h2>
            <p className="text-sm text-zinc-500">{selectedCustomer.name}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Deuda actual */}
          <div className="bg-red-50 rounded-2xl p-4 mb-6 border-2 border-red-100">
            <p className="text-sm text-red-600 font-medium">Deuda actual</p>
            <p className="text-2xl font-black text-red-700">
              {formatCOP(selectedCustomer.totalDebt)}
            </p>
          </div>

          {/* Valor del abono */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-zinc-700 mb-2">
              Valor del abono *
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
                  error ? "border-red-500" : "border-zinc-200 focus:border-emerald-500"
                )}
              />
            </div>
            {/* Preview formateado */}
            {displayAmount && (
              <p className="text-center text-lg font-bold text-zinc-600 mt-2">
                Abono: {displayAmount}
              </p>
            )}
            {error && (
              <p className="text-sm text-red-500 mt-2 font-medium">{error}</p>
            )}
          </div>

          {/* Botón pagar todo */}
          {canPayFull && (
            <button
              type="button"
              onClick={() => handleQuickAmount(selectedCustomer.totalDebt || 0)}
              className="w-full mb-4 py-3 px-4 bg-emerald-100 text-emerald-700 rounded-xl font-bold hover:bg-emerald-200 active:scale-95 transition-all"
            >
              Pagar deuda completa: {formatCOP(selectedCustomer.totalDebt)}
            </button>
          )}

          {/* Montos rápidos */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {QUICK_AMOUNTS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleQuickAmount(value)}
                className="py-3 px-2 bg-zinc-100 rounded-xl text-sm font-bold text-zinc-700 hover:bg-emerald-100 hover:text-emerald-700 active:scale-95 transition-all"
              >
                {formatCOP(value)}
              </button>
            ))}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-2">
              Nota (opcional)
            </label>
            <Input
              type="text"
              placeholder="Ej: Abono parcial, pagó en efectivo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-14 rounded-2xl border-2 text-base"
            />
          </div>
        </div>

        {/* Botón continuar */}
        <div className="p-4 border-t border-zinc-100">
          <Button
            onClick={handleContinue}
            disabled={!amount || !!error}
            className="w-full h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg disabled:opacity-50"
          >
            Continuar
            <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
          </Button>
        </div>
      </div>
    );
  }

  // Paso 3: Confirmar
  if (step === 'confirm' && selectedCustomer) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-zinc-100">
          <button onClick={() => setStep('amount')} className="p-2 hover:bg-zinc-100 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-black">Confirmar abono</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Resumen visual */}
          <div className="bg-emerald-50 rounded-2xl p-6 mb-6 border-2 border-emerald-100">
            <div className="text-center mb-4">
              <p className="text-sm text-emerald-600 font-medium mb-1">Abono recibido</p>
              <p className="text-4xl font-black text-emerald-700">
                {formatCOP(parseInt(amount.replace(/\D/g, '')) || 0)}
              </p>
            </div>
            
            <div className="space-y-2 text-sm border-t border-emerald-200 pt-4">
              <div className="flex justify-between">
                <span className="text-emerald-600">Cliente:</span>
                <span className="font-bold text-emerald-800">{selectedCustomer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-600">Deuda anterior:</span>
                <span className="font-bold text-emerald-800">{formatCOP(selectedCustomer.totalDebt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-600">Abono:</span>
                <span className="font-bold text-emerald-800">- {formatCOP(parseInt(amount.replace(/\D/g, '')) || 0)}</span>
              </div>
              <div className="flex justify-between border-t border-emerald-200 pt-2 mt-2">
                <span className="text-emerald-700 font-bold">Saldo pendiente:</span>
                <span className="font-black text-emerald-800 text-lg">
                  {formatCOP(remainingDebt)}
                </span>
              </div>
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-2">
              Fecha del abono *
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
        </div>

        {/* Botón guardar */}
        <div className="p-4 border-t border-zinc-100 space-y-2">
          {error && (
            <p className="text-sm text-red-500 text-center font-medium">{error}</p>
          )}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg"
          >
            {isSubmitting ? 'Guardando...' : (
              <>
                <DollarSign className="w-5 h-5 mr-2" />
                Confirmar abono
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Paso 4: Éxito
  if (step === 'success') {
    const numAmount = parseInt(amount.replace(/\D/g, '')) || 0;
    const isPaid = remainingDebt === 0;

    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6",
            isPaid ? "bg-emerald-100" : "bg-blue-100"
          )}>
            <Check className={cn(
              "w-10 h-10",
              isPaid ? "text-emerald-600" : "text-blue-600"
            )} />
          </div>
          <h3 className="text-2xl font-black text-zinc-900 mb-2">
            {isPaid ? '¡Cuenta saldada!' : '¡Abono registrado!'}
          </h3>
          <p className="text-zinc-500">
            {formatCOP(numAmount)} recibido de {selectedCustomer?.name}
          </p>
          {!isPaid && (
            <p className="text-sm text-zinc-400 mt-2">
              Queda pendiente: {formatCOP(remainingDebt)}
            </p>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default QuickPaymentForm;
