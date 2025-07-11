// Placeholder for ActivityLogger - activities table not yet implemented
import React from 'react';

export type EntityType = 'pegawai' | 'penilaian' | 'user';

interface ActivityLoggerProps {
  children: React.ReactNode;
  pageType: EntityType;
  pageTitle: string;
  autoLog?: boolean;
}

export const ActivityLogger: React.FC<ActivityLoggerProps> = ({ children }) => {
  return <>{children}</>;
};

export const useActivityLogger = () => {
  return {
    logView: () => {},
    logCreate: () => {},
    logUpdate: () => {},
    logDelete: () => {},
  };
};

export default ActivityLogger;
