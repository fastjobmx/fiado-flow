import { useState, useEffect } from 'react';
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
}

export interface BrandingColors {
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
}

const DEFAULT_COLORS: BrandingColors = {
  primary_color: '#10B981',
  secondary_color: '#059669',
  background_color: '#F0FDF4',
  text_color: '#1F2937',
};

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
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

  const updateBrandingColors = async (colors: BrandingColors) => {
    if (!user || !profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(colors)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setProfile({ ...profile, ...colors });
      toast.success('Colores actualizados');
    } catch (error) {
      console.error('Error updating colors:', error);
      toast.error('Error al actualizar los colores');
    }
  };

  const getColors = (): BrandingColors => {
    if (!profile) return DEFAULT_COLORS;
    return {
      primary_color: profile.primary_color || DEFAULT_COLORS.primary_color,
      secondary_color: profile.secondary_color || DEFAULT_COLORS.secondary_color,
      background_color: profile.background_color || DEFAULT_COLORS.background_color,
      text_color: profile.text_color || DEFAULT_COLORS.text_color,
    };
  };

  return {
    profile,
    loading,
    updateStoreName,
    uploadLogo,
    updateBrandingColors,
    getColors,
  };
};
