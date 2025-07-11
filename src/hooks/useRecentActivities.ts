import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Activity {
  id: string;
  user_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  description: string;
  details: Record<string, any> | null;
  created_at: string;
  profiles?: {
    nama_lengkap: string | null;
    username: string | null;
  };
}

export const useRecentActivities = (limit: number = 10) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isSuperAdmin } = useAuth();

  const fetchActivities = useCallback(async () => {
    if (!user) {
      setActivities([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from("activities")
        .select(
          `
          id,
          user_id,
          action_type,
          entity_type,
          entity_id,
          description,
          details,
          created_at,
          profiles:user_id (
            nama_lengkap,
            username
          )
        `,
        )
        .order("created_at", { ascending: false })
        .limit(limit);

      // If not super admin, only show user's own activities
      if (!isSuperAdmin) {
        query = query.eq("user_id", user.id);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        if (fetchError.code === "42P01") {
            "Activities table does not exist yet. Showing empty activities.",
          );
          setActivities([]);
          return;
        }
        throw fetchError;
      }

      setActivities(data || []);
    } catch (err) {
        error: err,
        message: err instanceof Error ? err.message : "Unknown error",
      });
      setError(err instanceof Error ? err.message : "Gagal memuat aktivitas");
      setActivities([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  }, [user, isSuperAdmin, limit]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Set up real-time subscription for activities
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("activities-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "activities",
          filter: isSuperAdmin ? undefined : `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Refresh activities when changes occur
          fetchActivities();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isSuperAdmin, fetchActivities]);

  return {
    activities,
    isLoading,
    error,
    refetch: fetchActivities,
  };
};

// Helper function to format activity descriptions in Indonesian
export const formatActivityDescription = (activity: Activity): string => {
  const actionMap: Record<string, string> = {
    login: "masuk ke sistem",
    logout: "keluar dari sistem",
    view: "melihat",
    create: "membuat",
    update: "mengubah",
    delete: "menghapus",
    evaluate: "mengevaluasi",
    export: "mengekspor",
    filter: "memfilter",
    search: "mencari",
    approve: "menyetujui",
    reject: "menolak",
  };

  const entityMap: Record<string, string> = {
    user: "pengguna",
    dashboard: "dashboard",
    pegawai: "data pegawai",
    penilaian: "penilaian",
    ranking: "ranking",
    laporan: "laporan",
    settings: "pengaturan",
    unit_kerja: "unit kerja",
    evaluasi: "evaluasi",
    report: "laporan",
    export: "ekspor data",
  };

  const action = actionMap[activity.action_type] || activity.action_type;
  const entity = entityMap[activity.entity_type] || activity.entity_type;

  // Use custom description if available, otherwise generate one
  if (activity.description && !activity.description.startsWith("User ")) {
    return activity.description;
  }

  return (
    `${action} ${entity}`.charAt(0).toUpperCase() +
    `${action} ${entity}`.slice(1)
  );
};

// Helper function to get activity icon
export const getActivityIcon = (actionType: string): string => {
  const iconMap: Record<string, string> = {
    login: "🚪",
    logout: "👋",
    view: "👁️",
    create: "➕",
    update: "✏️",
    delete: "🗑️",
    evaluate: "📊",
    export: "📤",
    filter: "🔍",
    search: "🔎",
    approve: "✅",
    reject: "❌",
  };

  return iconMap[actionType] || "📝";
};

// Helper function to format relative time in Indonesian
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Baru saja";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} menit yang lalu`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} jam yang lalu`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} hari yang lalu`;
  } else {
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
};
