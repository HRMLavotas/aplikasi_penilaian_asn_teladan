-- Drop the old trigger that automatically calculates scores incorrectly
DROP TRIGGER IF EXISTS calculate_persentase_akhir_trigger ON penilaian;

-- Drop the old function
DROP FUNCTION IF EXISTS calculate_persentase_akhir();