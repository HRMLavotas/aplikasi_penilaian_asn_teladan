-- Migration to replace old scoring system with BerAKHLAK core values
-- This migration removes old scoring fields and adds the 7 BerAKHLAK core values

-- Add new BerAKHLAK core values columns
ALTER TABLE penilaian 
ADD COLUMN IF NOT EXISTS berorientasi_pelayanan_score INTEGER DEFAULT 70,
ADD COLUMN IF NOT EXISTS akuntabel_score INTEGER DEFAULT 70,
ADD COLUMN IF NOT EXISTS kompeten_score INTEGER DEFAULT 70,
ADD COLUMN IF NOT EXISTS harmonis_score INTEGER DEFAULT 70,
ADD COLUMN IF NOT EXISTS loyal_score INTEGER DEFAULT 70,
ADD COLUMN IF NOT EXISTS adaptif_score INTEGER DEFAULT 70,
ADD COLUMN IF NOT EXISTS kolaboratif_score INTEGER DEFAULT 70;

-- Add constraints for score ranges (1-100)
ALTER TABLE penilaian 
ADD CONSTRAINT berorientasi_pelayanan_score_range CHECK (berorientasi_pelayanan_score >= 1 AND berorientasi_pelayanan_score <= 100),
ADD CONSTRAINT akuntabel_score_range CHECK (akuntabel_score >= 1 AND akuntabel_score <= 100),
ADD CONSTRAINT kompeten_score_range CHECK (kompeten_score >= 1 AND kompeten_score <= 100),
ADD CONSTRAINT harmonis_score_range CHECK (harmonis_score >= 1 AND harmonis_score <= 100),
ADD CONSTRAINT loyal_score_range CHECK (loyal_score >= 1 AND loyal_score <= 100),
ADD CONSTRAINT adaptif_score_range CHECK (adaptif_score >= 1 AND adaptif_score <= 100),
ADD CONSTRAINT kolaboratif_score_range CHECK (kolaboratif_score >= 1 AND kolaboratif_score <= 100);

-- Drop old scoring columns (if they exist)
ALTER TABLE penilaian 
DROP COLUMN IF EXISTS kinerja_perilaku_score,
DROP COLUMN IF EXISTS inovasi_dampak_score,
DROP COLUMN IF EXISTS prestasi_score,
DROP COLUMN IF EXISTS inspiratif_score,
DROP COLUMN IF EXISTS komunikasi_score,
DROP COLUMN IF EXISTS kerjasama_kolaborasi_score,
DROP COLUMN IF EXISTS leadership_score,
DROP COLUMN IF EXISTS rekam_jejak_score,
DROP COLUMN IF EXISTS integritas_moralitas_score;

-- Update the calculate_persentase_akhir function with new percentage weightings
CREATE OR REPLACE FUNCTION calculate_persentase_akhir(penilaian_data jsonb)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    integritas_score DECIMAL(5,2) := 0;
    prestasi_score DECIMAL(5,2) := 0;
    skp_score DECIMAL(5,2) := 0;
    core_values_score DECIMAL(5,2) := 0;
    total_score DECIMAL(5,2) := 0;
BEGIN
    -- Kriteria Integritas (30%)
    IF (penilaian_data->>'bebas_temuan')::boolean THEN
        integritas_score := integritas_score + 10;
    END IF;
    IF (penilaian_data->>'tidak_hukuman_disiplin')::boolean THEN
        integritas_score := integritas_score + 10;
    END IF;
    IF (penilaian_data->>'tidak_pemeriksaan_disiplin')::boolean THEN
        integritas_score := integritas_score + 10;
    END IF;

    -- Prestasi & Inovasi (30%)
    IF (penilaian_data->>'memiliki_inovasi')::boolean THEN
        prestasi_score := prestasi_score + 20;
    END IF;
    IF (penilaian_data->>'memiliki_penghargaan')::boolean THEN
        prestasi_score := prestasi_score + 10;
    END IF;

    -- Kriteria SKP (20%)
    IF (penilaian_data->>'skp_2_tahun_terakhir_baik')::boolean THEN
        skp_score := skp_score + 10;
    END IF;
    IF (penilaian_data->>'skp_peningkatan_prestasi')::boolean THEN
        skp_score := skp_score + 10;
    END IF;

    -- Core Values ASN BerAKHLAK (20%)
    -- Each core value contributes 2.857% (20% / 7 = 2.857%)
    core_values_score := (
        COALESCE((penilaian_data->>'berorientasi_pelayanan_score')::numeric, 70) +
        COALESCE((penilaian_data->>'akuntabel_score')::numeric, 70) +
        COALESCE((penilaian_data->>'kompeten_score')::numeric, 70) +
        COALESCE((penilaian_data->>'harmonis_score')::numeric, 70) +
        COALESCE((penilaian_data->>'loyal_score')::numeric, 70) +
        COALESCE((penilaian_data->>'adaptif_score')::numeric, 70) +
        COALESCE((penilaian_data->>'kolaboratif_score')::numeric, 70)
    ) / 7 * 0.20; -- Average of core values * 20%

    -- Total Score
    total_score := integritas_score + prestasi_score + skp_score + core_values_score;
    
    -- Ensure total doesn't exceed 100
    RETURN LEAST(total_score, 100);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically calculate persentase_akhir
CREATE OR REPLACE FUNCTION update_persentase_akhir()
RETURNS TRIGGER AS $$
BEGIN
    NEW.persentase_akhir := calculate_persentase_akhir(to_jsonb(NEW));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_calculate_persentase_akhir ON penilaian;

-- Create new trigger
CREATE TRIGGER trigger_calculate_persentase_akhir
    BEFORE INSERT OR UPDATE ON penilaian
    FOR EACH ROW
    EXECUTE FUNCTION update_persentase_akhir();

-- Update existing records to use default values for new columns
UPDATE penilaian 
SET 
    berorientasi_pelayanan_score = COALESCE(berorientasi_pelayanan_score, 70),
    akuntabel_score = COALESCE(akuntabel_score, 70),
    kompeten_score = COALESCE(kompeten_score, 70),
    harmonis_score = COALESCE(harmonis_score, 70),
    loyal_score = COALESCE(loyal_score, 70),
    adaptif_score = COALESCE(adaptif_score, 70),
    kolaboratif_score = COALESCE(kolaboratif_score, 70);

-- Recalculate persentase_akhir for all existing records
UPDATE penilaian 
SET persentase_akhir = calculate_persentase_akhir(to_jsonb(penilaian.*));
