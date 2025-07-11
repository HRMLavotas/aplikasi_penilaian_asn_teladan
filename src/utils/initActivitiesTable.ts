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
      console.log("Activities table does not exist. Creating table...");

      // Create the table using raw SQL
      const { error: createError } = await supabase.rpc(
        "create_activities_table",
      );

      if (createError) {
        console.error("Failed to create activities table:", createError);
        return false;
      }

      tableInitialized = true;
      console.log("Activities table created successfully");
      return true;
    }

    // Some other error occurred
    console.error("Error checking activities table:", testError);
    return false;
  } catch (error) {
    console.error("Error initializing activities table:", error);
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
      console.warn(
        "Activities table does not exist. Activity logging will be disabled.",
      );
      console.warn(
        "Please run the migration: supabase/migrations/20250111_create_activities_table.sql",
      );
      return false;
    }

    // Other errors (permissions, etc.)
    console.error("Cannot access activities table:", error);
    return false;
  } catch (error) {
    console.error("Error setting up activities table:", error);
    return false;
  }
};
