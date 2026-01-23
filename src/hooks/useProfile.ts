// ============================================================================
// ARCHIVO 2: useProfile.ts
// ============================================================================
// Guarda este código en: src/hooks/useProfile.ts

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

type BrandingColors = {
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
};

type ProfileExtras = {
  whatsapp_number?: string | null;
  nequi_number?: string | null;
  daviplata_number?: string | null;
  payment_accounts?: any[] | null;
  message_template_reminder?: string | null;
  message_template_receipt?: string | null;
};

// Constantes
const DEFAULT_COLORS: BrandingColors = {
  primary_color: '#10B981',
  secondary_color: '#059669',
  background_color: '#F0FDF4',
  text_color: '#1F2937',
};

const DEFAULT_TEMPLATES = {
  message_template_reminder:
    '¡Hola {customer_first_name}! Tienes un saldo pendiente de {amount}. Puedes pagar por Nequi {nequi}, Daviplata {daviplata}. Tienda: {store_name}.',
  message_template_receipt:
    'Recibo #{transaction_id} - {store_name}\nCliente: {customer_name}\nPago: {amount}\nFecha: {date}\nSaldo restante: {remaining}\nContacto: {whatsapp}',
};

// Utilidades
const normalizePhone = (value?: string | null) =>
  (value || '').replace(/\D/g, '').slice(0, 10) || null;

const getColorsFromProfile = (p?: Tables<'profiles'> | null): BrandingColors => ({
  primary_color: p?.primary_color || DEFAULT_COLORS.primary_color,
  secondary_color: p?.secondary_color || DEFAULT_COLORS.secondary_color,
  background_color: p?.background_color || DEFAULT_COLORS.background_color,
  text_color: p?.text_color || DEFAULT_COLORS.text_color,
});

