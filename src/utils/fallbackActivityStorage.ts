// Fallback activity storage for development when database table doesn't exist

interface ActivityData {
  id: string;
  user_id: string;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  description: string;
  details: any;
  created_at: string;
}

const STORAGE_KEY = "asn_activities_fallback";
const MAX_ACTIVITIES = 50; // Keep only last 50 activities in localStorage

export const saveFallbackActivity = (
  activity: Omit<ActivityData, "id" | "created_at">,
) => {
  try {
    const activities = getFallbackActivities();

    const newActivity: ActivityData = {
      ...activity,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };

    activities.unshift(newActivity);

    // Keep only the most recent activities
    const trimmedActivities = activities.slice(0, MAX_ACTIVITIES);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedActivities));

  } catch (error) {
  }
};

export const getFallbackActivities = (): ActivityData[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
};

export const clearFallbackActivities = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
  }
};

// Helper to check if we should use fallback storage
export const shouldUseFallbackStorage = () => {
  // You can add logic here to determine when to use fallback
  // For now, we'll let the hooks handle this automatically
  return false;
};
