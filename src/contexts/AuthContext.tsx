import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface GeoLocation {
  country: string;
  city: string;
  region?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Detectar usuarios nuevos y enviar información de registro
  useEffect(() => {
    if (user) {
      // Verificar si el usuario fue creado recientemente (últimos 5 minutos)
      const createdAt = new Date(user.created_at);
      const now = new Date();
      const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
      
      if (diffMinutes < 5) {
        // Usuario recién creado, enviar información de IP
        setTimeout(() => {
          sendRegistrationInfo();
        }, 3000);
      }
    }
  }, [user]);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    
    // Si el registro fue exitoso, enviar información de IP
    if (data?.user && !error) {
      // Esperar un momento para que se cree el perfil
      setTimeout(() => {
        sendRegistrationInfo();
      }, 2000);
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    try {
      console.log('[Auth] Iniciando login con Google...');
      console.log('[Auth] Redirect URL:', window.location.origin);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      if (error) {
        console.error('[Auth] Error en signInWithGoogle:', error);
        return { error };
      }
      
      console.log('[Auth] URL de autorización:', data?.url);
      return { error: null };
    } catch (err) {
      console.error('[Auth] Excepción en signInWithGoogle:', err);
      return { error: err as Error };
    }
  };

  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    return { error };
  };

  // Función para capturar y enviar IP y ubicación del usuario
  const sendRegistrationInfo = async () => {
    try {
      // Obtener IP pública
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      const ipAddress = ipData.ip;

      // Obtener geolocalización aproximada desde la IP
      let country = 'Desconocido';
      let city = 'Desconocido';
      try {
        const geoResponse = await fetch(`https://ipapi.co/${ipAddress}/json/`);
        const geoData = await geoResponse.json();
        country = geoData.country_name || geoData.country || 'Desconocido';
        city = geoData.city || 'Desconocido';
      } catch (geoError) {
        console.log('[Auth] No se pudo obtener geolocalización:', geoError);
      }

      // Enviar a Supabase
      const { error } = await supabase.rpc('update_registration_ip', {
        p_ip_address: ipAddress,
        p_country: country,
        p_city: city,
      });

      if (error) {
        console.error('[Auth] Error enviando información de registro:', error);
      } else {
        console.log('[Auth] Información de registro enviada:', { ip: ipAddress, country, city });
      }

      // Enviar notificación al admin (puedes integrar con WhatsApp, Telegram, Email)
      await sendAdminNotification(ipAddress, country, city);

    } catch (error) {
      console.error('[Auth] Error capturando información:', error);
    }
  };

  // Enviar notificación al administrador
  const sendAdminNotification = async (ip: string, country: string, city: string) => {
    try {
      const userEmail = user?.email || 'N/A';
      const userId = user?.id || 'N/A';
      const timestamp = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });

      // Mensaje para WhatsApp o log
      const message = `🆕 Nuevo registro en Fiado Friendly\n\n📧 Email: ${userEmail}\n🆔 ID: ${userId}\n🌍 País: ${country}\n🏙️ Ciudad: ${city}\n🌐 IP: ${ip}\n🕐 Fecha: ${timestamp}\n\n✅ Cuenta activada con trial de 15 días`;

      console.log('[Admin Notification]', message);

      // Aquí puedes agregar integración con:
      // - WhatsApp Business API
      // - Telegram Bot
      // - Email (SendGrid, Resend)
      // - Slack webhook
      // - Tu propio servidor de notificaciones

      // Ejemplo con fetch a webhook:
      // await fetch('https://tu-webhook.com/notify', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ message, userEmail, ip, country, city })
      // });

    } catch (error) {
      console.error('[Auth] Error enviando notificación:', error);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signInWithGoogle, signInWithMagicLink, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
