import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ArrowLeft,
  Search,
  Receipt,
  Loader2,
  MoreVertical,
  Eye,
  CreditCard,
  Settings,
  MessageSquare,
  Ban,
  UserCheck,
  Filter,
  ArrowUpDown,
  Trash2,
} from 'lucide-react';
import { useAdminData, type AccountStatus } from '@/hooks/useAdminData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn, formatCOP, normalizePhoneToColombia, getDaysOverdue } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

const Admin = () => {
  const navigate = useNavigate();
  const { users, invoices, stats, loading, updateAccountStatus, registerPayment, updateMaintenancePrice, deleteUser } = useAdminData();
  
  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [sortBy, setSortBy] = useState('store_name');

  // Modal states
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [priceInput, setPriceInput] = useState('');
  const [showPriceDialog, setShowPriceDialog] = useState(false);

  const selectedUserInvoices = useMemo(() => 
    invoices.filter(i => i.user_id === selectedUserId),
  [invoices, selectedUserId]);

  const selectedUser = useMemo(() => 
    users.find(u => u.user_id === selectedUserId), 
  [users, selectedUserId]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Sin registro';
    return new Date(dateStr).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getUserStatusInfo = (user: any) => {
    if (!user) return { label: 'Sin datos', color: 'bg-gray-100 text-gray-400 border-gray-200' };
    
    const price = Number(user.maintenance_monthly_price_cop || 0);
    
    // 1. Si la cuenta está suspendida o inactiva, ese es el estado primordial
    if (['suspended', 'inactive', 'cancelled'].includes(user.account_status)) {
      return { label: 'Suspendido', color: 'bg-zinc-800/10 text-zinc-800 border-zinc-800/20' };
    }

    // 2. Si es gratis o tiene precio 0, NO puede estar vencido
    if (price === 0 || user.account_status === 'exonerated' || user.account_status === 'free') {
      return { label: 'Gratis', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
    }

    // 3. Verificar si está vencido (solo si el precio es > 0)
    const isOverdue = user.next_maintenance_due_at && 
                     getDaysOverdue(user.next_maintenance_due_at) > 0;

    if (isOverdue) {
      return { label: 'Vencido', color: 'bg-red-500/10 text-red-600 border-red-500/20' };
    }
    
    switch (user.account_status) {
      case 'active': return { label: 'Activo', color: 'bg-green-500/10 text-green-600 border-green-500/20' };
      case 'trial': return { label: 'Prueba', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' };
      case 'soon': return { label: 'Vence pronto', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
      case 'overdue': return { label: 'Vencido', color: 'bg-red-500/10 text-red-600 border-red-500/20' };
      case 'pending': return { label: 'Pendiente', color: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20' };
      default: return { label: 'Activo', color: 'bg-green-500/10 text-green-600 border-green-500/20' };
    }
  };

  const getInvoiceStatusInfo = (invoice: any) => {
    if (!invoice) return { label: 'Sin datos', color: 'bg-gray-100 text-gray-400 border-gray-200' };
    
    const amount = Number(invoice.amount_cop || 0);
    
    // Si el monto es 0 o está exonerado, es gratis
    if (amount === 0 || invoice.status === 'exonerated') {
      return { label: 'Gratis', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
    }
    
    switch (invoice.status) {
      case 'paid': return { label: 'Pagado', color: 'bg-green-500/10 text-green-600 border-green-500/20' };
      case 'open': return { label: 'Pendiente', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
      case 'overdue': return { label: 'Vencido', color: 'bg-red-500/10 text-red-600 border-red-500/20' };
      case 'inactive': return { label: 'Anulado', color: 'bg-gray-500/10 text-gray-600 border-gray-500/20' };
      default: return { label: 'Pendiente', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
    }
  };

  const getPeriodRange = (period_ym: string | null | undefined, due_at?: string) => {
    if (!period_ym) return { label: 'Periodo no registrado', start: '-', end: '-' };
    const parts = period_ym.split('-');
    if (parts.length < 2) return { label: period_ym, start: '-', end: '-' };

    const [year, month] = parts.map(Number);
    const date = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    
    const periodLabel = date.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
    
    return {
      label: periodLabel,
      start: new Date(year, month - 1, 1).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }),
      end: lastDay.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
    };
  };

  const handleCopyMessage = (user: any, invoice?: any) => {
    if (!user) return '';
    const status = getUserStatusInfo(user).label;
    const monto = formatCOP(invoice?.amount_cop ?? user.maintenance_monthly_price_cop ?? 0);
    const vencimiento = formatDate(invoice?.due_at ?? user.next_maintenance_due_at);
    
    const message = `Hola, ${user.display_name || 'tendero'}. Te recordamos que el mantenimiento de FIADO está ${status}.
Tienda: ${user.store_name || 'Tienda por registrar'}
Valor: ${monto}
Vencimiento: ${vencimiento}

Para seguir usando FIADO sin interrupciones, puedes realizar el pago hoy.
Gracias.`;

    navigator.clipboard.writeText(message);
    toast.success('Mensaje copiado al portapapeles');
    return message;
  };

  const handleWhatsApp = (user: any, invoice?: any) => {
    if (!user) return;
    const message = handleCopyMessage(user, invoice);
    const phone = normalizePhoneToColombia(user.phone);
    if (phone && phone.length >= 10) {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      toast.error('Número de teléfono inválido o no registrado');
    }
  };

  const filteredUsers = useMemo(() => {
    let result = users.filter(u => 
      (u.store_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.display_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (statusFilter !== 'all') {
      result = result.filter(u => {
        if (statusFilter === 'free') {
          return Number(u.maintenance_monthly_price_cop || 0) === 0;
        }
        return u.account_status === statusFilter;
      });
    }

    if (planFilter !== 'all') {
      result = result.filter(u => u.plan === planFilter);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'debt': return (b.total_debt || 0) - (a.total_debt || 0);
        case 'customers': return (b.total_customers || 0) - (a.total_customers || 0);
        case 'due': return new Date(a.next_maintenance_due_at || 0).getTime() - new Date(b.next_maintenance_due_at || 0).getTime();
        case 'access': return new Date(b.last_login || 0).getTime() - new Date(a.last_login || 0).getTime();
        default: return (a.store_name || '').localeCompare(b.store_name || '');
      }
    });

    return result;
  }, [users, searchTerm, statusFilter, planFilter, sortBy]);

  const currentPeriod = new Date().toISOString().slice(0, 7);
  const currentInvoices = invoices.filter(i => i.period_ym === currentPeriod);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-zinc-50/50 p-4 md:p-8">
        <div className="max-w-[1600px] mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => navigate('/')} className="rounded-xl shadow-sm">
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Volver al inicio</TooltipContent>
              </Tooltip>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Panel de Administración</h1>
                <p className="text-zinc-500">Gestión de tiendas, usuarios y cartera de mantenimiento</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-zinc-600">Sistema Operativo</span>
            </div>
          </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Comercios</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help"><AlertTriangle className="w-3 h-3 text-zinc-300" /></div>
                  </TooltipTrigger>
                  <TooltipContent>Total de tiendas registradas en FIADO</TooltipContent>
                </Tooltip>
              </div>
              <div className="p-2 bg-zinc-50 rounded-lg">
                <Users className="w-4 h-4 text-zinc-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-zinc-900">{stats.totalUsers}</div>
              <p className="text-[10px] text-zinc-400 mt-1 font-medium">Tiendas en el sistema</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden border-l-4 border-l-green-500">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Cuentas Activas</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help"><CheckCircle className="w-3 h-3 text-green-300" /></div>
                  </TooltipTrigger>
                  <TooltipContent>Tiendas con suscripción vigente o en prueba</TooltipContent>
                </Tooltip>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.activeUsers}</div>
              <p className="text-[10px] text-green-600/70 mt-1 font-medium">Suscripciones vigentes</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden border-l-4 border-l-red-500">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Mantenimientos Vencidos</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help"><XCircle className="w-3 h-3 text-red-300" /></div>
                  </TooltipTrigger>
                  <TooltipContent>Tiendas que deben el mantenimiento a FIADO</TooltipContent>
                </Tooltip>
              </div>
              <div className="p-2 bg-red-50 rounded-lg">
                <XCircle className="w-4 h-4 text-red-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.overdueUsers}</div>
              <p className="text-[10px] text-red-600/70 mt-1 font-medium">Pendientes de pago FIADO</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden border-l-4 border-l-amber-500">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Cartera de Mantenimientos</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help"><DollarSign className="w-3 h-3 text-amber-300" /></div>
                  </TooltipTrigger>
                  <TooltipContent>Dinero que las tiendas adeudan a FIADO por mantenimiento</TooltipContent>
                </Tooltip>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg">
                <DollarSign className="w-4 h-4 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{formatCOP(stats.maintenanceBalance)}</div>
              <p className="text-[10px] text-amber-600/70 mt-1 font-medium">Deuda acumulada de tiendas (Mantenimiento)</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Ingresos Proyectados (Mes)</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help"><AlertTriangle className="w-3 h-3 text-zinc-300" /></div>
                  </TooltipTrigger>
                  <TooltipContent>Total que debería recaudarse este mes en mantenimientos</TooltipContent>
                </Tooltip>
              </div>
              <div className="p-2 bg-zinc-50 rounded-lg">
                <Receipt className="w-4 h-4 text-zinc-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-900">{formatCOP(stats.expectedMonthlyIncome)}</div>
              <p className="text-[10px] text-zinc-400 mt-1 font-medium">Meta de recaudación</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-[10px] font-bold text-primary uppercase tracking-wider">Ingresos Recaudados (Mes)</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help"><CheckCircle className="w-3 h-3 text-primary/30" /></div>
                  </TooltipTrigger>
                  <TooltipContent>Mensualidades efectivamente cobradas este mes</TooltipContent>
                </Tooltip>
              </div>
              <div className="p-2 bg-primary/5 rounded-lg">
                <CreditCard className="w-4 h-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatCOP(stats.collectedMonthlyIncome)}</div>
              <div className="mt-3 h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-1000" 
                  style={{ width: `${Math.min((stats.collectedMonthlyIncome / (stats.expectedMonthlyIncome || 1)) * 100, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-zinc-900 rounded-2xl overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Cartera Total de Clientes</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help"><AlertTriangle className="w-3 h-3 text-zinc-600" /></div>
                  </TooltipTrigger>
                  <TooltipContent>Suma de lo que todos los clientes deben a las tiendas</TooltipContent>
                </Tooltip>
              </div>
              <div className="p-2 bg-white/10 rounded-lg">
                <Receipt className="w-4 h-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{formatCOP(stats.totalFiadoRegistered)}</div>
              <p className="text-[10px] text-zinc-500 mt-1 font-medium">Deuda de clientes hacia tiendas (No es deuda a FIADO)</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <TabsList className="bg-white border p-1 rounded-xl shadow-sm h-auto">
              <TabsTrigger value="users" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white transition-all gap-2">
                <Users className="w-4 h-4" />
                Tiendas
              </TabsTrigger>
              <TabsTrigger value="invoices" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white transition-all gap-2">
                <Receipt className="w-4 h-4" />
                Pagos del Mes
              </TabsTrigger>
            </TabsList>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  placeholder="Tienda, responsable, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-zinc-200 rounded-xl h-11 focus:ring-primary shadow-sm"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] bg-white rounded-xl h-11 border-zinc-200 shadow-sm">
                  <Filter className="w-4 h-4 mr-2 text-zinc-400" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="trial">Prueba</SelectItem>
                  <SelectItem value="overdue">Vencido</SelectItem>
                  <SelectItem value="suspended">Suspendido</SelectItem>
                  <SelectItem value="free">Gratis</SelectItem>
                  <SelectItem value="exonerated">Exonerado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-[160px] bg-white rounded-xl h-11 border-zinc-200 shadow-sm">
                  <Settings className="w-4 h-4 mr-2 text-zinc-400" />
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los planes</SelectItem>
                  <SelectItem value="Gratis">Gratis</SelectItem>
                  <SelectItem value="Tendero">Tendero</SelectItem>
                  <SelectItem value="Pro">Pro</SelectItem>
                  <SelectItem value="Plus">Plus</SelectItem>
                  <SelectItem value="Personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] bg-white rounded-xl h-11 border-zinc-200 shadow-sm">
                  <ArrowUpDown className="w-4 h-4 mr-2 text-zinc-400" />
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="store_name">Nombre de tienda</SelectItem>
                  <SelectItem value="debt">Más deuda fiada</SelectItem>
                  <SelectItem value="customers">Más clientes</SelectItem>
                  <SelectItem value="due">Próximo vencimiento</SelectItem>
                  <SelectItem value="access">Último acceso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="users" className="m-0">
            <Card className="border-none shadow-sm overflow-hidden bg-white rounded-2xl">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-zinc-50/50">
                    <TableRow className="hover:bg-transparent border-b">
                      <TableHead className="font-semibold text-zinc-900 py-4 min-w-[200px]">Tienda</TableHead>
                      <TableHead className="font-semibold text-zinc-900">Plan</TableHead>
                      <TableHead className="font-semibold text-zinc-900">Estado</TableHead>
                      <TableHead className="font-semibold text-zinc-900">
                        <div className="flex items-center gap-1">
                          Mensualidad
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertTriangle className="w-3 h-3 text-zinc-300 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>Mensualidad que la tienda paga a FIADO</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-zinc-900">Próximo Pago</TableHead>
                      <TableHead className="font-semibold text-zinc-900 text-right">Clientes</TableHead>
                      <TableHead className="font-semibold text-zinc-900 text-right">
                        <div className="flex items-center justify-end gap-1">
                          Cartera Tienda
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertTriangle className="w-3 h-3 text-zinc-300 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>Dinero que los clientes deben a esta tienda</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-zinc-900 text-right">Último Acceso</TableHead>
                      <TableHead className="font-semibold text-zinc-900 text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => {
                      const status = getUserStatusInfo(user);
                      // Only warn if store name is literally 'Mi Tienda' or empty
                      const isStoreGeneric = (user.store_name || '').toLowerCase() === 'mi tienda' || !user.store_name;
                      // Only mark as missing if we have absolutely no name
                      const isResponsableMissing = !user.display_name;
                      const isOverdue = user.next_maintenance_due_at && 
                                       user.maintenance_monthly_price_cop > 0 && 
                                       getDaysOverdue(user.next_maintenance_due_at) > 0;
                      
                      return (
                        <TableRow key={user.user_id} className="group hover:bg-zinc-50/50 transition-colors">
                          <TableCell className="py-4">
                            <div className="flex flex-col">
                              <span className={cn(
                                "font-semibold text-zinc-900 truncate max-w-[180px]",
                                isStoreGeneric && "text-amber-600/70 italic flex items-center gap-1"
                              )}>
                                {user.store_name || 'Tienda por registrar'}
                                {isStoreGeneric && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <AlertTriangle className="w-3 h-3 opacity-50 cursor-help shrink-0" />
                                    </TooltipTrigger>
                                    <TooltipContent>Nombre de tienda por defecto</TooltipContent>
                                  </Tooltip>
                                )}
                              </span>
                              <div className="flex flex-col mt-0.5">
                                <span className={cn(
                                  "text-xs font-medium truncate max-w-[180px]",
                                  isResponsableMissing ? "text-zinc-400 italic" : "text-zinc-500"
                                )}>
                                  {user.display_name || 'Responsable por registrar'}
                                </span>
                                <span className="text-[10px] text-zinc-400 truncate max-w-[180px]">{user.email || 'Sin email'}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="rounded-lg font-medium bg-zinc-50 text-zinc-600 border-zinc-200 whitespace-nowrap">
                              {user.plan || 'Gratis'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("rounded-lg border shadow-none font-medium whitespace-nowrap", status.color)}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-zinc-700 whitespace-nowrap">{formatCOP(user.maintenance_monthly_price_cop || 0)}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col min-w-[100px]">
                              <span className="text-sm font-medium text-zinc-700">{formatDate(user.next_maintenance_due_at)}</span>
                              {isOverdue && (
                                <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">
                                  {getDaysOverdue(user.next_maintenance_due_at!)} días vencido
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium text-zinc-700">{user.total_customers || 0}</TableCell>
                          <TableCell className="text-right font-semibold text-zinc-900 whitespace-nowrap">{formatCOP(user.total_debt || 0)}</TableCell>
                          <TableCell className="text-right text-xs text-zinc-500 min-w-[100px]">
                            {formatDate(user.last_login)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 px-2 rounded-lg text-zinc-600 border-zinc-200 hover:text-primary hover:border-primary/20 hover:bg-primary/5 gap-1.5"
                                    onClick={() => {
                                      setSelectedUserId(user.user_id);
                                      setShowDetailModal(true);
                                    }}
                                  >
                                    <Eye className="w-4 h-4" />
                                    <span className="hidden xl:inline">Detalles</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Ver detalles de la tienda</TooltipContent>
                              </Tooltip>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 px-2 rounded-lg text-zinc-600 hover:text-zinc-900 gap-1">
                                    <MoreVertical className="w-4 h-4" />
                                    <span className="hidden xl:inline">Acciones</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-zinc-200">
                                  <DropdownMenuLabel>Acciones Rápidas</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedUserId(user.user_id);
                                    setShowDetailModal(true);
                                  }}>
                                    <Eye className="w-4 h-4 mr-2 text-zinc-500" /> Ver perfil completo
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedUserId(user.user_id);
                                    setPriceInput((user.maintenance_monthly_price_cop || 0).toString());
                                    setShowPriceDialog(true);
                                  }}>
                                    <Settings className="w-4 h-4 mr-2 text-zinc-500" /> Ajustar plan / precio
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleWhatsApp(user)}>
                                    <MessageSquare className="w-4 h-4 mr-2 text-green-600" /> Enviar WhatsApp
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleCopyMessage(user)}>
                                    <Receipt className="w-4 h-4 mr-2 text-zinc-500" /> Copiar mensaje cobro
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {user.account_status !== 'suspended' ? (
                                    <DropdownMenuItem 
                                      className="text-amber-600 focus:text-amber-600 focus:bg-amber-50"
                                      onClick={() => updateAccountStatus(user.user_id, 'suspended')}
                                    >
                                      <Ban className="w-4 h-4 mr-2" /> Suspender acceso
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem 
                                      className="text-green-600 focus:text-green-600 focus:bg-green-50"
                                      onClick={() => updateAccountStatus(user.user_id, 'active')}
                                    >
                                      <UserCheck className="w-4 h-4 mr-2" /> Reactivar acceso
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                    onClick={() => deleteUser(user.user_id)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" /> Eliminar Tienda
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="m-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <h3 className="text-lg font-semibold text-zinc-900">
                Periodo: <span className="capitalize">{new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}</span>
              </h3>
              <Badge variant="outline" className="rounded-lg px-3 py-1 bg-white shadow-sm border-zinc-200">
                {currentInvoices.filter(i => i.status === 'paid').length} de {currentInvoices.length} recaudados
              </Badge>
            </div>

            <Card className="border-none shadow-sm overflow-hidden bg-white rounded-2xl">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-zinc-50/50">
                    <TableRow className="hover:bg-transparent border-b">
                      <TableHead className="font-semibold text-zinc-900 py-4 min-w-[180px]">Tienda</TableHead>
                      <TableHead className="font-semibold text-zinc-900">Plan</TableHead>
                      <TableHead className="font-semibold text-zinc-900">Valor Mantenimiento</TableHead>
                      <TableHead className="font-semibold text-zinc-900">Estado</TableHead>
                      <TableHead className="font-semibold text-zinc-900">Periodo</TableHead>
                      <TableHead className="font-semibold text-zinc-900">Vencimiento</TableHead>
                      <TableHead className="font-semibold text-zinc-900">Método</TableHead>
                      <TableHead className="font-semibold text-zinc-900 text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentInvoices.map((invoice) => {
                      const status = getInvoiceStatusInfo(invoice);
                      const user = users.find(u => u.user_id === invoice.user_id);
                      const period = getPeriodRange(invoice.period_ym, invoice.due_at);
                      const isOverdue = invoice.status === 'overdue' && Number(invoice.amount_cop || 0) > 0;
                      
                      return (
                        <TableRow key={invoice.id} className="hover:bg-zinc-50/50 transition-colors">
                          <TableCell className="py-4">
                            <span className="font-semibold text-zinc-900">{invoice.store_name || 'Tienda por registrar'}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="rounded-lg font-medium bg-zinc-50 text-zinc-600 border-zinc-200">
                              {invoice.plan || 'Gratis'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-zinc-900">{formatCOP(invoice.amount_cop || 0)}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge className={cn("rounded-lg border shadow-none font-medium w-fit", status.color)}>
                                {status.label}
                              </Badge>
                              {invoice.status === 'paid' && invoice.paid_at && (
                                <span className="text-[10px] text-zinc-400">Pagado el {formatDate(invoice.paid_at)}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-zinc-700 capitalize">{period.label}</span>
                              <span className="text-[10px] text-zinc-400">{period.start} - {period.end}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-zinc-700">{formatDate(invoice.due_at)}</span>
                              {isOverdue && (
                                <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">
                                  {getDaysOverdue(invoice.due_at)} días vencido
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-zinc-500">
                            {invoice.method || (invoice.status === 'paid' ? 'No registrado' : '-')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {invoice.status !== 'paid' && Number(invoice.amount_cop || 0) > 0 && (
                                <Button
                                  size="sm"
                                  onClick={() => registerPayment(invoice.id)}
                                  className="h-9 rounded-xl bg-primary hover:bg-primary/90 shadow-sm px-4"
                                >
                                  Pagar
                                </Button>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-9 px-2 rounded-xl text-zinc-600 gap-1">
                                    <MoreVertical className="w-4 h-4" />
                                    <span className="hidden xl:inline">Acciones</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 rounded-xl">
                                  <DropdownMenuItem onClick={() => user && handleWhatsApp(user, invoice)}>
                                    <MessageSquare className="w-4 h-4 mr-2 text-green-600" /> WhatsApp Cobro
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => user && handleCopyMessage(user, invoice)}>
                                    <Receipt className="w-4 h-4 mr-2" /> Copiar Mensaje
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {currentInvoices.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-zinc-400 py-12">
                          No hay facturas generadas para el periodo actual
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Store Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          {selectedUser && (
            <div className="flex flex-col">
              <div className="bg-primary p-8 text-white relative">
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <h2 className="text-3xl font-bold truncate">
                      {selectedUser.store_name || 'Tienda por registrar'}
                    </h2>
                    <p className="text-primary-foreground/80 mt-1 truncate">
                      {selectedUser.display_name || (selectedUser.email !== 'Email no disponible' ? selectedUser.email.split('@')[0] : 'Responsable no registrado')}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-white/20 border-white/30 text-white rounded-lg px-3 py-1 shrink-0">
                    {getUserStatusInfo(selectedUser).label}
                  </Badge>
                </div>
              </div>
              
              <ScrollArea className="max-h-[80vh] sm:max-h-[70vh]">
                <div className="p-4 sm:p-8 space-y-8">
                  {/* Alerta de datos incompletos */}
                  {(!selectedUser.phone || !selectedUser.store_name) && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-amber-800">Información Pendiente</p>
                        <p className="text-xs text-amber-700">
                          {!selectedUser.phone && "• Falta el número de WhatsApp para contacto.\n"}
                          {!selectedUser.store_name && "• El nombre de la tienda no ha sido configurado."}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <Label className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold">Email de Registro</Label>
                        <p className="text-zinc-900 font-medium break-all">{selectedUser.email || 'Sin email'}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold">Número de WhatsApp</Label>
                        <p className={cn(
                          "text-zinc-900 font-medium",
                          !selectedUser.phone && "text-zinc-400 italic"
                        )}>
                          {selectedUser.phone || 'No registrado'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold">Último Acceso al Sistema</Label>
                        <p className="text-zinc-900 font-medium">{formatDate(selectedUser.last_login)}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <Label className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold">Mantenimiento Mensual (FIADO)</Label>
                        <p className="text-2xl font-bold text-primary">{formatCOP(selectedUser.maintenance_monthly_price_cop || 0)}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold">Plan de Suscripción</Label>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 rounded-lg">
                            {selectedUser.plan || 'Gratis'}
                          </Badge>
                          {selectedUser.maintenance_monthly_price_cop === 0 && (
                            <span className="text-[10px] text-zinc-400 font-medium">Uso gratuito</span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-zinc-400 text-[10px] uppercase tracking-wider font-bold">Próximo Vencimiento</Label>
                        <p className="text-zinc-900 font-medium">{formatDate(selectedUser.next_maintenance_due_at)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                    <div className="text-center border-r border-zinc-200">
                      <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-tight">Clientes Registrados</p>
                      <p className="text-2xl font-bold text-zinc-900">{selectedUser.total_customers || 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-tight">Cartera de la Tienda</p>
                      <p className="text-2xl font-bold text-zinc-900">{formatCOP(selectedUser.total_debt || 0)}</p>
                      <p className="text-[10px] text-zinc-400 mt-1">Total fiado por la tienda</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Historial de Pagos de Mantenimiento
                      </h3>
                      <Badge variant="ghost" className="text-[10px] text-zinc-400">Últimos 5</Badge>
                    </div>
                    <div className="border rounded-2xl overflow-hidden bg-white">
                      <Table>
                        <TableBody>
                          {selectedUserInvoices.slice(0, 5).map(inv => (
                            <TableRow key={inv.id} className="hover:bg-transparent">
                              <TableCell className="text-xs font-medium py-3">{getPeriodRange(inv.period_ym).label}</TableCell>
                              <TableCell className="text-xs py-3 font-semibold">{formatCOP(inv.amount_cop || 0)}</TableCell>
                              <TableCell className="text-right py-3">
                                <div className="flex items-center justify-end gap-2">
                                  <Badge className={cn("text-[10px] px-2 py-0 h-5 border shadow-none font-medium", getInvoiceStatusInfo(inv).color)}>
                                    {getInvoiceStatusInfo(inv).label}
                                  </Badge>
                                  {inv.status !== 'paid' && Number(inv.amount_cop || 0) > 0 && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0 rounded-full hover:bg-green-50 hover:text-green-600"
                                      onClick={() => registerPayment(inv.id)}
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          {selectedUserInvoices.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center text-xs text-zinc-400 py-8">No se han registrado pagos aún</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Acciones de Administración
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button 
                        variant="outline" 
                        className="justify-start h-12 rounded-xl border-zinc-200 hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-all" 
                        onClick={() => handleWhatsApp(selectedUser)}
                      >
                        <MessageSquare className="w-4 h-4 mr-2 text-green-600" /> 
                        <div className="flex flex-col items-start">
                          <span className="text-xs font-bold">Enviar WhatsApp</span>
                          <span className="text-[10px] opacity-70">Contactar al tendero</span>
                        </div>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="justify-start h-12 rounded-xl border-zinc-200 hover:bg-zinc-50 transition-all" 
                        onClick={() => handleCopyMessage(selectedUser)}
                      >
                        <Receipt className="w-4 h-4 mr-2 text-zinc-500" /> 
                        <div className="flex flex-col items-start">
                          <span className="text-xs font-bold">Copiar Mensaje</span>
                          <span className="text-[10px] opacity-70">Texto de cobro mensual</span>
                        </div>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="justify-start h-12 rounded-xl border-zinc-200 hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-all" 
                        onClick={() => {
                          setPriceInput((selectedUser.maintenance_monthly_price_cop || 0).toString());
                          setShowPriceDialog(true);
                        }}
                      >
                        <Settings className="w-4 h-4 mr-2 text-zinc-500" /> 
                        <div className="flex flex-col items-start">
                          <span className="text-xs font-bold">Cambiar Plan</span>
                          <span className="text-[10px] opacity-70">Ajustar valor mensual</span>
                        </div>
                      </Button>
                      {selectedUser.account_status !== 'suspended' && selectedUser.account_status !== 'inactive' ? (
                        <Button 
                          variant="outline" 
                          className="justify-start h-12 rounded-xl border-zinc-200 text-amber-600 hover:text-amber-700 hover:bg-amber-50 hover:border-amber-200 transition-all" 
                          onClick={() => updateAccountStatus(selectedUser.user_id, 'suspended')}
                        >
                          <Ban className="w-4 h-4 mr-2" /> 
                          <div className="flex flex-col items-start">
                            <span className="text-xs font-bold">Suspender Acceso</span>
                            <span className="text-[10px] opacity-70">Desactivar cuenta</span>
                          </div>
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          className="justify-start h-12 rounded-xl border-zinc-200 text-green-600 hover:text-green-700 hover:bg-green-50 hover:border-green-200 transition-all" 
                          onClick={() => updateAccountStatus(selectedUser.user_id, 'active')}
                        >
                          <UserCheck className="w-4 h-4 mr-2" /> 
                          <div className="flex flex-col items-start">
                            <span className="text-xs font-bold">Reactivar Acceso</span>
                            <span className="text-[10px] opacity-70">Activar cuenta</span>
                          </div>
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        className="justify-start h-12 rounded-xl border-zinc-200 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200 transition-all col-span-1 sm:col-span-2" 
                        onClick={() => {
                          deleteUser(selectedUser.user_id);
                          setShowDetailModal(false);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> 
                        <div className="flex flex-col items-start">
                          <span className="text-xs font-bold text-red-600">Eliminar Permanentemente</span>
                          <span className="text-[10px] opacity-70">Borrar todos los datos de esta tienda</span>
                        </div>
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>
              
              <div className="p-6 bg-zinc-50 border-t flex justify-end">
                <Button onClick={() => setShowDetailModal(false)} className="rounded-xl px-8">Cerrar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Price Dialog */}
      <Dialog open={showPriceDialog} onOpenChange={setShowPriceDialog}>
        <DialogContent className="rounded-3xl shadow-2xl border-none">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Ajustar Plan / Precio</DialogTitle>
            <DialogDescription className="text-zinc-500">
              Establece el valor mensual que esta tienda debe pagar a FIADO.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <Label className="font-bold text-zinc-700">Seleccionar Plan Predefinido</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'Gratis', price: 0 },
                  { name: 'Tendero', price: 14900 },
                  { name: 'Pro', price: 29900 },
                  { name: 'Plus', price: 49900 },
                ].map((plan) => (
                  <Button
                    key={plan.name}
                    variant="outline"
                    className={cn(
                      "h-12 rounded-xl justify-start px-4",
                      parseInt(priceInput) === plan.price && "border-primary bg-primary/5 text-primary"
                    )}
                    onClick={() => setPriceInput(plan.price.toString())}
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-xs font-bold">{plan.name}</span>
                      <span className="text-[10px] opacity-70">{formatCOP(plan.price)}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price" className="font-bold text-zinc-700">Precio Personalizado (COP)</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                <Input
                  id="price"
                  type="number"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  placeholder="14900"
                  className="pl-8 h-12 bg-zinc-50 border-zinc-200 rounded-xl focus:ring-primary text-lg font-semibold"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setShowPriceDialog(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={() => {
              if (selectedUserId && priceInput) {
                updateMaintenancePrice(selectedUserId, parseInt(priceInput));
                setShowPriceDialog(false);
                setPriceInput('');
              }
            }} className="rounded-xl px-8 shadow-lg shadow-primary/20">
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
};

export default Admin;
