import { useState } from 'react';
import { 
  Store, 
  Users, 
  Receipt, 
  MessageCircle, 
  TrendingUp, 
  Shield, 
  Check, 
  ArrowRight,
  BookOpen,
  Smartphone,
  Clock,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  Calculator
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const FAQ_ITEM = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border-b border-zinc-200 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-center justify-between text-left"
      >
        <span className="font-bold text-zinc-900 pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-zinc-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-zinc-500 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="pb-5 text-zinc-600 leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
};

const FEATURE_CARD = ({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: typeof Store; 
  title: string; 
  description: string;
}) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100 hover:shadow-md transition-shadow">
    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
      <Icon className="w-6 h-6 text-primary" />
    </div>
    <h3 className="font-bold text-zinc-900 mb-2">{title}</h3>
    <p className="text-sm text-zinc-600 leading-relaxed">{description}</p>
  </div>
);

const PRICING_CARD = ({ 
  name, 
  price, 
  period,
  description,
  features,
  isPopular = false,
  ctaText,
  onCtaClick
}: {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  ctaText: string;
  onCtaClick: () => void;
}) => (
  <div className={`relative rounded-3xl p-6 ${isPopular ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-200'}`}>
    {isPopular && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
        <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
          Más popular
        </span>
      </div>
    )}
    
    <div className="mb-6">
      <h3 className={`font-bold text-lg mb-1 ${isPopular ? 'text-white' : 'text-zinc-900'}`}>
        {name}
      </h3>
      <p className={`text-sm ${isPopular ? 'text-zinc-400' : 'text-zinc-500'}`}>
        {description}
      </p>
    </div>
    
    <div className="mb-6">
      <span className={`text-4xl font-black ${isPopular ? 'text-white' : 'text-zinc-900'}`}>
        {price}
      </span>
      <span className={`text-sm ${isPopular ? 'text-zinc-400' : 'text-zinc-500'}`}>
        {period}
      </span>
    </div>
    
    <ul className="space-y-3 mb-6">
      {features.map((feature, i) => (
        <li key={i} className="flex items-start gap-3">
          <Check className={`w-5 h-5 flex-shrink-0 ${isPopular ? 'text-primary' : 'text-green-500'}`} />
          <span className={`text-sm ${isPopular ? 'text-zinc-300' : 'text-zinc-600'}`}>
            {feature}
          </span>
        </li>
      ))}
    </ul>
    
    <Button
      onClick={onCtaClick}
      className={`w-full h-14 rounded-2xl font-bold text-base ${
        isPopular 
          ? 'bg-primary hover:bg-primary/90 text-white' 
          : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900'
      }`}
    >
      {ctaText}
    </Button>
  </div>
);

