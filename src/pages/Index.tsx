import { useState } from 'react';
import { Plus, Store, BarChart3, LogOut, Loader2, Settings, Shield } from 'lucide-react';
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
// Import incorrecto (exportación nombrada) — cámbialo:
import ProfileSettings from '@/components/ProfileSettings';
import { MaintenanceBanner } from '@/components/MaintenanceBanner';
import { Button } from '@/components/ui/button';
import { MobileActionBar } from '@/components/MobileActionBar';

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
    getTotalDebt,
    getOverdueCustomers,
    getCustomerTransactions,
    deleteCustomer,
    updateCustomer,
  } = useFiados();

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showPaymentsSummary, setShowPaymentsSummary] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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
          onAddDebt={(amount, desc) => addDebt(currentCustomer.id, amount, desc)}
          onAddPayment={(amount, desc) => addPayment(currentCustomer.id, amount, desc)}
          onEdit={(name, phone) => updateCustomer(currentCustomer.id, name, phone)}
          onDelete={() => {
            deleteCustomer(currentCustomer.id);
            setSelectedCustomer(null);
          }}
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
      {currentInvoice && currentInvoice.status !== 'paid' && (
        <MaintenanceBanner
          status={currentInvoice.status as 'open' | 'overdue' | 'paid'}
          amount={currentInvoice.amount_cop}
          dueDate={currentInvoice.due_at}
          graceUntil={currentInvoice.grace_until}
        />
      )}

      {/* Dashboard Card */}
      <div className="mb-6">
        <DashboardHeader
          totalDebt={getTotalDebt()}
          customerCount={customersWithDebt.length}
        />
      </div>

      {/* AI Alerts */}
      <div className="mb-6">
        <OverdueAlerts
          customers={overdueCustomers}
          onCustomerClick={setSelectedCustomer}
        />
      </div>

      {/* Customer List */}
      <CustomerList
        customers={customers}
        onCustomerClick={setSelectedCustomer}
      />

      {/* Barra inferior móvil */}
      <MobileActionBar
        onAddCustomer={() => setShowAddCustomer(true)}
        onShowSummary={() => setShowPaymentsSummary(true)}
        onShowSettings={() => setShowSettings(true)}
      />

      {/* Reservar espacio para que el contenido no quede debajo de la barra */}
      <div className="h-20" style={{ height: 'calc(64px + env(safe-area-inset-bottom))' }} />

      {/* Modales */}
      {/* Add Customer Modal */}
      {showAddCustomer && (
        <AddCustomerForm
          onSubmit={async (name, phone) => {
            await addCustomer(name, phone);
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
    </div>
  );
};

export default Index;
