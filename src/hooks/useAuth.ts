import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;
    let authSubscription: { subscription: { unsubscribe: () => void } } | null =
      null;

    const checkAuth = async () => {
      try {
        // First check if we have a session before calling getUser
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (sessionError) {
          console.error("Error getting session:", sessionError);
          // Clear any corrupted session data
          await supabase.auth.signOut();
          setUser(null);
          setIsSuperAdmin(false);
          setIsLoading(false);
          setIsInitialized(true);
          return;
        }

        // If no session, user is not authenticated
        if (!session) {
          setUser(null);
          setIsSuperAdmin(false);
          setIsLoading(false);
          setIsInitialized(true);
          return;
        }

        // If we have a session, get the user
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (error) {
          console.error("Error getting user:", error);
          // If getUser fails but we have a session, clear everything
          await supabase.auth.signOut();
          setUser(null);
          setIsSuperAdmin(false);
          setIsLoading(false);
          setIsInitialized(true);
          return;
        }

        setUser(user);

        if (user) {
          // Cek apakah user adalah super admin
          const isAdmin = user.email === "hrmlavotas@gmail.com";
          setIsSuperAdmin(isAdmin);
        } else {
          setIsSuperAdmin(false);
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        if (mounted) {
          // On any error, clear the session and reset state
          try {
            await supabase.auth.signOut();
          } catch (signOutError) {
            console.error("Error signing out after auth error:", signOutError);
          }
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

    // Subscribe to auth changes
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      const currentUser = session?.user || null;
      setUser(currentUser);

      if (currentUser) {
        const isAdmin = currentUser.email === "hrmlavotas@gmail.com";
        setIsSuperAdmin(isAdmin);
      } else {
        setIsSuperAdmin(false);
      }

      // Set initialized to true when we get the first auth state
      if (!isInitialized) {
        setIsInitialized(true);
        setIsLoading(false);
      }
    });

    authSubscription = data;

    // Initial check
    checkAuth();

    return () => {
      mounted = false;
      if (authSubscription?.subscription) {
        authSubscription.subscription.unsubscribe();
      }
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error("Error signing out:", error);
      return { error };
    }
  };

  return {
    user,
    isSuperAdmin,
    isLoading: !isInitialized || isLoading,
    isInitialized,
    signOut,
  };
};
