import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type AppRole = 'admin' | 'store_owner';

interface UserRoleData {
  isAdmin: boolean;
  isStoreOwner: boolean;
  roles: AppRole[];
  loading: boolean;
}

export const useUserRole = (): UserRoleData => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRoles();
    } else {
      setRoles([]);
      setLoading(false);
    }
  }, [user]);

  const fetchRoles = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) throw error;
      
      const userRoles = data?.map(r => r.role as AppRole) || [];
      setRoles(userRoles);
    } catch (error) {
      console.error('Error fetching user roles:', error);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    isAdmin: roles.includes('admin'),
    isStoreOwner: roles.includes('store_owner'),
    roles,
    loading,
  };
};
