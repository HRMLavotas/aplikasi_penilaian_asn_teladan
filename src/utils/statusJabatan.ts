/**
 * Utility functions for handling status jabatan display and mapping
 */

/**
 * Convert database status jabatan value to user-friendly display text
 */
export const getStatusJabatanDisplay = (statusJabatan: string): string => {
  switch (statusJabatan) {
    case "administrasi":
      return "Administrator";
    case "fungsional":
      return "Fungsional";
    default:
      return statusJabatan; // fallback to original value
  }
};

/**
 * Convert user input to database value for status jabatan
 */
export const getStatusJabatanDbValue = (statusJabatan: string): string => {
  const normalized = statusJabatan.toLowerCase();
  if (["administrator", "pengawas", "pelaksana"].includes(normalized)) {
    return "administrasi";
  }
  return statusJabatan;
};

/**
 * Get all available status jabatan options for dropdowns
 */
export const getStatusJabatanOptions = () => [
  { value: "administrasi", label: "Administrator" },
  { value: "fungsional", label: "Fungsional" },
];
