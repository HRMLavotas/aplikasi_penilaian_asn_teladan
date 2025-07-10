import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Error getting user:', error);
          setUser(null);
          setIsSuperAdmin(false);
          return;
        }

        setUser(user);
        
        if (user) {
          // Cek apakah user adalah super admin
          const isAdmin = user.email === 'hrmlavotas@gmail.com';
          setIsSuperAdmin(isAdmin);
        } else {
          setIsSuperAdmin(false);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        if (mounted) {
          setUser(null);
          setIsSuperAdmin(false);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        const currentUser = session?.user || null;
        setUser(currentUser);
        
        if (currentUser) {
          const isAdmin = currentUser.email === 'hrmlavotas@gmail.com';
          setIsSuperAdmin(isAdmin);
        } else {
          setIsSuperAdmin(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error signing out:', error);
      return { error };
    }
  };

  return { 
    user, 
    isSuperAdmin, 
    isLoading: !isInitialized || isLoading,
    isInitialized,
    signOut
  };
};
