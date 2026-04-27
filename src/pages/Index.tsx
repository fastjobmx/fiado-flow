import { useState } from 'react';
import { Plus, Store, BarChart3, LogOut, Loader2, Settings, Shield, UserPlus, CreditCard, Clock, MessageSquare, FileSpreadsheet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFiados } from '@/hooks/useFiados';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useAccountStatus } from '@/hooks/useAccountStatus';
import { useUserRole } from '@/hooks/useUserRole';
import { Customer } from '@/types/fiado';
import { DashboardHeader } from '@/components/DashboardHeader';
import { OverdueAlerts } from '@/components/OverdueAlerts';
import { CustomerList } from '@/components/CustomerList';
import { CustomerDetail } from '@/components/CustomerDetail';
import { AddCustomerForm } from '@/components/AddCustomerForm';
import { PaymentsSummary } from '@/components/PaymentsSummary';
import { TransactionForm } from '@/components/TransactionForm';
import { ExcelManager } from '@/components/ExcelManager';
import { FloatingActions } from '@/components/FloatingActions';
import { WelcomeTooltip } from '@/components/WelcomeTooltip';
import ProfileSettings from '@/components/ProfileSettings';
import { MaintenanceBanner } from '@/components/MaintenanceBanner';
import { Button } from '@/components/ui/button';
import { MobileActionBar } from '@/components/MobileActionBar';
import { canCreateDebt, canCreateCustomer } from '@/lib/utils';

