import { supabase } from "@/integrations/supabase/client";

export const debugDatabaseConnection = async () => {

  try {
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from("pegawai")
      .select("id")
      .limit(1);

    if (connectionError) {
    } else {
    }

    // Test user authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
    } else if (user) {
    } else {
    }

    // Test activities table
    const { data: activitiesData, error: activitiesError } = await supabase
      .from("activities")
      .select("id")
      .limit(1);

    if (activitiesError) {
        code: activitiesError.code,
        message: activitiesError.message,
        details: activitiesError.details,
        hint: activitiesError.hint,
      });

      if (activitiesError.code === "42P01") {
      } else {
      }
    } else {
    }

    // Test profiles table relationship
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, nama_lengkap")
      .limit(1);

    if (profilesError) {
    } else {
    }
  } catch (error) {
  }

};

// Function to test activity insertion
export const testActivityInsertion = async () => {

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return;
    }


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
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
    } else {

      // Clean up test activity
      if (data && data[0]) {
        await supabase.from("activities").delete().eq("id", data[0].id);
      }
    }
  } catch (error) {
  }

};
