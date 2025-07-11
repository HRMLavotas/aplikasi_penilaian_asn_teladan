import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ActivityData {
  activity_type: string;
  activity_description: string;
  table_affected?: string;
  record_id?: string;
  metadata?: Record<string, any>;
}

export const useActivityTracker = () => {
  const logActivity = useCallback(async (activityData: ActivityData) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        return;
      }

      const user = session.user;

      const activityRecord = {
        user_id: user.id,
        user_email: user.email || "",
        activity_type: activityData.activity_type,
        activity_description: activityData.activity_description,
        table_affected: activityData.table_affected,
        record_id: activityData.record_id,
        metadata: activityData.metadata || {},
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("activities")
        .insert([activityRecord]);

      if (error) {
        // Check for common error types
        if (error.code === "42P01") {
          // Activities table does not exist
          return;
        }

        if (error.code === "23503") {
          // Foreign key constraint error
          return;
        }

        // Other errors - fail silently in production
        return;
      }
    } catch (error) {
      // Network or other errors - fail silently
      return;
    }
  }, []);

  // Helper functions for common activities
  const logLogin = useCallback(() => {
    logActivity({
      activity_type: "authentication",
      activity_description: "User logged in",
    });
  }, [logActivity]);

  const logLogout = useCallback(() => {
    logActivity({
      activity_type: "authentication",
      activity_description: "User logged out",
    });
  }, [logActivity]);

  const logDataEntry = useCallback(
    (tableName: string, description: string, recordId?: string) => {
      logActivity({
        activity_type: "data_entry",
        activity_description: description,
        table_affected: tableName,
        record_id: recordId,
      });
    },
    [logActivity],
  );

  const logDataUpdate = useCallback(
    (tableName: string, description: string, recordId?: string) => {
      logActivity({
        activity_type: "data_update",
        activity_description: description,
        table_affected: tableName,
        record_id: recordId,
      });
    },
    [logActivity],
  );

  const logDataDeletion = useCallback(
    (tableName: string, description: string, recordId?: string) => {
      logActivity({
        activity_type: "data_deletion",
        activity_description: description,
        table_affected: tableName,
        record_id: recordId,
      });
    },
    [logActivity],
  );

  return {
    logActivity,
    logLogin,
    logLogout,
    logDataEntry,
    logDataUpdate,
    logDataDeletion,
  };
};