export const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Si ya está logueado, ir al dashboard
  if (user) {
    return <Navigate to="/app" replace />;
  }

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const openWhatsApp = () => {
    const message = encodeURIComponent(
      '¡Hola! Vengo de la página de FIADO y quiero más información para mi tienda. 🏪'
    );
    window.open(`https://wa.me/573001234567?text=${message}`, '_blank');
  };

  const faqs = [
    {
      question: '¿Necesito tarjeta de crédito para probar?',
      answer: 'No. La versión gratuita es gratis para siempre. Solo necesitas tu celular y correo para empezar. Cuando quieras más clientes, puedes pasar al plan Pro.'
    },
    {
      question: '¿Mis clientes reciben notificaciones automáticas?',
      answer: 'No automáticamente. Tú decides cuándo enviar recordatorios por WhatsApp con un solo toque. Tus clientes no necesitan instalar nada.'
    },
    {
      question: '¿Puedo usarlo en mi computador?',
      answer: 'Sí, FIADO funciona en cualquier dispositivo con internet: celular, tablet o computador. Tus datos se guardan en la nube y están disponibles donde sea.'
    },
    {
      question: '¿Qué pasa si pierdo mi celular?',
      answer: 'Tus datos están seguros en la nube. Solo inicia sesión desde otro celular y tendrás toda tu información. Nada se guarda solo en tu dispositivo.'
    },
    {
      question: '¿Puedo cancelar en cualquier momento?',
      answer: 'Sí, no hay contratos de permanencia. Puedes cancelar tu plan Pro cuando quieras y volver al plan gratuito o gratis por siempre.'
    },
    {
      question: '¿Cómo cobro a mis clientes?',
      answer: 'FIADO te ayuda a organizar y recordar quién debe, pero los pagos los recibes tú directamente en efectivo, Nequi, Daviplata o como prefieras.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md z-50 border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-xl text-zinc-900">FIADO</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('funciones')} className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
              Funciones
            </button>
            <button onClick={() => scrollToSection('precios')} className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
              Precios
            </button>
            <button onClick={() => scrollToSection('faq')} className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
              Preguntas
            </button>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/auth')}
              className="font-medium"
            >
              Iniciar sesión
            </Button>
            <Button 
              onClick={() => navigate('/auth')}
              className="bg-primary hover:bg-primary/90"
            >
              Probar gratis
            </Button>
          </div>

          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-100 bg-white">
            <div className="px-4 py-4 space-y-3">
              <button onClick={() => scrollToSection('funciones')} className="block w-full text-left py-2 font-medium text-zinc-600">
                Funciones
              </button>
              <button onClick={() => scrollToSection('precios')} className="block w-full text-left py-2 font-medium text-zinc-600">
                Precios
              </button>
              <button onClick={() => scrollToSection('faq')} className="block w-full text-left py-2 font-medium text-zinc-600">
                Preguntas
              </button>
              <hr className="border-zinc-100" />
              <Button 
                variant="ghost" 
                onClick={() => navigate('/auth')}
                className="w-full justify-start"
              >
                Iniciar sesión
              </Button>
              <Button 
                onClick={() => navigate('/auth')}
                className="w-full bg-primary hover:bg-primary/90"
              >
                Probar gratis
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600"></span>
            </span>
            Creado para tenderos de Colombia
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black text-zinc-900 mb-6 leading-tight">
            No pierdas más plata por{' '}
            <span className="text-primary">fiados olvidados</span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Controla deudas, abonos y clientes desde tu celular. 
            Envía recordatorios por WhatsApp y sabe quién te debe, 
            cuánto y desde cuándo.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => navigate('/auth')}
              className="h-16 px-8 text-lg font-bold bg-primary hover:bg-primary/90 rounded-2xl shadow-lg shadow-primary/25"
            >
              <Smartphone className="w-5 h-5 mr-2" />
              Probar gratis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={openWhatsApp}
              className="h-16 px-8 text-lg font-bold border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10 rounded-2xl"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Hablar por WhatsApp
            </Button>
          </div>
          
          <p className="text-sm text-zinc-500 mt-4">
            Versión gratuita disponible • No necesitas tarjeta de crédito
          </p>
        </div>
      </section>

      {/* Problema Section */}
      <section className="py-20 px-4 bg-zinc-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-zinc-900 mb-4">
              ¿Te pasa esto en tu tienda? 🤔
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="font-bold text-zinc-900 mb-2">El cuaderno se pierde</h3>
              <p className="text-sm text-zinc-600">
                O se moja, o lo dejas en casa, o no encuentras la página del cliente...
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="font-bold text-zinc-900 mb-2">Se te olvida cobrar</h3>
              <p className="text-sm text-zinc-600">
                Pasan días y no sabes quién ya debía haber pagado. La deuda se acumula sin control.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calculator className="w-8 h-8 text-purple-500" />
              </div>
              <h3 className="font-bold text-zinc-900 mb-2">No sabes cuánto te deben</h3>
              <p className="text-sm text-zinc-600">
                Entre fiados y abonos, pierdes la cuenta de cuál es el saldo real de cada cliente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solución Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-black text-zinc-900 mb-4">
            FIADO organiza tus cuentas por cobrar
          </h2>
          <p className="text-lg text-zinc-600">
            En segundos, desde tu celular, con la confianza de tener todo en la nube.
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6" id="funciones">
          <FEATURE_CARD
            icon={Users}
            title="Clientes organizados"
            description="Registra nombre, teléfono y apodo. Encuentra rápido a cualquier cliente."
          />
          <FEATURE_CARD
            icon={Receipt}
            title="Fiados y abonos"
            description="Registra deudas en un toque. Descuenta abonos y el saldo se calcula solo."
          />
          <FEATURE_CARD
            icon={TrendingUp}
            title="Historial completo"
            description="Ve todo lo que compró y pagó cada cliente. Fechas, montos y detalles."
          />
          <FEATURE_CARD
            icon={MessageCircle}
            title="Cobro por WhatsApp"
            description="Envía recordatorios con el saldo actual con un solo botón."
          />
          <FEATURE_CARD
            icon={AlertCircle}
            title="Alertas de deudas viejas"
            description="Sabe quién debe desde hace mucho tiempo. No dejes que se te pase."
          />
          <FEATURE_CARD
            icon={Shield}
            title="Seguro en la nube"
            description="Tu información se guarda online. No se pierde ni con un celular nuevo."
          />
        </div>
      </section>

      {/* Precios Section */}
      <section className="py-20 px-4 bg-zinc-50" id="precios">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-black text-zinc-900 mb-4">
            Precios claros, en pesos colombianos
          </h2>
          <p className="text-lg text-zinc-600">
            Empieza gratis. Crece cuando necesites. Sin sorpresas.
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          <PRICING_CARD
            name="Gratis"
            price="$0"
            period="/mes"
            description="Para empezar y probar"
            features={[
              'Hasta 20 clientes',
              'Deudas y abonos ilimitados',
              'Historial completo',
              'Recordatorios WhatsApp',
              'Soporte por email'
            ]}
            ctaText="Empezar gratis"
            onCtaClick={() => navigate('/auth')}
          />
          
          <PRICING_CARD
            name="Pro"
            price="$19.900"
            period="COP/mes"
            description="Para tiendas activas"
            features={[
              'Clientes ilimitados',
              'Deudas y abonos ilimitados',
              'Historial y reportes básicos',
              'Recordatorios WhatsApp',
              'Exportar a Excel',
              'Soporte prioritario'
            ]}
            isPopular
            ctaText="Elegir Pro"
            onCtaClick={() => navigate('/auth')}
          />
          
          <PRICING_CARD
            name="Plus"
            price="$39.900"
            period="COP/mes"
            description="Para negocios que crecen"
            features={[
              'Todo del plan Pro',
              'Reportes avanzados',
              'Exportar Excel y PDF',
              'Multiusuario (hasta 3)',
              'Personalización de marca',
              'Soporte telefónico'
            ]}
            ctaText="Elegir Plus"
            onCtaClick={openWhatsApp}
          />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4" id="faq">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-zinc-900 mb-4">
              Preguntas frecuentes
            </h2>
          </div>
          
          <div className="bg-white rounded-2xl border border-zinc-200 px-6">
            {faqs.map((faq, i) => (
              <FAQ_ITEM key={i} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 bg-zinc-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Empieza a controlar tus fiados hoy
          </h2>
          <p className="text-lg text-zinc-400 mb-8">
            Es gratis probar. No necesitas tarjeta de crédito.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => navigate('/auth')}
              className="h-16 px-8 text-lg font-bold bg-primary hover:bg-primary/90 rounded-2xl"
            >
              <Smartphone className="w-5 h-5 mr-2" />
              Crear cuenta gratis
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={openWhatsApp}
              className="h-16 px-8 text-lg font-bold border-2 border-white text-white hover:bg-white/10 rounded-2xl"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Hablar por WhatsApp
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-zinc-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Store className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-zinc-900">FIADO</span>
            </div>
            
            <p className="text-sm text-zinc-500 text-center">
              © 2025 FIADO. Hecho para tenderos colombianos. 🇨🇴
            </p>
            
            <div className="flex items-center gap-4">
              <button onClick={openWhatsApp} className="text-sm text-zinc-600 hover:text-zinc-900">
                Contacto
              </button>
              <button 
                onClick={() => navigate('/auth')} 
                className="text-sm text-zinc-600 hover:text-zinc-900"
              >
                Iniciar sesión
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
