import { supabase } from "@/integrations/supabase/client";

export const debugDatabaseConnection = async () => {
  console.log("=== Database Debug Info ===");

  try {
    // Test basic connection
    console.log("1. Testing basic connection...");
    const { data: connectionTest, error: connectionError } = await supabase
      .from("pegawai")
      .select("id")
      .limit(1);

    if (connectionError) {
      console.error("Connection error:", connectionError);
    } else {
      console.log("✅ Database connection OK");
    }

    // Test user authentication
    console.log("2. Testing user authentication...");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("User auth error:", userError);
    } else if (user) {
      console.log("✅ User authenticated:", user.email);
    } else {
      console.log("❌ No user authenticated");
    }

    // Test activities table
    console.log("3. Testing activities table...");
    const { data: activitiesData, error: activitiesError } = await supabase
      .from("activities")
      .select("id")
      .limit(1);

    if (activitiesError) {
      console.error("Activities table error:", {
        code: activitiesError.code,
        message: activitiesError.message,
        details: activitiesError.details,
        hint: activitiesError.hint,
      });

      if (activitiesError.code === "42P01") {
        console.log("❌ Activities table does not exist");
      } else {
        console.log("❌ Activities table access error");
      }
    } else {
      console.log("✅ Activities table accessible");
    }

    // Test profiles table relationship
    console.log("4. Testing profiles table...");
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, nama_lengkap")
      .limit(1);

    if (profilesError) {
      console.error("Profiles table error:", profilesError);
    } else {
      console.log("✅ Profiles table accessible");
    }
  } catch (error) {
    console.error("General error during debug:", error);
  }

  console.log("=== End Database Debug ===");
};

// Function to test activity insertion
export const testActivityInsertion = async () => {
  console.log("=== Testing Activity Insertion ===");

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("❌ No user logged in for testing");
      return;
    }

    console.log("Testing activity insertion for user:", user.email);

    const testActivity = {
      user_id: user.id,
      action_type: "test",
      entity_type: "debug",
      entity_id: null,
      description: "Test activity for debugging",
      details: { test: true, timestamp: new Date().toISOString() },
    };

    const { data, error } = await supabase
      .from("activities")
      .insert(testActivity)
      .select();

    if (error) {
      console.error("❌ Failed to insert test activity:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
    } else {
      console.log("✅ Test activity inserted successfully:", data);

      // Clean up test activity
      if (data && data[0]) {
        await supabase.from("activities").delete().eq("id", data[0].id);
        console.log("🧹 Test activity cleaned up");
      }
    }
  } catch (error) {
    console.error("Error during activity insertion test:", error);
  }

  console.log("=== End Activity Insertion Test ===");
};
