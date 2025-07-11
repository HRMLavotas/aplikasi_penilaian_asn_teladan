import { useEffect } from "react";
import {
  useActivityTracker,
  createActivityHelpers,
  ActivityType,
  EntityType,
} from "@/hooks/useActivityTracker";

interface ActivityLoggerProps {
  children: React.ReactNode;
  pageType: EntityType;
  pageTitle: string;
  autoLog?: boolean;
}

/**
 * ActivityLogger component that wraps pages to provide automatic activity tracking
 *
 * Usage:
 * <ActivityLogger pageType="pegawai" pageTitle="Data Pegawai" autoLog>
 *   <YourPageContent />
 * </ActivityLogger>
 */
export const ActivityLogger: React.FC<ActivityLoggerProps> = ({
  children,
  pageType,
  pageTitle,
  autoLog = true,
}) => {
  const { logActivity } = useActivityTracker();
  const activityHelpers = createActivityHelpers(logActivity);

  useEffect(() => {
    if (autoLog) {
      activityHelpers.logView(pageType, `Mengakses halaman ${pageTitle}`);
    }
  }, [autoLog, pageType, pageTitle, activityHelpers]);

  return <>{children}</>;
};

/**
 * Hook for accessing activity helpers within an ActivityLogger context
 */
export const useActivityLogger = () => {
  const { logActivity } = useActivityTracker();
  return createActivityHelpers(logActivity);
};

export default ActivityLogger;
