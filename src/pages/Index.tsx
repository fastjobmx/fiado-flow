import { useState } from 'react';
import { Plus, Store, BarChart3 } from 'lucide-react';
import { useFiados } from '@/hooks/useFiados';
import { Customer } from '@/types/fiado';
import { DashboardHeader } from '@/components/DashboardHeader';
import { OverdueAlerts } from '@/components/OverdueAlerts';
import { CustomerList } from '@/components/CustomerList';
import { CustomerDetail } from '@/components/CustomerDetail';
import { AddCustomerForm } from '@/components/AddCustomerForm';
import { PaymentsSummary } from '@/components/PaymentsSummary';
import { Button } from '@/components/ui/button';

const Index = () => {
  const {
    customers,
    transactions,
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
    <div className="min-h-screen bg-background p-4 pb-24 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Store className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Mi Tienda</h1>
            <p className="text-sm text-muted-foreground">Control de Fiados</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowPaymentsSummary(true)}
          title="Resumen de pagos"
        >
          <BarChart3 className="w-5 h-5" />
        </Button>
      </div>

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

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 left-6 max-w-md mx-auto">
        <Button
          onClick={() => setShowAddCustomer(true)}
          className="w-full gap-2 h-14 text-base shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Agregar Cliente
        </Button>
      </div>

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <AddCustomerForm
          onSubmit={(name, phone) => {
            addCustomer(name, phone);
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
    </div>
  );
};

export default Index;
