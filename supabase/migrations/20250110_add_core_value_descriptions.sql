-- Migration to add description fields for each core value in BerAKHLAK evaluation

-- Add description columns for each core value
ALTER TABLE penilaian 
ADD COLUMN IF NOT EXISTS berorientasi_pelayanan_desc TEXT,
ADD COLUMN IF NOT EXISTS akuntabel_desc TEXT,
ADD COLUMN IF NOT EXISTS kompeten_desc TEXT,
ADD COLUMN IF NOT EXISTS harmonis_desc TEXT,
ADD COLUMN IF NOT EXISTS loyal_desc TEXT,
ADD COLUMN IF NOT EXISTS adaptif_desc TEXT,
ADD COLUMN IF NOT EXISTS kolaboratif_desc TEXT;

-- Add check constraints to ensure minimum character length (600 characters)
ALTER TABLE penilaian 
ADD CONSTRAINT berorientasi_pelayanan_desc_length CHECK (
    berorientasi_pelayanan_desc IS NULL OR char_length(berorientasi_pelayanan_desc) >= 600
),
ADD CONSTRAINT akuntabel_desc_length CHECK (
    akuntabel_desc IS NULL OR char_length(akuntabel_desc) >= 600
),
ADD CONSTRAINT kompeten_desc_length CHECK (
    kompeten_desc IS NULL OR char_length(kompeten_desc) >= 600
),
ADD CONSTRAINT harmonis_desc_length CHECK (
    harmonis_desc IS NULL OR char_length(harmonis_desc) >= 600
),
ADD CONSTRAINT loyal_desc_length CHECK (
    loyal_desc IS NULL OR char_length(loyal_desc) >= 600
),
ADD CONSTRAINT adaptif_desc_length CHECK (
    adaptif_desc IS NULL OR char_length(adaptif_desc) >= 600
),
ADD CONSTRAINT kolaboratif_desc_length CHECK (
    kolaboratif_desc IS NULL OR char_length(kolaboratif_desc) >= 600
);

-- Add comments for documentation
COMMENT ON COLUMN penilaian.berorientasi_pelayanan_desc IS 'Deskripsi/alasan penilaian untuk core value Berorientasi Pelayanan (minimum 600 karakter)';
COMMENT ON COLUMN penilaian.akuntabel_desc IS 'Deskripsi/alasan penilaian untuk core value Akuntabel (minimum 600 karakter)';
COMMENT ON COLUMN penilaian.kompeten_desc IS 'Deskripsi/alasan penilaian untuk core value Kompeten (minimum 600 karakter)';
COMMENT ON COLUMN penilaian.harmonis_desc IS 'Deskripsi/alasan penilaian untuk core value Harmonis (minimum 600 karakter)';
COMMENT ON COLUMN penilaian.loyal_desc IS 'Deskripsi/alasan penilaian untuk core value Loyal (minimum 600 karakter)';
COMMENT ON COLUMN penilaian.adaptif_desc IS 'Deskripsi/alasan penilaian untuk core value Adaptif (minimum 600 karakter)';
COMMENT ON COLUMN penilaian.kolaboratif_desc IS 'Deskripsi/alasan penilaian untuk core value Kolaboratif (minimum 600 karakter)';
