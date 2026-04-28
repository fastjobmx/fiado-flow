import { useState } from 'react';
import { Plus, Store, BarChart3, LogOut, Loader2, Settings, Shield, UserPlus, CreditCard, Clock, MessageSquare, FileSpreadsheet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFiados } from '@/hooks/useFiados';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useAccountStatus } from '@/hooks/useAccountStatus';
import { useUserRole } from '@/hooks/useUserRole';
import { Customer } from '@/types/fiado';
import { Dashboard } from '@/components/Dashboard';
import { OverdueAlerts } from '@/components/OverdueAlerts';
import { CustomerList } from '@/components/CustomerList';
import { CustomerDetail } from '@/components/CustomerDetail';
import { AddCustomerForm } from '@/components/AddCustomerForm';
import { PaymentsSummary } from '@/components/PaymentsSummary';
import { QuickDebtForm } from '@/components/QuickDebtForm';
import { QuickPaymentForm } from '@/components/QuickPaymentForm';
import { SimpleReports } from '@/components/SimpleReports';
import { ExcelManager } from '@/components/ExcelManager';
import { FloatingActions } from '@/components/FloatingActions';
import { WelcomeTooltip } from '@/components/WelcomeTooltip';
import ProfileSettings from '@/components/ProfileSettings';
import { MaintenanceBanner } from '@/components/MaintenanceBanner';
import { Button } from '@/components/ui/button';
import { MobileActionBar } from '@/components/MobileActionBar';
import { canCreateDebt, canCreateCustomer, formatCOP } from '@/lib/utils';
import { useSubscription } from '@/hooks/useSubscription';
import { PlanSelector } from '@/components/PlanSelector';
import { UpgradeModal } from '@/components/UpgradeModal';
import { PlanType } from '@/types/subscription';

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

  // Lógica de suscripción y planes
  const {
    subscription,
    plan,
    canAddCustomer,
    canAddTransaction,
    isNearCustomerLimit,
    isNearTransactionLimit,
    customerLimitMessage,
    transactionLimitMessage,
    upgradePlan,
  } = useSubscription({
    currentCustomers: customers.length,
    currentTransactions: transactions.length,
  });

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showPaymentsSummary, setShowPaymentsSummary] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalType, setUpgradeModalType] = useState<'customers' | 'transactions' | 'feature'>('customers');
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
            onClick={() => setShowReports(true)}
            title="Reportes"
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

      {/* Dashboard Principal */}
      <div className="mb-6">
        <Dashboard
          totalDebt={getTotalDebt()}
          customersWithDebt={customersWithDebt}
          todayPayments={dailyStats?.newPayments || 0}
          todayDebts={dailyStats?.newDebts || 0}
          overdueCustomers={getOverdueCustomers(7)}
          recentTransactions={transactions.slice(0, 5)}
          onViewCustomers={() => document.getElementById('clientes-section')?.scrollIntoView({ behavior: 'smooth' })}
          onViewCustomer={setSelectedCustomer}
          onAddDebt={() => {
            if (!canAddTransaction) {
              setUpgradeModalType('transactions');
              setShowUpgradeModal(true);
              return;
            }
            setShowQuickTransaction({ type: 'debt' });
          }}
          onAddPayment={() => {
            if (!canAddTransaction) {
              setUpgradeModalType('transactions');
              setShowUpgradeModal(true);
              return;
            }
            setShowQuickTransaction({ type: 'payment' });
          }}
          onSendWhatsApp={(customer) => {
            if (customer.phone) {
              const message = `Hola ${customer.name}, te recuerdo que tienes un saldo pendiente de ${formatCOP(customer.totalDebt)} en ${profile?.store_name || 'mi tienda'}. Gracias por tu abono.`;
              window.open(`https://wa.me/57${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
            }
          }}
          planName={plan.name}
          planId={plan.id}
          customerLimit={plan.limits.maxCustomers}
          currentCustomers={customers.length}
          onShowPlanSelector={() => setShowPlanSelector(true)}
        />
      </div>

      {/* AI Alerts */}
      <div id="alerts-section" className="mb-8">
        <OverdueAlerts
          customers={overdueCustomers}
          onCustomerClick={setSelectedCustomer}
          storeName={profile?.store_name}
        />
      </div>

      {/* Lista de Clientes */}
      <div id="clientes-section" className="mt-8">
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
        onShowCustomers={() => handleQuickAction('clientes-section')}
        onShowCollection={() => handleQuickAction('alerts-section')}
        onShowSettings={() => setShowSettings(true)}
      />

      {/* Formulario Registrar Fiado */}
      {showQuickTransaction?.type === 'debt' && (
        <QuickDebtForm
          customers={customers}
          onSubmit={async (customerId, amount, description, date, promisedDate) => {
            return await addDebt(customerId, amount, description, date);
          }}
          onCancel={() => setShowQuickTransaction(null)}
        />
      )}

      {/* Formulario Registrar Abono */}
      {showQuickTransaction?.type === 'payment' && (
        <QuickPaymentForm
          customers={customers}
          onSubmit={async (customerId, amount, description, date) => {
            return await addPayment(customerId, amount, description, date);
          }}
          onCancel={() => setShowQuickTransaction(null)}
        />
      )}

      {/* Floating Action Button para acceso rápido */}
      {!selectedCustomer && (
        <FloatingActions
          onAddCustomer={() => {
            if (!canAddCustomer) {
              setUpgradeModalType('customers');
              setShowUpgradeModal(true);
              return;
            }
            setShowAddCustomer(true);
          }}
          onAddDebt={() => {
            if (!canAddTransaction) {
              setUpgradeModalType('transactions');
              setShowUpgradeModal(true);
              return;
            }
            setShowQuickTransaction({ type: 'debt' });
          }}
          canAddCustomer={canAddCustomer}
          canAddDebt={canAddTransaction}
        />
      )}

      {/* Reservar espacio para que el contenido no quede debajo de la barra */}
      <div className="h-20" style={{ height: 'calc(64px + env(safe-area-inset-bottom))' }} />

      {/* Modales */}
      {/* Add Customer Modal */}
      {showAddCustomer && (
        <AddCustomerForm
          onSubmit={async (name, phone, nickname, address, notes) => {
            // Verificar límite antes de agregar
            if (!canAddCustomer) {
              setUpgradeModalType('customers');
              setShowUpgradeModal(true);
              return;
            }
            await addCustomer(name, phone, nickname, address, notes);
            setShowAddCustomer(false);
          }}
          onCancel={() => setShowAddCustomer(false)}
          canAddCustomer={canAddCustomer}
          limitMessage={customerLimitMessage}
          onUpgrade={() => {
            setShowAddCustomer(false);
            setShowPlanSelector(true);
          }}
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

      {/* Reportes */}
      {showReports && (
        <SimpleReports
          customers={customers}
          transactions={transactions}
          onBack={() => setShowReports(false)}
        />
      )}

      {/* Plan Selector */}
      {showPlanSelector && (
        <PlanSelector
          currentPlan={plan.id}
          onSelectPlan={(newPlan) => {
            upgradePlan(newPlan);
            setShowPlanSelector(false);
          }}
          onCancel={() => setShowPlanSelector(false)}
        />
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={(newPlan) => {
            upgradePlan(newPlan);
            setShowUpgradeModal(false);
          }}
          type={upgradeModalType}
        />
      )}

      {/* Tooltips de bienvenida */}
      {!selectedCustomer && <WelcomeTooltip />}
    </div>
  );
};

export default Index;
