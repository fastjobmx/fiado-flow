import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, CreditCard, FileText, X, Search, UserPlus, Check, ArrowRight } from 'lucide-react';
import { Customer, Transaction } from '@/types/fiado';
import { formatCOP, parseCOP, normalizePhoneToColombia, buildDebtCreatedMessage, buildPaymentReceiptMessage } from '@/lib/utils';

interface TransactionFormProps {
  type: 'debt' | 'payment';
  customers: Customer[];
  selectedCustomer?: Customer | null;
  userStatus?: string;
  onSubmit: (amount: number, description: string, date: Date, customerId: string, note?: string, paymentMethod?: string) => Promise<Transaction | null>;
  onCancel: () => void;
  onAddCustomer: (name: string, phone?: string) => Promise<Customer | null>;
}

const paymentMethods = [
  { id: 'efectivo', label: 'Efectivo' },
  { id: 'nequi', label: 'Nequi' },
  { id: 'daviplata', label: 'Daviplata' },
  { id: 'bancolombia', label: 'Bancolombia' },
  { id: 'transferencia', label: 'Transferencia' },
  { id: 'otro', label: 'Otro' },
];

const quickDescriptions = [
  'Mercado',
  'Varios',
  'Arroz/Aceite',
  'Cerveza/Gaseosa',
  'Huevos/Leche',
  'Carne/Pollo'
];

