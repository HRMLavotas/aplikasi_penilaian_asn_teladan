-- Add integrity and achievement criteria fields to penilaian table
ALTER TABLE public.penilaian ADD COLUMN IF NOT EXISTS bebas_temuan BOOLEAN DEFAULT false;
ALTER TABLE public.penilaian ADD COLUMN IF NOT EXISTS tidak_hukuman_disiplin BOOLEAN DEFAULT false;
ALTER TABLE public.penilaian ADD COLUMN IF NOT EXISTS tidak_pemeriksaan_disiplin BOOLEAN DEFAULT false;
ALTER TABLE public.penilaian ADD COLUMN IF NOT EXISTS memiliki_inovasi BOOLEAN DEFAULT false;
ALTER TABLE public.penilaian ADD COLUMN IF NOT EXISTS bukti_inovasi TEXT;
ALTER TABLE public.penilaian ADD COLUMN IF NOT EXISTS memiliki_penghargaan BOOLEAN DEFAULT false;
ALTER TABLE public.penilaian ADD COLUMN IF NOT EXISTS bukti_penghargaan TEXT;

-- Update the calculate_persentase_akhir function to include integrity criteria bonus
CREATE OR REPLACE FUNCTION public.calculate_persentase_akhir()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Calculate weighted average (equal weights for now - can be adjusted)
  NEW.persentase_akhir := (
    NEW.kinerja_perilaku_score +
    NEW.inovasi_dampak_score +
    NEW.prestasi_score +
    NEW.inspiratif_score +
    NEW.komunikasi_score +
    NEW.kerjasama_kolaborasi_score +
    NEW.leadership_score +
    NEW.rekam_jejak_score +
    NEW.integritas_moralitas_score
  ) / 9.0;
  
  -- Add bonus for SKP criteria (max 10 points bonus)
  IF NEW.skp_2_tahun_terakhir_baik THEN
    NEW.persentase_akhir := NEW.persentase_akhir + 5;
  END IF;
  
  IF NEW.skp_peningkatan_prestasi THEN
    NEW.persentase_akhir := NEW.persentase_akhir + 5;
  END IF;
  
  -- Add bonus for integrity criteria (max 15 points bonus)
  IF NEW.bebas_temuan THEN
    NEW.persentase_akhir := NEW.persentase_akhir + 5;
  END IF;
  
  IF NEW.tidak_hukuman_disiplin THEN
    NEW.persentase_akhir := NEW.persentase_akhir + 5;
  END IF;
  
  IF NEW.tidak_pemeriksaan_disiplin THEN
    NEW.persentase_akhir := NEW.persentase_akhir + 5;
  END IF;
  
  -- Add bonus for achievements (max 10 points bonus)
  IF NEW.memiliki_inovasi AND NEW.bukti_inovasi IS NOT NULL AND NEW.bukti_inovasi != '' THEN
    NEW.persentase_akhir := NEW.persentase_akhir + 5;
  END IF;
  
  IF NEW.memiliki_penghargaan AND NEW.bukti_penghargaan IS NOT NULL AND NEW.bukti_penghargaan != '' THEN
    NEW.persentase_akhir := NEW.persentase_akhir + 5;
  END IF;
  
  -- Ensure it doesn't exceed 100
  IF NEW.persentase_akhir > 100 THEN
    NEW.persentase_akhir := 100;
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
