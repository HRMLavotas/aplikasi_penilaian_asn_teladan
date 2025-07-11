import { supabase } from "@/integrations/supabase/client";

let tableInitialized = false;

export const initActivitiesTable = async (): Promise<boolean> => {
  if (tableInitialized) {
    return true;
  }

  // For now, just return false since activities table doesn't exist
  console.warn("Activities table not implemented yet");
  return false;
};
