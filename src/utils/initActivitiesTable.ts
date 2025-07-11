import { supabase } from "@/integrations/supabase/client";

let tableInitialized = false;

export const initActivitiesTable = async (): Promise<boolean> => {
  if (tableInitialized) return true;

  try {
    // Check if the table exists first
    const { error: testError } = await supabase
      .from("activities")
      .select("id", { count: "exact", head: true });

    if (!testError) {
      // Table exists and we can access it
      tableInitialized = true;
      return true;
    }

    if (testError.code === "42P01") {

      // Create the table using raw SQL
      const { error: createError } = await supabase.rpc(
        "create_activities_table",
      );

      if (createError) {
        return false;
      }

      tableInitialized = true;
      return true;
    }

    // Some other error occurred
    return false;
  } catch (error) {
    return false;
  }
};

// Alternative approach - create a function to setup the table
export const setupActivitiesTableIfNeeded = async (): Promise<boolean> => {
  try {
    // Try to query the table
    const { error } = await supabase.from("activities").select("id").limit(1);

    if (!error) {
      // Table exists and accessible
      tableInitialized = true;
      return true;
    }

    if (error.code === "42P01") {
      // Table doesn't exist - for now, just log and return false
      // In a real production environment, this would be handled by proper migrations
        "Activities table does not exist. Activity logging will be disabled.",
      );
        "Please run the migration: supabase/migrations/20250111_create_activities_table.sql",
      );
      return false;
    }

    // Other errors (permissions, etc.)
    return false;
  } catch (error) {
    return false;
  }
};
