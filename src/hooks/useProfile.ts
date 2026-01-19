import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Profile {
  id: string;
  user_id: string;
  store_name: string;
}

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

  return {
    profile,
    loading,
    updateStoreName,
  };
};