const Index = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { currentInvoice } = useAccountStatus();
  const { isAdmin } = useUserRole();
  const { profile, updateStoreName, uploadLogo, updateTheme, updateBrandingColors, getColors, getActiveTheme, updatePaymentContacts, updateMessageTemplates, getPaymentContacts, getMessageTemplates } = useProfile();
  const {
    customers,
    transactions,
    loading,
    addCustomer,
    addDebt,
    addPayment,
    payFullAmount,
    getTotalDebt,
    getOverdueCustomers,
    getCustomerTransactions,
    deleteCustomer,
    updateCustomer,
    getDailyStats,
    importCustomers,
  } = useFiados();

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showPaymentsSummary, setShowPaymentsSummary] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [autoFocusSearch, setAutoFocusSearch] = useState(false);
  const [showQuickTransaction, setShowQuickTransaction] = useState<{ type: 'debt' | 'payment' } | null>(null);

  const handleQuickAction = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      if (sectionId === 'customer-list-section') {
        setAutoFocusSearch(true);
        // Reset after a short delay so it can be triggered again
        setTimeout(() => setAutoFocusSearch(false), 500);
      }
    }
  };

  const isSuspended = !isAdmin && currentInvoice?.status === 'inactive';
  const userStatus = isAdmin ? 'paid' : (isSuspended ? 'inactive' : (currentInvoice?.status || 'paid'));
  const dailyStats = getDailyStats();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const customersWithDebt = customers.filter((c) => c.totalDebt > 0);
  const overdueCustomers = getOverdueCustomers(15);

  if (selectedCustomer) {
    const currentCustomer = customers.find((c) => c.id === selectedCustomer.id);
    if (!currentCustomer) {
      setSelectedCustomer(null);
      return null;
    }

    return (
      <div className="min-h-screen bg-background p-4 pb-24 max-w-md mx-auto">
        <CustomerDetail
          customer={currentCustomer}
          transactions={getCustomerTransactions(currentCustomer.id)}
          onBack={() => setSelectedCustomer(null)}
          onAddDebt={(amount, desc, date, note) => addDebt(currentCustomer.id, amount, desc, date, note)}
          onAddPayment={(amount, desc, date, method, note) => addPayment(currentCustomer.id, amount, desc, date, method, note)}
          onPayFullAmount={(date, method, note) => payFullAmount(currentCustomer.id, date, method, note)}
          onEdit={(data) => updateCustomer(currentCustomer.id, data.name || '', data.phone || '', data.nickname, data.address, data.notes)}
          onDelete={() => {
            deleteCustomer(currentCustomer.id);
            setSelectedCustomer(null);
          }}
          userStatus={userStatus}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-32 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center overflow-hidden">
            {profile?.logo_url ? (
              <img src={profile.logo_url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Store className="w-5 h-5 text-primary-foreground" />
            )}
          </div>
          <div className="text-left">
            <h1 className="text-xl font-bold text-foreground">{profile?.store_name || 'Mi Tienda'}</h1>
            <p className="text-sm text-muted-foreground">Control de Fiados</p>
          </div>
        </button>
        <div className="flex gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/admin')}
              title="Panel de Admin"
            >
              <Shield className="w-5 h-5" />
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowSettings(true)}
            title="Configuración"
          >
            <Settings className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowPaymentsSummary(true)}
            title="Resumen de pagos"
          >
            <BarChart3 className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Maintenance Banner */}
      {!isAdmin && currentInvoice && currentInvoice.status !== 'paid' && (
        <MaintenanceBanner
          status={currentInvoice.status as 'open' | 'overdue' | 'paid'}
          amount={currentInvoice.amount_cop}
          dueDate={currentInvoice.due_at}
          graceUntil={currentInvoice.grace_until}
          isSuspended={isSuspended}
          planType={(profile as any)?.plan_type || 'trial'}
        />
      )}

      {/* Dashboard Card */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <DashboardHeader
              totalDebt={getTotalDebt()}
              customerCount={customersWithDebt.length}
              dailyStats={dailyStats}
            />
          </div>
          <ExcelManager
            customers={customers}
            transactions={transactions}
            selectedCustomer={selectedCustomer}
            onImportCustomers={async (customers) => { await importCustomers(customers); }}
            className="flex-shrink-0"
          />
        </div>
      </div>

      {/* Accesos Rápidos */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <Button 
          onClick={() => setShowQuickTransaction({ type: 'debt' })}
          disabled={!canCreateDebt(userStatus)}
          className="h-24 rounded-3xl flex flex-col gap-2 bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 border-0"
        >
          <div className="p-2 bg-white/20 rounded-xl">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-xs uppercase tracking-tight">Registrar fiado</span>
        </Button>
        <Button 
          onClick={() => setShowQuickTransaction({ type: 'payment' })}
          className="h-24 rounded-3xl flex flex-col gap-2 bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50 transition-all shadow-sm border"
        >
          <div className="p-2 bg-green-50 rounded-xl">
            <CreditCard className="w-5 h-5 text-green-600" />
          </div>
          <span className="font-black text-xs uppercase tracking-tight">Registrar abono</span>
        </Button>
        <Button 
          onClick={() => handleQuickAction('alerts-section')}
          className="h-24 rounded-3xl flex flex-col gap-2 bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50 transition-all shadow-sm border"
        >
          <div className="p-2 bg-red-50 rounded-xl">
            <Clock className="w-5 h-5 text-red-600" />
          </div>
          <span className="font-black text-xs uppercase tracking-tight">Cobrar morosos</span>
        </Button>
        <Button 
          onClick={() => setShowAddCustomer(true)}
          disabled={!canCreateCustomer(userStatus)}
          className="h-24 rounded-3xl flex flex-col gap-2 bg-zinc-900 hover:bg-zinc-800 transition-all shadow-sm"
        >
          <div className="p-2 bg-white/10 rounded-xl">
            <UserPlus className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-xs uppercase tracking-tight">Nuevo cliente</span>
        </Button>
      </div>

      {/* AI Alerts */}
      <div id="alerts-section" className="mb-8">
        <OverdueAlerts
          customers={overdueCustomers}
          onCustomerClick={setSelectedCustomer}
          storeName={profile?.store_name}
        />
      </div>

      {/* Customer List */}
      <div id="customer-list-section">
        <CustomerList
          customers={customers}
          onCustomerClick={setSelectedCustomer}
          onAddCustomer={() => setShowAddCustomer(true)}
          autoFocusSearch={autoFocusSearch}
        />
      </div>

      {/* Barra inferior móvil */}
      <MobileActionBar
        onAddTransaction={(type) => setShowQuickTransaction({ type })}
        onGoHome={() => {
          setSelectedCustomer(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onShowCustomers={() => handleQuickAction('customer-list-section')}
        onShowCollection={() => handleQuickAction('alerts-section')}
        onShowSettings={() => setShowSettings(true)}
      />

      {/* Modales Rápidos */}
      {showQuickTransaction && (
        <TransactionForm
          type={showQuickTransaction.type}
          customers={customers}
          userStatus={userStatus}
          onSubmit={async (amount, desc, date, customerId, note, method) => {
            if (showQuickTransaction.type === 'debt') {
              return await addDebt(customerId, amount, desc, date, note);
            } else {
              return await addPayment(customerId, amount, desc, date, method, note);
            }
          }}
          onAddCustomer={async (name, phone) => {
            return await addCustomer(name, phone || '');
          }}
          onCancel={() => setShowQuickTransaction(null)}
        />
      )}

      {/* Floating Action Button para acceso rápido */}
      {!selectedCustomer && (
        <FloatingActions
          onAddCustomer={() => setShowAddCustomer(true)}
          onAddDebt={() => setShowQuickTransaction({ type: 'debt' })}
          canAddCustomer={canCreateCustomer(userStatus)}
          canAddDebt={canCreateDebt(userStatus)}
        />
      )}

      {/* Reservar espacio para que el contenido no quede debajo de la barra */}
      <div className="h-20" style={{ height: 'calc(64px + env(safe-area-inset-bottom))' }} />

      {/* Modales */}
      {/* Add Customer Modal */}
      {showAddCustomer && (
        <AddCustomerForm
          onSubmit={async (name, phone, nickname, address, notes) => {
            await addCustomer(name, phone, nickname, address, notes);
            setShowAddCustomer(false);
          }}
          onCancel={() => setShowAddCustomer(false)}
        />
      )}

      {/* Payments Summary Modal */}
      {showPaymentsSummary && (
        <PaymentsSummary
          transactions={transactions}
          onClose={() => setShowPaymentsSummary(false)}
        />
      )}

      {/* Profile Settings Modal */}
      {showSettings && (
        <ProfileSettings
          currentStoreName={profile?.store_name || 'Mi Tienda'}
          currentLogoUrl={profile?.logo_url || null}
          currentColors={getColors()}
          activeTheme={getActiveTheme()}
          onSaveName={updateStoreName}
          onUploadLogo={uploadLogo}
          onSaveTheme={updateTheme}
          onSaveColors={updateBrandingColors}
          paymentContacts={getPaymentContacts()}
          messageTemplates={getMessageTemplates()}
          onSavePaymentContacts={updatePaymentContacts}
          onSaveMessageTemplates={updateMessageTemplates}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Tooltips de bienvenida */}
      {!selectedCustomer && <WelcomeTooltip />}
    </div>
  );
};

export default Index;