const hexToHsl = (hex: string) => {
  const sHex = hex.replace('#', '');
  const bigint = parseInt(sHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

const applyThemeToDocument = (colors: BrandingColors) => {
  const root = document.documentElement;
  root.style.setProperty('--background', hexToHsl(colors.background_color));
  root.style.setProperty('--foreground', hexToHsl(colors.text_color));
  root.style.setProperty('--primary', hexToHsl(colors.primary_color));
  root.style.setProperty('--secondary', hexToHsl(colors.secondary_color));
};

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Tables<'profiles'> | (Tables<'profiles'> & ProfileExtras) | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [paymentContactsState, setPaymentContactsState] = useState({
    whatsapp_number: null as string | null,
    nequi_number: null as string | null,
    daviplata_number: null as string | null,
    payment_accounts: [] as any[],
  });
  const [messageTemplatesState, setMessageTemplatesState] = useState({
    message_template_reminder: DEFAULT_TEMPLATES.message_template_reminder,
    message_template_receipt: DEFAULT_TEMPLATES.message_template_receipt,
  });

  const storageKey = (base: string) => `${base}:${user?.id || 'anon'}`;

  // Cargar perfil desde Supabase
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          const insertPayload: TablesInsert<'profiles'> = {
            user_id: user.id,
            store_name: 'Mi Tienda',
            active_theme: 'light',
            ...DEFAULT_COLORS,
          };
          const { error: insertError } = await supabase.from('profiles').insert(insertPayload);
          if (insertError) throw insertError;

          const { data: created, error: createdError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();
          if (createdError) throw createdError;
          setProfile(created as any);
        } else {
          setProfile(data as any);
        }
      } catch (e: any) {
        console.error('Error loading profile:', e);
        toast({
          title: 'Error cargando perfil',
          description: e?.message || 'No fue posible cargar tu perfil',
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user?.id]);

  // Cargar datos locales
  useEffect(() => {
    try {
      const rawContacts = localStorage.getItem(storageKey('fiado:paymentContacts'));
      if (rawContacts) {
        const parsed = JSON.parse(rawContacts);
        setPaymentContactsState({
          whatsapp_number: normalizePhone(parsed.whatsapp_number),
          nequi_number: normalizePhone(parsed.nequi_number),
          daviplata_number: normalizePhone(parsed.daviplata_number),
          payment_accounts: Array.isArray(parsed.payment_accounts) ? parsed.payment_accounts : [],
        });
      }
    } catch {}
    
    try {
      const rawTemplates = localStorage.getItem(storageKey('fiado:messageTemplates'));
      if (rawTemplates) {
        const parsed = JSON.parse(rawTemplates);
        setMessageTemplatesState({
          message_template_reminder: parsed.message_template_reminder || DEFAULT_TEMPLATES.message_template_reminder,
          message_template_receipt: parsed.message_template_receipt || DEFAULT_TEMPLATES.message_template_receipt,
        });
      }
    } catch {}
  }, [user?.id]);

  // Aplicar tema al documento
  useEffect(() => {
    const colors = getColorsFromProfile(profile as Tables<'profiles'> | null);
    applyThemeToDocument(colors);
  }, [
    profile?.primary_color,
    profile?.secondary_color,
    profile?.background_color,
    profile?.text_color,
  ]);

  // Métodos de actualización
  const updateProfileFields = async (
    fields: Partial<TablesUpdate<'profiles'>> & Partial<ProfileExtras>,
    successMsg = 'Perfil actualizado'
  ) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(fields as any)
        .eq('user_id', user.id);

      if (error) {
        if (error.code === 'PGRST204') {
          toast({
            title: 'Actualiza tu esquema',
            description:
              'Faltan columnas en la tabla "profiles". Ejecuta las migraciones de Supabase o añade las columnas de contactos/plantillas.',
          });
          return;
        }
        throw error;
      }

      setProfile((prev) => (prev ? { ...prev, ...fields } : prev));
      toast({ title: successMsg });
    } catch (e: any) {
      console.error('Error updating profile:', e);
      toast({
        title: 'Error',
        description: e?.message || 'No fue posible actualizar el perfil',
      });
    }
  };

  const updateStoreName = async (storeName: string) => {
    await updateProfileFields({ store_name: storeName?.trim() || 'Mi Tienda' }, 'Nombre de tienda actualizado');
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    if (!user?.id) return null;

    const bucket = 'logos';
    const path = `${user.id}/${Date.now()}_${file.name}`;

    try {
      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });
      if (uploadError) {
        if ((uploadError.message || '').toLowerCase().includes('not found')) {
          toast({
            title: 'Bucket faltante',
            description: 'Crea el bucket "logos" en Supabase Storage y habilita acceso público.',
          });
        }
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(path);

      await updateProfileFields({ logo_url: publicUrl }, 'Logo actualizado');
      return publicUrl;
    } catch (e: any) {
      console.error('Error uploading logo:', e);
      toast({
        title: 'Error al subir logo',
        description: e?.message || 'No fue posible subir el logo',
      });
      return null;
    }
  };

  const updateTheme = async (themeId: string, colors?: BrandingColors) => {
    const payload: Partial<TablesUpdate<'profiles'>> = {
      active_theme: themeId || 'light',
    };
    if (colors) {
      Object.assign(payload, colors);
    }
    await updateProfileFields(payload, 'Tema actualizado');
  };

  const updateBrandingColors = async (colors: BrandingColors) => {
    await updateProfileFields(
      {
        ...colors,
        active_theme: 'custom',
      },
      'Colores personalizados guardados'
    );
  };

  const updatePaymentContacts = async (contacts: {
    whatsapp_number?: string;
    nequi_number?: string;
    daviplata_number?: string;
    payment_accounts?: any[];
  }) => {
    const payload = {
      whatsapp_number: normalizePhone(contacts.whatsapp_number),
      nequi_number: normalizePhone(contacts.nequi_number),
      daviplata_number: normalizePhone(contacts.daviplata_number),
      payment_accounts: Array.isArray(contacts.payment_accounts) ? contacts.payment_accounts : [],
    };
    localStorage.setItem(storageKey('fiado:paymentContacts'), JSON.stringify(payload));
    setPaymentContactsState(payload);
    toast({ title: 'Información de pagos guardada' });
  };

  const updateMessageTemplates = async (templates: {
    message_template_reminder?: string;
    message_template_receipt?: string;
  }) => {
    const payload = {
      message_template_reminder:
        templates.message_template_reminder?.trim() || DEFAULT_TEMPLATES.message_template_reminder,
      message_template_receipt:
        templates.message_template_receipt?.trim() || DEFAULT_TEMPLATES.message_template_receipt,
    };
    localStorage.setItem(storageKey('fiado:messageTemplates'), JSON.stringify(payload));
    setMessageTemplatesState(payload);
    toast({ title: 'Plantillas guardadas' });
  };

  return {
    profile,
    loading,
    updateStoreName,
    uploadLogo,
    updateTheme,
    updateBrandingColors,
    updatePaymentContacts,
    updateMessageTemplates,
    getColors: () => getColorsFromProfile(profile as Tables<'profiles'> | null),
    getActiveTheme: () => profile?.active_theme || 'light',
    getPaymentContacts: () => paymentContactsState,
    getMessageTemplates: () => messageTemplatesState,
  };
};