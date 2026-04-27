import { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { 
  Store, 
  Mail, 
  Lock, 
  Loader2, 
  User, 
  ArrowLeft, 
  Check,
  Smartphone,
  Shield,
  Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';

const BENEFIT_ITEM = ({ icon: Icon, text }: { icon: typeof Check; text: string }) => (
  <div className="flex items-center gap-3 text-sm text-zinc-600">
    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
      <Icon className="w-3.5 h-3.5 text-primary" />
    </div>
    <span>{text}</span>
  </div>
);

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, signUp, signInWithGoogle, signInWithMagicLink } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/app" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLogin && !displayName.trim()) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa tu nombre',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive',
          });
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          // Update profile with display name after signup
          setTimeout(async () => {
            const { data: { user: newUser } } = await supabase.auth.getUser();
            if (newUser) {
              await supabase
                .from('profiles')
                .update({ display_name: displayName.trim() })
                .eq('user_id', newUser.id);
            }
          }, 1000);
          
          toast({
            title: '¡Cuenta creada!',
            description: 'Tu cuenta ha sido activada con 15 días de prueba gratuita.',
          });
          setIsLogin(true);
          setDisplayName('');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        console.error('[Auth] Error en handleGoogleSignIn:', error);
        toast({
          title: 'Error al iniciar con Google',
          description: error.message || 'Verifica la configuración de autenticación en Supabase',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('[Auth] Excepción en handleGoogleSignIn:', err);
      toast({
        title: 'Error inesperado',
        description: 'No se pudo conectar con Google. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      toast({
        title: 'Correo requerido',
        description: 'Por favor ingresa tu correo electrónico para enviarte el enlace.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await signInWithMagicLink(email);
      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Enlace enviado',
          description: 'Revisa tu bandeja de entrada para iniciar sesión.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-xl text-zinc-900">FIADO</span>
          </Link>
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex">
        {/* Left side - Benefits (hidden on mobile) */}
        <div className="hidden lg:flex flex-1 bg-zinc-900 text-white items-center justify-center p-12">
          <div className="max-w-md">
            <h2 className="text-3xl font-black mb-6">
              {isLogin ? 'Bienvenido de vuelta' : 'Empieza a organizar tus fiados'}
            </h2>
            <p className="text-zinc-400 mb-8">
              {isLogin 
                ? 'Inicia sesión para seguir controlando tus cuentas por cobrar.'
                : 'Crea tu cuenta gratis y descubre cómo recuperar el dinero que te deben.'}
            </p>
            
            <div className="space-y-4">
              <BENEFIT_ITEM icon={Check} text="Hasta 20 clientes gratis" />
              <BENEFIT_ITEM icon={Smartphone} text="Funciona en tu celular" />
              <BENEFIT_ITEM icon={Shield} text="Tus datos están seguros en la nube" />
              <BENEFIT_ITEM icon={Clock} text="Envía recordatorios por WhatsApp" />
            </div>

            <div className="mt-8 p-4 bg-white/10 rounded-2xl">
              <p className="text-sm text-zinc-300 italic">
                "Con FIADO recuperé el control de mis fiados. Ahora sé exactamente quién me debe y cuánto."
              </p>
              <p className="text-sm font-medium mt-2">— María, tendera en Bogotá</p>
            </div>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md space-y-6">
            {/* Mobile header */}
            <div className="lg:hidden text-center mb-6">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Store className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-black text-zinc-900">
                {isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
              </h1>
              <p className="text-zinc-500 mt-2">
                {isLogin 
                  ? 'Ingresa para seguir controlando tus fiados'
                  : 'Empieza gratis, no necesitas tarjeta'}
              </p>
            </div>

            {/* Desktop header */}
            <div className="hidden lg:block text-center mb-8">
              <h1 className="text-2xl font-black text-zinc-900">
                {isLogin ? 'Iniciar sesión' : 'Crear cuenta gratuita'}
              </h1>
              <p className="text-zinc-500 mt-2">
                {isLogin 
                  ? 'Ingresa tus datos para continuar'
                  : 'Prueba gratis por 15 días, luego $19.900/mes'}
              </p>
            </div>

            {/* Google Sign In */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-14 text-base rounded-2xl border-2"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuar con Google
            </Button>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-zinc-400 uppercase">o</span>
              <Separator className="flex-1" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-sm font-medium">
                    Nombre completo
                  </Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="Ej: María García"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="pl-12 h-14 rounded-2xl border-2"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Correo electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-14 rounded-2xl border-2"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 h-14 rounded-2xl border-2"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 rounded-2xl font-bold text-base mt-2"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                {isLogin ? 'Iniciar sesión' : 'Crear cuenta gratis'}
              </Button>

              {isLogin && (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-sm text-zinc-500 hover:text-zinc-900"
                  onClick={handleMagicLink}
                  disabled={isSubmitting}
                >
                  ¿Olvidaste tu contraseña? Enviar enlace mágico
                </Button>
              )}
            </form>

            {/* Toggle */}
            <div className="text-center pt-4 border-t border-zinc-200">
              <p className="text-sm text-zinc-600">
                {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="font-bold text-primary hover:underline"
                >
                  {isLogin ? 'Crea una gratis' : 'Inicia sesión'}
                </button>
              </p>
            </div>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-6 pt-4 text-xs text-zinc-400">
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                Seguro
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Gratis 15 días
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