export const TransactionForm = ({
  type,
  customers,
  selectedCustomer: initialCustomer,
  userStatus = 'active',
  onSubmit,
  onCancel,
  onAddCustomer,
}: TransactionFormProps) => {
  const [step, setStep] = useState<'selection' | 'form' | 'confirmation'>('selection');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(initialCustomer || null);
  const [search, setSearch] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ tx: Transaction; newBalance: number } | null>(null);
  
  const amountInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialCustomer) {
      setSelectedCustomer(initialCustomer);
      setStep('form');
    }
  }, [initialCustomer]);

  useEffect(() => {
    if (step === 'form' && amountInputRef.current) {
      setTimeout(() => {
        amountInputRef.current?.focus();
        // Intentar abrir el teclado numérico en móviles
        amountInputRef.current?.click();
      }, 150);
    } else if (step === 'selection' && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 150);
    }
  }, [step]);

  const isSuspended = userStatus === 'suspended' || userStatus === 'inactive';

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
      (c.nickname && c.nickname.toLowerCase().includes(search.toLowerCase())) ||
      c.phone.includes(search);
    
    if (type === 'payment') {
      return matchesSearch && c.totalDebt > 0;
    }
    return matchesSearch;
  });

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setStep('form');
  };

  const handleQuickCreate = async () => {
    if (!search.trim()) return;
    
    // Si la búsqueda parece un número de teléfono, lo usamos como tal
    const isPhone = /^\d{7,10}$/.test(search.trim());
    const name = isPhone ? "Nuevo Cliente" : search.trim();
    const phone = isPhone ? search.trim() : "";
    
    const newCustomer = await onAddCustomer(name, phone);
    if (newCustomer) {
      setSelectedCustomer(newCustomer);
      setStep('form');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || isSuspended) return;
    
    const numAmount = parseCOP(amount);
    if (numAmount <= 0) return;

    if (type === 'payment' && numAmount > selectedCustomer.totalDebt) {
      alert(`El abono no puede ser mayor al saldo pendiente (${formatCOP(selectedCustomer.totalDebt)})`);
      return;
    }

    setIsSubmitting(true);
    try {
      const tx = await onSubmit(
        numAmount,
        description || (type === 'debt' ? 'Fiado' : 'Abono'),
        new Date(date),
        selectedCustomer.id,
        note,
        type === 'payment' ? paymentMethod : undefined
      );

      // Si es un fiado y onSubmit devolvió null (pero se guardó localmente), creamos un objeto tx ficticio para la confirmación
      const finalTx = tx || { amount: numAmount };

      const newBalance = type === 'debt' 
        ? selectedCustomer.totalDebt + numAmount 
        : Math.max(0, selectedCustomer.totalDebt - numAmount);
      
      setResult({ tx: finalTx as Transaction, newBalance });
      setStep('confirmation');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatAmountInput = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '';
    return new Intl.NumberFormat('es-CO').format(parseInt(numbers, 10));
  };

  // UI para Suspended
  if (isSuspended) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl text-center">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⚠️</span>
          </div>
          <h3 className="text-2xl font-black text-zinc-900 mb-4">Cuenta Suspendida</h3>
          <p className="text-zinc-500 font-medium mb-8 leading-relaxed">
            Tu cuenta está suspendida por mantenimiento vencido. Tus datos están seguros. 
            Reactiva tu cuenta para registrar nuevos fiados.
          </p>
          <Button onClick={onCancel} className="w-full h-14 rounded-2xl bg-zinc-900 font-black uppercase tracking-wider">
            Entendido
          </Button>
        </div>
      </div>
    );
  }

  // Render Confirmation
  if (step === 'confirmation' && result && selectedCustomer) {
    const storeName = "la tienda"; // Podría venir de un contexto de tienda en el futuro
    const msg = type === 'debt' 
      ? buildDebtCreatedMessage(selectedCustomer.name, storeName, result.tx.amount, result.newBalance)
      : buildPaymentReceiptMessage(selectedCustomer.name, storeName, result.tx.amount, result.newBalance);

    const handleWhatsApp = () => {
      const cleanPhone = normalizePhoneToColombia(selectedCustomer.phone);
      if (!cleanPhone) {
        alert('El cliente no tiene un número de celular válido');
        return;
      }
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const handleCopy = () => {
      navigator.clipboard.writeText(msg);
      alert('Mensaje copiado al portapapeles');
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-black text-center text-zinc-900 mb-2">
            {type === 'debt' ? 'Fiado Registrado' : 'Abono Registrado'}
          </h3>
          <p className="text-center text-zinc-500 font-medium mb-8">
            {selectedCustomer.name} • {formatCOP(result.tx.amount)}
          </p>
          
          <div className="bg-zinc-50 rounded-2xl p-4 mb-8">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Saldo pendiente</p>
            <p className={`text-3xl font-black ${result.newBalance <= 0 ? 'text-green-600' : 'text-zinc-900'}`}>
              {formatCOP(result.newBalance)}
            </p>
            {result.newBalance <= 0 && (
              <p className="text-sm font-black text-green-600 mt-2">¡Cliente al día! 🎉</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            {selectedCustomer.phone && (
              <Button onClick={handleWhatsApp} className="h-14 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-black uppercase tracking-wider gap-2">
                Enviar WhatsApp
              </Button>
            )}
            <Button onClick={handleCopy} variant="outline" className="h-14 rounded-2xl border-zinc-200 font-black uppercase tracking-wider gap-2">
              Copiar Mensaje
            </Button>
            <Button onClick={onCancel} variant="ghost" className="h-14 rounded-2xl font-black uppercase tracking-wider text-zinc-400">
              Volver al inicio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-md rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-zinc-900 flex items-center gap-2">
            {step === 'selection' ? (
              <>
                <span className="p-2 bg-zinc-100 rounded-xl">👤</span>
                Seleccionar Cliente
              </>
            ) : (
              <>
                {type === 'debt' ? (
                  <span className="p-2 bg-red-50 rounded-xl">📝</span>
                ) : (
                  <span className="p-2 bg-green-50 rounded-xl">💰</span>
                )}
                {type === 'debt' ? 'Registrar Fiado' : 'Registrar Abono'}
              </>
            )}
          </h3>
          <button onClick={onCancel} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {step === 'selection' ? (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                ref={searchInputRef}
                placeholder="Buscar por nombre, apodo o celular..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-14 pl-11 bg-zinc-50 border-zinc-100 rounded-2xl font-bold"
              />
            </div>

            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
              {filteredCustomers.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCustomer(c)}
                  className="w-full flex items-center justify-between p-4 bg-zinc-50 hover:bg-zinc-100 rounded-2xl transition-colors text-left"
                >
                  <div>
                    <p className="font-black text-zinc-900">{c.name}</p>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-tighter">
                      {c.nickname && `${c.nickname} • `}{c.phone}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-zinc-400 uppercase">Saldo</p>
                    <p className="font-black text-zinc-900">{formatCOP(c.totalDebt)}</p>
                  </div>
                </button>
              ))}

              {filteredCustomers.length === 0 && search.trim() && type === 'debt' && (
                <button
                  onClick={handleQuickCreate}
                  className="w-full flex items-center gap-4 p-6 bg-primary/5 border-2 border-dashed border-primary/20 hover:bg-primary/10 rounded-3xl transition-all text-primary"
                >
                  <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                    <UserPlus className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-black uppercase tracking-tight">Crear "{search}"</p>
                    <p className="text-xs font-bold opacity-70">Nuevo cliente rápido</p>
                  </div>
                  <ArrowRight className="w-5 h-5 ml-auto" />
                </button>
              )}
              
              {customers.length === 0 && !search && (
                <div className="text-center py-12 bg-zinc-50 rounded-[32px] border-2 border-dashed border-zinc-200">
                  <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <UserPlus className="w-8 h-8 text-zinc-400" />
                  </div>
                  <h4 className="font-black text-zinc-900 mb-1">Aún no tienes clientes</h4>
                  <p className="text-sm text-zinc-500 font-medium mb-6 px-8">
                    Crea tu primer cliente para registrar un fiado.
                  </p>
                  <Button 
                    onClick={() => {
                      setSearch("Nuevo Cliente");
                      searchInputRef.current?.focus();
                    }}
                    className="bg-zinc-900 text-white rounded-xl font-bold px-6"
                  >
                    Crear cliente
                  </Button>
                </div>
              )}

              {type === 'payment' && customers.length > 0 && filteredCustomers.length === 0 && !search && (
                <div className="text-center py-12 bg-zinc-50 rounded-[32px] border-2 border-dashed border-zinc-200">
                  <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">💰</span>
                  </div>
                  <h4 className="font-black text-zinc-900 mb-1">No hay saldos pendientes</h4>
                  <p className="text-sm text-zinc-500 font-medium px-8">
                    Cuando registres un fiado, podrás registrar abonos aquí.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {selectedCustomer && (
              <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-2xl text-white">
                <div>
                  <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Cliente</p>
                  <p className="font-black">{selectedCustomer.name}</p>
                </div>
                {!initialCustomer && (
                  <button 
                    type="button" 
                    onClick={() => setStep('selection')}
                    className="text-xs font-black uppercase tracking-widest bg-white/10 px-3 py-1.5 rounded-lg"
                  >
                    Cambiar
                  </button>
                )}
              </div>
            )}

            <div>
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2 block">
                {type === 'debt' ? 'Valor del fiado' : 'Valor del abono'}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-zinc-400">$</span>
              <Input
              ref={amountInputRef}
              type="text"
              inputMode="numeric"
              placeholder="0"
                value={amount}
                onChange={(e) => setAmount(formatAmountInput(e.target.value))}
                onFocus={(e) => {
                  if (amount === '0') setAmount('');
                  e.target.select();
                }}
                className="h-20 pl-10 text-4xl font-black bg-zinc-50 border-zinc-100 rounded-2xl focus:bg-white transition-all text-zinc-900 placeholder:text-zinc-200"
              />
            </div>
            {selectedCustomer && type === 'payment' && (
              <p className="text-sm font-bold text-primary mt-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Saldo pendiente: {formatCOP(selectedCustomer.totalDebt)}
              </p>
            )}
          </div>
            
            <div>
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2 block">
                {type === 'debt' ? '¿Qué lleva?' : 'Descripción'}
              </label>
              <div className="relative mb-3">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  type="text"
                  placeholder={type === 'debt' ? 'Ej: Arroz, aceite, huevos' : 'Ej: Abono de la semana'}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-14 pl-11 bg-zinc-50 border-zinc-100 rounded-2xl font-bold"
                />
              </div>
              
              {type === 'debt' && (
                <div className="flex flex-wrap gap-2">
                  {quickDescriptions.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setDescription(tag)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                        description === tag 
                          ? 'bg-zinc-900 text-white border-zinc-900' 
                          : 'bg-zinc-50 text-zinc-500 border-zinc-100 hover:border-zinc-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2 block">
                  Fecha
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-14 pl-11 bg-zinc-50 border-zinc-100 rounded-2xl font-bold"
                  />
                </div>
              </div>

              {type === 'payment' && (
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2 block">
                    Método de Pago
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {paymentMethods.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id)}
                        className={`h-12 rounded-xl text-xs font-bold transition-all border ${
                          paymentMethod === m.id
                            ? 'bg-zinc-900 text-white border-zinc-900 shadow-lg shadow-zinc-200'
                            : 'bg-zinc-50 text-zinc-500 border-zinc-100 hover:border-zinc-200'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2 block">
                Nota interna (Opcional)
              </label>
              <Input
                type="text"
                placeholder="Nota privada sobre este movimiento"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-14 bg-zinc-50 border-zinc-100 rounded-2xl font-medium"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel} 
                className="flex-1 h-14 rounded-2xl border-zinc-200 font-bold text-zinc-500 hover:bg-zinc-50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className={`flex-1 h-14 rounded-2xl font-black shadow-lg transition-all ${
                  type === 'debt' 
                    ? 'bg-zinc-900 hover:bg-zinc-800 text-white shadow-zinc-200' 
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-green-100'
                }`}
                disabled={isSubmitting || !amount || amount === '0'}
              >
                {isSubmitting ? 'Guardando...' : (type === 'debt' ? 'Guardar Fiado' : 'Guardar Abono')}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
