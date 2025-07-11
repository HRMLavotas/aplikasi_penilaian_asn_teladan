import { supabase } from "@/integrations/supabase/client";

export const debugDatabaseConnection = async () => {
  console.log("🔍 Starting database debug...");

  try {
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from("pegawai")
      .select("id")
      .limit(1);

    if (connectionError) {
      console.error("❌ Connection error:", connectionError);
    } else {
      console.log("✅ Basic connection successful");
    }

    // Test user authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("❌ User authentication error:", userError);
    } else if (user) {
      console.log("✅ User authenticated:", user.email);
    } else {
      console.log("⚠️ No user authenticated");
    }

    // Test profiles table relationship
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, nama_lengkap")
      .limit(1);

    if (profilesError) {
      console.error("❌ Profiles error:", profilesError);
    } else {
      console.log("✅ Profiles accessible");
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }

  console.log("🔍 Database debug complete");
};

// Function to test activity insertion - placeholder since activities table doesn't exist
export const testActivityInsertion = async () => {
  console.log("🧪 Activities table not implemented yet");
};