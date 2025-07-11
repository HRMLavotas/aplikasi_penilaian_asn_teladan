import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type ActivityType =
  | "login"
  | "logout"
  | "view"
  | "create"
  | "update"
  | "delete"
  | "export"
  | "search"
  | "filter"
  | "evaluate"
  | "approve"
  | "reject";

export type EntityType =
  | "user"
  | "dashboard"
  | "pegawai"
  | "penilaian"
  | "ranking"
  | "laporan"
  | "settings"
  | "unit_kerja"
  | "evaluasi"
  | "report"
  | "export";

interface ActivityData {
  actionType: ActivityType;
  entityType: EntityType;
  entityId?: string;
  description: string;
  details?: Record<string, any>;
}

export const useActivityTracker = () => {
  const { user } = useAuth();

  const logActivity = useCallback(
    async (activityData: ActivityData) => {
      if (!user) {
        console.log("No user logged in, skipping activity log");
        return;
      }

      try {
        // First check if activities table exists by doing a simple count query
        const { error: testError } = await supabase
          .from("activities")
          .select("id", { count: "exact", head: true });

        if (testError) {
          if (testError.code === "42P01") {
            console.warn(
              "Activities table does not exist yet. Please run the migration.",
            );
            return;
          }
          console.error("Error testing activities table:", testError);
          console.error(
            "Test error details:",
            JSON.stringify(testError, null, 2),
          );
          return;
        }

        const { error } = await supabase.from("activities").insert({
          user_id: user.id,
          action_type: activityData.actionType,
          entity_type: activityData.entityType,
          entity_id: activityData.entityId || null,
          description: activityData.description,
          details: activityData.details || null,
        });

        if (error) {
          console.error("Failed to log activity:", error);
          console.error("Error details:", JSON.stringify(error, null, 2));
          console.error("Activity data:", activityData);
          console.error("User:", user.id);
        }
      } catch (error) {
        console.error("Error logging activity:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        console.error("Activity data:", activityData);
      }
    },
    [user],
  );

  return { logActivity };
};

// Helper functions for common activities
export const createActivityHelpers = (
  logActivity: (data: ActivityData) => void,
) => ({
  logLogin: () =>
    logActivity({
      actionType: "login",
      entityType: "user",
      description: "User berhasil login ke sistem",
      details: { timestamp: new Date().toISOString() },
    }),

  logLogout: () =>
    logActivity({
      actionType: "logout",
      entityType: "user",
      description: "User logout dari sistem",
      details: { timestamp: new Date().toISOString() },
    }),

  logView: (entityType: EntityType, description: string, entityId?: string) =>
    logActivity({
      actionType: "view",
      entityType,
      entityId,
      description,
      details: { timestamp: new Date().toISOString() },
    }),

  logCreate: (
    entityType: EntityType,
    entityId: string,
    description: string,
    details?: Record<string, any>,
  ) =>
    logActivity({
      actionType: "create",
      entityType,
      entityId,
      description,
      details: { ...details, timestamp: new Date().toISOString() },
    }),

  logUpdate: (
    entityType: EntityType,
    entityId: string,
    description: string,
    details?: Record<string, any>,
  ) =>
    logActivity({
      actionType: "update",
      entityType,
      entityId,
      description,
      details: { ...details, timestamp: new Date().toISOString() },
    }),

  logDelete: (
    entityType: EntityType,
    entityId: string,
    description: string,
    details?: Record<string, any>,
  ) =>
    logActivity({
      actionType: "delete",
      entityType,
      entityId,
      description,
      details: { ...details, timestamp: new Date().toISOString() },
    }),

  logEvaluate: (pegawaiId: string, pegawaiName: string, score?: number) =>
    logActivity({
      actionType: "evaluate",
      entityType: "penilaian",
      entityId: pegawaiId,
      description: `Melakukan evaluasi pegawai: ${pegawaiName}`,
      details: {
        pegawaiName,
        score,
        timestamp: new Date().toISOString(),
      },
    }),

  logExport: (entityType: EntityType, description: string, count?: number) =>
    logActivity({
      actionType: "export",
      entityType,
      description,
      details: {
        exportCount: count,
        timestamp: new Date().toISOString(),
      },
    }),

  logFilter: (
    entityType: EntityType,
    description: string,
    filters?: Record<string, any>,
  ) =>
    logActivity({
      actionType: "filter",
      entityType,
      description,
      details: {
        filters,
        timestamp: new Date().toISOString(),
      },
    }),
});
