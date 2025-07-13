-- Perbaikan constraint prestasi_score untuk mendukung nilai 0-100
-- (sebelumnya 1-100, tapi form menggunakan 0 atau 100 berdasarkan boolean)

-- Drop constraint lama yang membatasi 1-100
ALTER TABLE public.penilaian 
DROP CONSTRAINT IF EXISTS penilaian_prestasi_score_check;

-- Tambah constraint baru yang mendukung 0-100  
ALTER TABLE public.penilaian 
ADD CONSTRAINT penilaian_prestasi_score_check 
CHECK (prestasi_score >= 0 AND prestasi_score <= 100);