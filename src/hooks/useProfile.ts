import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Profile {
  id: string;
  user_id: string;
  store_name: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  background_color: string | null;
  text_color: string | null;
  active_theme: string | null;
}

export interface BrandingColors {
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: BrandingColors;
}

export const PREDEFINED_THEMES: Theme[] = [
  {
    id: 'light',
    name: 'Claro',
    colors: {
      primary_color: '#10B981',
      secondary_color: '#059669',
      background_color: '#F0FDF4',
      text_color: '#1F2937',
    },
  },
  {
    id: 'dark',
    name: 'Oscuro',
    colors: {
      primary_color: '#22C55E',
      secondary_color: '#16A34A',
      background_color: '#1A1A2E',
      text_color: '#E5E7EB',
    },
  },
  {
    id: 'nequi',
    name: 'Nequi',
    colors: {
      primary_color: '#DA0081',
      secondary_color: '#9B0060',
      background_color: '#FDF2F8',
      text_color: '#1F2937',
    },
  },
  {
    id: 'ocean',
    name: 'Océano',
    colors: {
      primary_color: '#0EA5E9',
      secondary_color: '#0284C7',
      background_color: '#F0F9FF',
      text_color: '#0F172A',
    },
  },
  {
    id: 'sunset',
    name: 'Atardecer',
    colors: {
      primary_color: '#F97316',
      secondary_color: '#EA580C',
      background_color: '#FFF7ED',
      text_color: '#1C1917',
    },
  },
  {
    id: 'custom',
    name: 'Personalizado',
    colors: {
      primary_color: '#10B981',
      secondary_color: '#059669',
      background_color: '#F0FDF4',
      text_color: '#1F2937',
    },
  },
];

const DEFAULT_COLORS: BrandingColors = PREDEFINED_THEMES[0].colors;

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  // Apply theme colors to CSS variables
  const applyThemeToDOM = useCallback((colors: BrandingColors) => {
    const root = document.documentElement;
    
    // Convert hex to HSL for CSS variables
    const hexToHSL = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0;
      let s = 0;
      const l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
        }
      }

      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };

    root.style.setProperty('--primary', hexToHSL(colors.primary_color));
    root.style.setProperty('--accent', hexToHSL(colors.secondary_color));
    root.style.setProperty('--background', hexToHSL(colors.background_color));
    root.style.setProperty('--foreground', hexToHSL(colors.text_color));
    
    // Determine if dark theme based on background luminance
    const bgLuminance = parseInt(colors.background_color.slice(5, 7), 16);
    const isDark = bgLuminance < 128;
    
    if (isDark) {
      root.style.setProperty('--card', hexToHSL(colors.background_color));
      root.style.setProperty('--card-foreground', hexToHSL(colors.text_color));
      root.style.setProperty('--muted', `${hexToHSL(colors.background_color).split(' ')[0]} 15% 20%`);
      root.style.setProperty('--muted-foreground', `${hexToHSL(colors.text_color).split(' ')[0]} 10% 60%`);
    } else {
      root.style.setProperty('--card', '0 0% 100%');
      root.style.setProperty('--card-foreground', hexToHSL(colors.text_color));
      root.style.setProperty('--muted', `${hexToHSL(colors.background_color).split(' ')[0]} 15% 92%`);
      root.style.setProperty('--muted-foreground', `${hexToHSL(colors.text_color).split(' ')[0]} 10% 45%`);
    }
  }, []);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setProfile(data);
        // Apply saved theme colors
        const colors = getColorsFromProfile(data);
        applyThemeToDOM(colors);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getColorsFromProfile = (prof: Profile): BrandingColors => {
    return {
      primary_color: prof.primary_color || DEFAULT_COLORS.primary_color,
      secondary_color: prof.secondary_color || DEFAULT_COLORS.secondary_color,
      background_color: prof.background_color || DEFAULT_COLORS.background_color,
      text_color: prof.text_color || DEFAULT_COLORS.text_color,
    };
  };

  const updateStoreName = async (storeName: string) => {
    if (!user || !profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ store_name: storeName })
        .eq('user_id', user.id);

      if (error) throw error;
      
      setProfile({ ...profile, store_name: storeName });
      toast.success('Nombre de tienda actualizado');
    } catch (error) {
      console.error('Error updating store name:', error);
      toast.error('Error al actualizar el nombre');
    }
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    if (!user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/logo.${fileExt}`;

      // Delete old logo if exists
      await supabase.storage.from('store-logos').remove([filePath]);

      const { error: uploadError } = await supabase.storage
        .from('store-logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('store-logos')
        .getPublicUrl(filePath);

      // Update profile with new logo URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ logo_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, logo_url: publicUrl } : null);
      toast.success('Logo actualizado');
      return publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Error al subir el logo');
      return null;
    }
  };

  const updateTheme = async (themeId: string, colors: BrandingColors) => {
    if (!user || !profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          active_theme: themeId,
          ...colors 
        })
        .eq('user_id', user.id);

      if (error) throw error;
      
      setProfile({ ...profile, active_theme: themeId, ...colors });
      applyThemeToDOM(colors);
      toast.success('Tema actualizado');
    } catch (error) {
      console.error('Error updating theme:', error);
      toast.error('Error al actualizar el tema');
    }
  };

  const updateBrandingColors = async (colors: BrandingColors) => {
    if (!user || !profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          active_theme: 'custom',
          ...colors 
        })
        .eq('user_id', user.id);

      if (error) throw error;
      
      setProfile({ ...profile, active_theme: 'custom', ...colors });
      applyThemeToDOM(colors);
      toast.success('Colores personalizados guardados');
    } catch (error) {
      console.error('Error updating colors:', error);
      toast.error('Error al actualizar los colores');
    }
  };

  const getColors = (): BrandingColors => {
    if (!profile) return DEFAULT_COLORS;
    return getColorsFromProfile(profile);
  };

  const getActiveTheme = (): string => {
    return profile?.active_theme || 'light';
  };

  return {
    profile,
    loading,
    updateStoreName,
    uploadLogo,
    updateTheme,
    updateBrandingColors,
    getColors,
    getActiveTheme,
    applyThemeToDOM,
  };
};
