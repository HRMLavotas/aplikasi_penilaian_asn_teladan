import { supabase } from "@/integrations/supabase/client";

export const clearCorruptedSession = async () => {
  try {
    // Clear localStorage auth data
    localStorage.removeItem("sb-grvebluvhcdoitezkmbe-auth-token");
    localStorage.removeItem("supabase.auth.token");

    // Sign out to clear any Supabase session
    await supabase.auth.signOut();

  } catch (error) {
  }
};

// Function to check if session data is corrupted
export const isSessionCorrupted = () => {
  try {
    const authToken = localStorage.getItem(
      "sb-grvebluvhcdoitezkmbe-auth-token",
    );
    if (authToken) {
      JSON.parse(authToken);
    }
    return false;
  } catch (error) {
    return true;
  }
};
