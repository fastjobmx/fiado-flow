export type PlanType = 'free' | 'pro' | 'plus';

export interface PlanLimits {
  maxCustomers: number | null; // null = ilimitado
  maxTransactions: number | null;
  hasAdvancedReports: boolean;
  hasExports: boolean;
  hasMultiuser: boolean;
  hasWhatsAppReminders: boolean;
  hasPrioritySupport: boolean;
}

export interface Plan {
  id: PlanType;
  name: string;
  price: number;
  priceFormatted: string;
  period: string;
  description: string;
  isRecommended?: boolean;
  features: string[];
  notIncluded?: string[];
  limits: PlanLimits;
}

export interface Subscription {
  plan: PlanType;
  status: 'active' | 'trialing' | 'past_due' | 'cancelled';
  currentPeriodEnd?: Date;
  trialEndsAt?: Date;
  customerCount: number;
  transactionCount: number;
}

export const PLANS: Record<PlanType, Plan> = {
  free: {
    id: 'free',
    name: 'Gratis',
    price: 0,
    priceFormatted: '$0',
    period: '/mes',
    description: 'Para empezar a organizar tus fiados',
    features: [
      'Hasta 20 clientes',
      'Hasta 50 movimientos',
      'Registro de fiados y abonos',
      'Historial básico',
      'Backup en la nube',
    ],
    notIncluded: [
      'Reportes avanzados',
      'Exportaciones',
      'Multiusuario',
    ],
    limits: {
      maxCustomers: 20,
      maxTransactions: 50,
      hasAdvancedReports: false,
      hasExports: false,
      hasMultiuser: false,
      hasWhatsAppReminders: true, // Gratis tiene WhatsApp básico
      hasPrioritySupport: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 19900,
    priceFormatted: '$19.900',
    period: 'COP/mes',
    description: 'Para tiendas activas que quieren crecer',
    isRecommended: true,
    features: [
      'Clientes ilimitados',
      'Movimientos ilimitados',
      'Reportes básicos',
      'Recordatorios por WhatsApp',
      'Backup en la nube',
      'Soporte por email',
    ],
    notIncluded: [
      'Multiusuario',
      'Exportar Excel/PDF',
      'Reportes avanzados',
    ],
    limits: {
      maxCustomers: null,
      maxTransactions: null,
      hasAdvancedReports: false,
      hasExports: false,
      hasMultiuser: false,
      hasWhatsAppReminders: true,
      hasPrioritySupport: false,
    },
  },
  plus: {
    id: 'plus',
    name: 'Plus',
    price: 39900,
    priceFormatted: '$39.900',
    period: 'COP/mes',
    description: 'Para negocios que necesitan más poder',
    features: [
      'Todo lo del plan Pro',
      'Multiusuario (hasta 3)',
      'Exportar Excel y PDF',
      'Reportes avanzados',
      'Soporte prioritario',
      'Personalización de marca',
    ],
    limits: {
      maxCustomers: null,
      maxTransactions: null,
      hasAdvancedReports: true,
      hasExports: true,
      hasMultiuser: true,
      hasWhatsAppReminders: true,
      hasPrioritySupport: true,
    },
  },
};

export function getPlanById(id: PlanType): Plan {
  return PLANS[id];
}

export function checkLimit(current: number, limit: number | null): boolean {
  if (limit === null) return true;
  return current < limit;
}

export function getLimitMessage(type: 'customers' | 'transactions', current: number, limit: number): string {
  const remaining = limit - current;
  if (type === 'customers') {
    return remaining === 1 
      ? 'Te queda 1 cliente en el plan gratis' 
      : `Te quedan ${remaining} clientes en el plan gratis`;
  }
  return remaining === 1
    ? 'Te queda 1 movimiento en el plan gratis'
    : `Te quedan ${remaining} movimientos en el plan gratis`;
}
