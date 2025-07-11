// Placeholder hook - activities table not yet implemented
export interface ActivityData {
  activity_type: string;
  activity_description: string;
  table_affected?: string;
  record_id?: string;
  metadata?: Record<string, any>;
}

export type ActivityType = 'create' | 'update' | 'delete' | 'view';
export type EntityType = 'pegawai' | 'penilaian' | 'user';

export const useActivityTracker = () => {
  return {
    logActivity: async () => Promise.resolve(),
    logLogin: async () => Promise.resolve(),
    logLogout: async () => Promise.resolve(),
    logDataEntry: async () => Promise.resolve(),
    logDataUpdate: async () => Promise.resolve(),
    logDataDeletion: async () => Promise.resolve(),
  };
};

export const createActivityHelpers = () => ({
  logView: () => {},
  logCreate: () => {},
  logUpdate: () => {},
  logDelete: () => {},
});
